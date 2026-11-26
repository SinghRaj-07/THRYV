import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const db = adminDb();
    const { data: profile, error } = await db.from("profiles").select("*").eq("id", user.id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    const [posts, followers, following] = await Promise.all([
      db.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      db.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", user.id),
      db.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", user.id)
    ]);
    return NextResponse.json({ user, profile: { ...profile, post_count: posts.count || 0, followers_count: followers.count || 0, following_count: following.count || 0 } });
  } catch {
    return NextResponse.json({ error: "Unable to load profile. Check Supabase configuration." }, { status: 503 });
  }
}
export async function PATCH(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const body = await req.json(); const patch: Record<string, unknown> = {};
    if (typeof body.display_name === "string") patch.display_name = body.display_name.trim().slice(0, 60);
    if (typeof body.bio === "string") patch.bio = body.bio.trim().slice(0, 240);
    if (typeof body.avatar_url === "string" || body.avatar_url === null) patch.avatar_url = body.avatar_url;
    if (typeof body.is_private === "boolean") patch.is_private = body.is_private;
    if (!Object.keys(patch).length) return NextResponse.json({ error: "No valid profile fields supplied." }, { status: 400 });
    const { data, error } = await adminDb().from("profiles").update(patch).eq("id", user.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
