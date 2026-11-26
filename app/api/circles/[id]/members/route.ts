import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) return unauthorized();
  const { id } = await params; const body = await req.json();
  const username = typeof body.username === "string" ? body.username.trim().replace(/^@/, "").toLowerCase() : "";
  if (!username) return NextResponse.json({ error: "Enter the member's username." }, { status: 400 });
  const db = adminDb();
  const { data: circle } = await db.from("circles").select("owner_id").eq("id", id).maybeSingle();
  if (!circle || circle.owner_id !== user.id) return NextResponse.json({ error: "Only the circle owner can add members." }, { status: 403 });
  const { data: member } = await db.from("profiles").select("id,username,display_name").eq("username", username).maybeSingle();
  if (!member) return NextResponse.json({ error: "No member found with that username." }, { status: 404 });
  const { error } = await db.from("circle_members").upsert({ circle_id: id, user_id: member.id, role: "member" }, { onConflict: "circle_id,user_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ member });
}
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) return unauthorized();
  const { id } = await params; const target = new URL(req.url).searchParams.get("user_id") || user.id; const db = adminDb();
  const { data: circle } = await db.from("circles").select("owner_id").eq("id", id).maybeSingle();
  if (!circle) return NextResponse.json({ error: "Circle not found." }, { status: 404 });
  if (target !== user.id && circle.owner_id !== user.id) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (target === circle.owner_id) return NextResponse.json({ error: "The owner cannot leave without transferring ownership." }, { status: 400 });
  const { error } = await db.from("circle_members").delete().eq("circle_id", id).eq("user_id", target);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
