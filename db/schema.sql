-- Store schema. Plain Postgres (Neon in production, PGlite locally). Idempotent: safe to re-run.
-- The app talks to the database only from the server, so there is no row-level security;
-- every admin write goes through a server action that checks the admin session first.

-- ───────── admin ─────────
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- ───────── images (uploaded product photos live in the database: no extra storage service) ─────────
create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  data bytea not null,
  created_at timestamptz not null default now()
);

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────── catalog ─────────
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 40),
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories (id) on delete set null,
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  unit_label text not null default '',
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  tags text[] not null default '{}',
  -- Optional price options: [{"id":"single","label":"יחידה","price":20}]
  variants jsonb not null default '[]'::jsonb check (jsonb_typeof(variants) = 'array'),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on products (category_id, sort_order);
create or replace trigger products_touch before update on products
  for each row execute function touch_updated_at();

-- ───────── settings (one row) ─────────
create table if not exists business_settings (
  id int primary key default 1 check (id = 1),
  phone text not null default '',
  email text not null default '',
  instagram_url text not null default '',
  facebook_url text not null default '',
  pickup_address text not null default '',
  pickup_notes text not null default '',
  accepting_orders boolean not null default true,
  closed_message text not null default '',
  min_lead_hours int not null default 24 check (min_lead_hours between 0 and 336),
  max_days_ahead int not null default 21 check (max_days_ahead between 1 and 120),
  slot_interval_minutes int not null default 30 check (slot_interval_minutes in (15, 30, 60, 90, 120)),
  -- keys "0".."6" = Sunday..Saturday → {"open":bool,"start":"HH:MM","end":"HH:MM"}
  weekly_hours jsonb not null default '{"0":{"open":true,"start":"09:00","end":"18:00"},"1":{"open":true,"start":"09:00","end":"18:00"},"2":{"open":true,"start":"09:00","end":"18:00"},"3":{"open":true,"start":"09:00","end":"18:00"},"4":{"open":true,"start":"09:00","end":"18:00"},"5":{"open":false,"start":"09:00","end":"13:00"},"6":{"open":false,"start":"09:00","end":"13:00"}}'::jsonb,
  -- Wall-clock time zone for pickup rules
  time_zone text not null default 'Asia/Jerusalem',
  delivery_enabled boolean not null default false,
  -- Shown at checkout when delivery is chosen (area, fee arrangement)
  delivery_notes text not null default '',
  updated_at timestamptz not null default now()
);
alter table business_settings add column if not exists delivery_notes text not null default '';
insert into business_settings (id) values (1) on conflict (id) do nothing;
create or replace trigger settings_touch before update on business_settings
  for each row execute function touch_updated_at();

create table if not exists blocked_dates (
  date date primary key,
  reason text not null default '',
  created_at timestamptz not null default now()
);

-- ───────── orders ─────────
create sequence if not exists order_number_seq start 1001;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number int not null unique default nextval('order_number_seq'),
  customer_name text not null,
  phone text not null,
  notes text not null default '',
  fulfillment_type text not null default 'pickup' check (fulfillment_type in ('pickup', 'delivery')),
  delivery_address text,
  pickup_date date not null,
  pickup_time time not null,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  total numeric(10, 2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_idx on orders (status, pickup_date);
create index if not exists orders_created_idx on orders (created_at desc);
create or replace trigger orders_touch before update on orders
  for each row execute function touch_updated_at();

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null,
  variant_label text,
  unit_price numeric(10, 2) not null,
  quantity int not null check (quantity between 1 and 99),
  line_total numeric(10, 2) not null
);
create index if not exists order_items_order_idx on order_items (order_id);

