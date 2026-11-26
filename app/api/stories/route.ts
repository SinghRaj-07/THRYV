import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const db = adminDb();
  const { data: following, error: followError } = await db.from("follows").select("following_id").eq("follower_id", user.id);
  if (followError) return NextResponse.json({ error: followError.message }, { status: 400 });
  const allowed = [user.id, ...(following || []).map((row: any) => row.following_id)];
  const { data, error } = await db.from("stories").select("*,profiles(display_name,avatar_url,is_private)").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const stories = (data || []).filter((story: any) => !story.profiles?.is_private || allowed.includes(story.user_id));
  return NextResponse.json({ stories });
}
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const body = await req.json();
  if (typeof body.media_url !== "string" || !body.media_url.startsWith("http")) return NextResponse.json({ error: "Upload story media first." }, { status: 400 });
  const { data, error } = await adminDb().from("stories").insert({ user_id: user.id, media_url: body.media_url }).select("*,profiles(display_name,avatar_url)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ story: data }, { status: 201 });
}
