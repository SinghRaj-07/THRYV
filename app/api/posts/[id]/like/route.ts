import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) return unauthorized();
  const { id } = await params; const db = adminDb();
  const { data: post } = await db.from("posts").select("user_id").eq("id", id).maybeSingle();
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const { data: existing } = await db.from("likes").select("id").eq("post_id", id).eq("user_id", user.id).maybeSingle();
  if (existing) {
    const { error } = await db.from("likes").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ liked: false });
  }
  const { error } = await db.from("likes").insert({ post_id: id, user_id: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await createNotification(post.user_id, user.id, "like", id);
  return NextResponse.json({ liked: true });
}