-- ───────── place_order ─────────
-- The only way an order gets in: re-prices every line from the database and
-- re-validates the pickup slot. Errors are stable codes the storefront maps to copy.
-- For delivery orders the slot is the requested delivery time.
drop function if exists place_order(text, text, text, date, time, jsonb);
create or replace function place_order(
  p_customer_name text, p_phone text, p_notes text,
  p_pickup_date date, p_pickup_time time, p_items jsonb,
  p_fulfillment text default 'pickup', p_address text default null
)
returns jsonb
language plpgsql
as $$
declare
  s business_settings;
  v_name text := trim(coalesce(p_customer_name, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_notes text := left(trim(coalesce(p_notes, '')), 600);
  v_fulfillment text := coalesce(p_fulfillment, 'pickup');
  v_address text := nullif(left(trim(coalesce(p_address, '')), 200), '');
  v_now timestamp;
  v_pickup timestamp := p_pickup_date + p_pickup_time;
  v_day jsonb;
  v_item jsonb;
  v_product products;
  v_variant jsonb;
  v_qty int;
  v_price numeric(10, 2);
  v_total numeric(10, 2) := 0;
  v_order_id uuid;
  v_order_number int;
  v_lines jsonb := '[]'::jsonb;
begin
  select * into s from business_settings where id = 1;
  v_now := now() at time zone s.time_zone;
  if not s.accepting_orders then raise exception 'ORDERS_CLOSED'; end if;

  if char_length(v_name) < 2 or char_length(v_name) > 80 then raise exception 'INVALID_NAME'; end if;
  if v_phone like '+972%' then v_phone := '0' || substr(v_phone, 5); end if;
  if v_phone !~ '^0[0-9]{8,9}$' then raise exception 'INVALID_PHONE'; end if;

  if v_fulfillment not in ('pickup', 'delivery') then raise exception 'INVALID_FULFILLMENT'; end if;
  if v_fulfillment = 'delivery' then
    if not s.delivery_enabled then raise exception 'DELIVERY_DISABLED'; end if;
    if v_address is null or char_length(v_address) < 6 then raise exception 'INVALID_ADDRESS'; end if;
  else
    v_address := null;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 40 then raise exception 'TOO_MANY_ITEMS'; end if;

  if p_pickup_date is null or p_pickup_time is null then raise exception 'INVALID_SLOT'; end if;
  if exists (select 1 from blocked_dates where date = p_pickup_date) then raise exception 'DATE_BLOCKED'; end if;
  if p_pickup_date > (v_now::date + s.max_days_ahead) then raise exception 'DATE_TOO_FAR'; end if;
  v_day := s.weekly_hours -> extract(dow from p_pickup_date)::int::text;
  if v_day is null or not coalesce((v_day ->> 'open')::boolean, false) then raise exception 'DAY_CLOSED'; end if;
  if p_pickup_time < (v_day ->> 'start')::time or p_pickup_time > (v_day ->> 'end')::time then
    raise exception 'TIME_OUTSIDE_HOURS';
  end if;
  if v_pickup < v_now + make_interval(hours => s.min_lead_hours) then raise exception 'LEAD_TIME'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 50 then raise exception 'INVALID_QUANTITY'; end if;

    select * into v_product from products where id = (v_item ->> 'product_id')::uuid;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    if not v_product.is_available then raise exception 'PRODUCT_UNAVAILABLE:%', v_product.name; end if;

    v_variant := null;
    if jsonb_array_length(v_product.variants) > 0 then
      select v into v_variant from jsonb_array_elements(v_product.variants) v
        where v ->> 'id' = v_item ->> 'variant_id';
      if v_variant is null then raise exception 'VARIANT_REQUIRED:%', v_product.name; end if;
      v_price := (v_variant ->> 'price')::numeric;
    else
      v_price := v_product.price;
    end if;

    v_total := v_total + v_price * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id, 'product_name', v_product.name,
      'variant_label', v_variant ->> 'label', 'unit_price', v_price, 'quantity', v_qty);
  end loop;

  insert into orders (customer_name, phone, notes, fulfillment_type, delivery_address, pickup_date, pickup_time, total)
  values (v_name, v_phone, v_notes, v_fulfillment, v_address, p_pickup_date, p_pickup_time, v_total)
  returning id, order_number into v_order_id, v_order_number;

  insert into order_items (order_id, product_id, product_name, variant_label, unit_price, quantity, line_total)
  select v_order_id, (l ->> 'product_id')::uuid, l ->> 'product_name', l ->> 'variant_label',
         (l ->> 'unit_price')::numeric, (l ->> 'quantity')::int,
         (l ->> 'unit_price')::numeric * (l ->> 'quantity')::int
  from jsonb_array_elements(v_lines) l;

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_total);
end;
$$;
