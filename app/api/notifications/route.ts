import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";
export async function GET() {
  const user = await currentUser(); if (!user) return unauthorized();
  const { data, error } = await adminDb().from("notifications")
    .select("*,actor:profiles!notifications_actor_id_fkey(display_name,username,avatar_url)")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ notifications: data || [] });
}
export async function PATCH() {
  const user = await currentUser(); if (!user) return unauthorized();
  const { error } = await adminDb().from("notifications").update({ read: true }).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
