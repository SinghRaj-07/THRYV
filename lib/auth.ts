import { cookies } from "next/headers";
import { adminDb } from "./supabase";
import { getSessionSubject } from "./session";

export async function currentUser() {
  const token = (await cookies()).get("thryv_access")?.value;
  const userId = await getSessionSubject(token);
  if (!userId) return null;
  const { data, error } = await adminDb().auth.admin.getUserById(userId);
  return error ? null : data.user;
}
export function unauthorized() {
  return Response.json({ error: "Authentication required" }, { status: 401 });
}
