import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();
    const params = new URL(req.url).searchParams;
    const q = (params.get("q") || "").trim().slice(0, 60);
    const includeFollowing = params.get("all") === "1";
    const db = adminDb();
    const { data: follows, error: followError } = await db.from("follows").select("following_id").eq("follower_id", user.id);
    if (followError) return NextResponse.json({ error: followError.message }, { status: 400 });
    const following = (follows || []).map((row: any) => row.following_id);
    let query = db.from("profiles").select("id,username,display_name,bio,avatar_url,is_private").neq("id", user.id).order("created_at", { ascending: false }).limit(100);
    if (q) query = query.ilike("display_name", "%" + q + "%");
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const people = (data || []).filter((person: any) => !person.is_private || following.includes(person.id))
      .filter((person: any) => includeFollowing || !following.includes(person.id))
      .map(({ is_private, ...person }: any) => person);
    return NextResponse.json({ people });
  } catch {
    return NextResponse.json({ error: "Unable to load members." }, { status: 503 });
  }
}
