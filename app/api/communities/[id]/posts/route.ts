import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) return unauthorized();
  const { id } = await params; const db = adminDb();
  const { data: community } = await db.from("communities").select("is_private").eq("id", id).maybeSingle();
  if (!community) return NextResponse.json({ error: "Community not found." }, { status: 404 });
  if (community.is_private) {
    const { data: member } = await db.from("community_members").select("user_id").eq("community_id", id).eq("user_id", user.id).maybeSingle();
    if (!member) return NextResponse.json({ error: "Join this private community to view posts." }, { status: 403 });
  }
  const { data, error } = await db.from("community_posts").select("*,profiles(display_name,username,avatar_url)").eq("community_id", id).order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ posts: data || [] });
}
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) return unauthorized();
  const { id } = await params; const body = await req.json();
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 3000) : "";
  if (!content) return NextResponse.json({ error: "Write a post first." }, { status: 400 });
  const db = adminDb();
  const { data: member } = await db.from("community_members").select("user_id").eq("community_id", id).eq("user_id", user.id).maybeSingle();
  if (!member) return NextResponse.json({ error: "Join the community before posting." }, { status: 403 });
  const { data, error } = await db.from("community_posts").insert({ community_id: id, user_id: user.id, content }).select("*,profiles(display_name,username,avatar_url)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ post: data }, { status: 201 });
}
