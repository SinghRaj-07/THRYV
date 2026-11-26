import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) return unauthorized();
  const { id } = await params; const db = adminDb();
  const { data: post } = await db.from("posts").select("user_id").eq("id", id).maybeSingle();
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const { data, error } = await db.from("shares").insert({ post_id: id, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await createNotification(post.user_id, user.id, "share", id);
  return NextResponse.json({ share: data }, { status: 201 });
}
