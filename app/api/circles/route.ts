import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";
export async function GET() {
  const user = await currentUser(); if (!user) return unauthorized();
  const db = adminDb();
  const { data: memberships, error } = await db.from("circle_members").select("circle_id,role").eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Circles are not set up yet. Apply the THRYV groups migration in Supabase." }, { status: 503 });
  const ids = (memberships || []).map((m: any) => m.circle_id);
  if (!ids.length) return NextResponse.json({ circles: [] });
  const { data, error: circleError } = await db.from("circles").select("*").in("id", ids).order("created_at", { ascending: false });
  if (circleError) return NextResponse.json({ error: circleError.message }, { status: 400 });
  const circles = await Promise.all((data || []).map(async (circle: any) => {
    const { count } = await db.from("circle_members").select("user_id", { count: "exact", head: true }).eq("circle_id", circle.id);
    return { ...circle, role: memberships?.find((m: any) => m.circle_id === circle.id)?.role, member_count: count || 0 };
  }));
  return NextResponse.json({ circles });
}
export async function POST(req: Request) {
  const user = await currentUser(); if (!user) return unauthorized();
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 48) : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 240) : "";
  if (name.length < 2) return NextResponse.json({ error: "Circle name must be at least 2 characters." }, { status: 400 });
  const db = adminDb();
  const { data: circle, error } = await db.from("circles").insert({ owner_id: user.id, name, description }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { error: memberError } = await db.from("circle_members").insert({ circle_id: circle.id, user_id: user.id, role: "owner" });
  if (memberError) { await db.from("circles").delete().eq("id", circle.id); return NextResponse.json({ error: memberError.message }, { status: 400 }); }
  return NextResponse.json({ circle: { ...circle, role: "owner", member_count: 1 } }, { status: 201 });
}
