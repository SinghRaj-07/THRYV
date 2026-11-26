import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
export async function GET(req: Request) {
  const user = await currentUser(); if (!user) return unauthorized();
  const peer = new URL(req.url).searchParams.get("with"); const db = adminDb();
  let query = db.from("messages").select("*").or("sender_id.eq."+user.id+",recipient_id.eq."+user.id).order("created_at").limit(200);
  if (peer) query = db.from("messages").select("*").or("and(sender_id.eq."+user.id+",recipient_id.eq."+peer+"),and(sender_id.eq."+peer+",recipient_id.eq."+user.id+")").order("created_at").limit(200);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ messages: data || [] });
}
export async function POST(req: Request) {
  const user = await currentUser(); if (!user) return unauthorized();
  const body = await req.json(); const recipient = typeof body.recipient_id === "string" ? body.recipient_id : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!recipient || recipient === user.id || !content) return NextResponse.json({ error: "Choose a person and enter a message." }, { status: 400 });
  if (content.length > 4000) return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  const db = adminDb();
  const { data: target } = await db.from("profiles").select("id").eq("id", recipient).maybeSingle();
  if (!target) return NextResponse.json({ error: "That member is not available." }, { status: 404 });
  const { data, error } = await db.from("messages").insert({ sender_id: user.id, recipient_id: recipient, content }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await createNotification(recipient, user.id, "message", data.id);
  return NextResponse.json({ message: data }, { status: 201 });
}
