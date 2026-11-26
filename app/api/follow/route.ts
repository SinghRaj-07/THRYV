import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { following_id } = await req.json();
  if (!following_id || following_id === user.id) return NextResponse.json({ error: "Choose another account." }, { status: 400 });
  const db = adminDb();
  const { data: target } = await db.from("profiles").select("id").eq("id", following_id).maybeSingle();
  if (!target) return NextResponse.json({ error: "This account is not available." }, { status: 404 });
  const { data: existing } = await db.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", following_id).maybeSingle();
  if (existing) {
    const { error } = await db.from("follows").delete().eq("follower_id", user.id).eq("following_id", following_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ following: false });
  }
  const { error } = await db.from("follows").insert({ follower_id: user.id, following_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await createNotification(following_id, user.id, "follow");
  return NextResponse.json({ following: true });
}
