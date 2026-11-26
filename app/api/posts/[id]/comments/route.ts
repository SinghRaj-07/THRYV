import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) return unauthorized();
  const { id } = await params;
  const { data, error } = await adminDb().from("comments").select("*,profiles(display_name,avatar_url)").eq("post_id", id).order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ comments: data });
}
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) return unauthorized();
  const { id } = await params; const { content } = await req.json();
  if (typeof content !== "string" || !content.trim()) return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
  const db = adminDb();
  const { data: post } = await db.from("posts").select("user_id").eq("id", id).maybeSingle();
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const { data, error } = await db.from("comments").insert({ post_id: id, user_id: user.id, content: content.trim().slice(0, 1000) }).select("*,profiles(display_name,avatar_url)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await createNotification(post.user_id, user.id, "comment", id);
  return NextResponse.json({ comment: data }, { status: 201 });
}
