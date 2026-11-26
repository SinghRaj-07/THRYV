import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) return unauthorized();
  const { id } = await params; const db = adminDb();
  const { data: community } = await db.from("communities").select("id,is_private").eq("id", id).maybeSingle();
  if (!community) return NextResponse.json({ error: "Community not found." }, { status: 404 });
  if (community.is_private) return NextResponse.json({ error: "This community is private. Ask an owner for an invitation." }, { status: 403 });
  const { error } = await db.from("community_members").upsert({ community_id: id, user_id: user.id, role: "member" }, { onConflict: "community_id,user_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ joined: true });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) return unauthorized();
  const { id } = await params; const db = adminDb();
  const { data: community } = await db.from("communities").select("created_by").eq("id", id).maybeSingle();
  if (!community) return NextResponse.json({ error: "Community not found." }, { status: 404 });
  if (community.created_by === user.id) return NextResponse.json({ error: "The creator cannot leave their own community." }, { status: 400 });
  const { error } = await db.from("community_members").delete().eq("community_id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ joined: false });
}
