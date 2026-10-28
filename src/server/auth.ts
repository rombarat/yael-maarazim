import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { queryOne } from "./db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";

export type Admin = { id: string; email: string };

/** The signed-in admin, re-checked against the database so a deleted admin loses access at once. */
export async function getAdmin(): Promise<Admin | null> {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  return queryOne<Admin>("select id::text, email from admin_users where id = $1", [session.sub]);
}

/** For server pages: bounce to the login screen. */
export async function requireAdminPage(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export class UnauthorizedError extends Error {}

/** For server actions and route handlers. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) throw new UnauthorizedError("Not signed in");
  return admin;
}

export async function startSession(admin: Admin) {
  (await cookies()).set(SESSION_COOKIE, await signSession({ sub: admin.id, email: admin.email }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
