export type Variant = {
  id: string;
  label: string;
  price: number;
};

export type Category = {
  id: string;
  name: string;
  image_url: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  unit_label: string;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  tags: string[];
  variants: Variant[];
  sort_order: number;
};

export type DayHours = { open: boolean; start: string; end: string };
/** Keys "0".."6" = Sunday..Saturday */
export type WeeklyHours = Record<string, DayHours>;

export type BusinessSettings = {
  phone: string;
  email: string;
  instagram_url: string;
  facebook_url: string;
  pickup_address: string;
  pickup_notes: string;
  accepting_orders: boolean;
  closed_message: string;
  min_lead_hours: number;
  max_days_ahead: number;
  slot_interval_minutes: number;
  weekly_hours: WeeklyHours;
  /** IANA zone the pickup hours are in, e.g. "Asia/Jerusalem" */
  time_zone: string;
  delivery_enabled: boolean;
  delivery_notes: string;
};

export type BlockedDate = { date: string; reason: string };

export const ORDER_STATUSES = ["new", "confirmed", "preparing", "ready", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  variant_label: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  notes: string;
  fulfillment_type: "pickup" | "delivery";
  delivery_address: string | null;
  pickup_date: string;
  pickup_time: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type OrderSummary = {
  id: string;
  order_number: number;
  customer_name: string;
  fulfillment_type: "pickup" | "delivery";
  pickup_date: string;
  pickup_time: string;
  status: OrderStatus;
  total: number;
  items: { product_name: string; variant_label: string | null; quantity: number; line_total: number }[];
};

/** Result of every server action: success with optional data, or a user-facing error. */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
