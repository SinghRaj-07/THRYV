import { NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth";
import { adminDb } from "@/lib/supabase";
export async function GET() {
  const user = await currentUser(); if (!user) return unauthorized();
  const db = adminDb();
  const { data: memberships, error: memberError } = await db.from("community_members").select("community_id,role").eq("user_id", user.id);
  if (memberError) return NextResponse.json({ error: "Communities are not set up yet. Apply the THRYV groups migration in Supabase." }, { status: 503 });
  const joinedIds = (memberships || []).map((m: any) => m.community_id);
  const { data, error } = await db.from("communities").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const communities = (data || []).filter((c: any) => !c.is_private || joinedIds.includes(c.id));
  const results = await Promise.all(communities.map(async (community: any) => {
    const { count } = await db.from("community_members").select("user_id", { count: "exact", head: true }).eq("community_id", community.id);
    return { ...community, joined: joinedIds.includes(community.id), member_count: count || 0 };
  }));
  return NextResponse.json({ communities: results });
}
export async function POST(req: Request) {
  const user = await currentUser(); if (!user) return unauthorized();
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) : "";
  const isPrivate = body.is_private === true;
  if (name.length < 2) return NextResponse.json({ error: "Community name must be at least 2 characters." }, { status: 400 });
  const db = adminDb(); const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 35) || "community";
  const slug = base + "-" + crypto.randomUUID().slice(0, 8);
  const { data: community, error } = await db.from("communities").insert({ created_by: user.id, name, slug, description, is_private: isPrivate }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { error: memberError } = await db.from("community_members").insert({ community_id: community.id, user_id: user.id, role: "owner" });
  if (memberError) { await db.from("communities").delete().eq("id", community.id); return NextResponse.json({ error: memberError.message }, { status: 400 }); }
  return NextResponse.json({ community: { ...community, joined: true, member_count: 1 } }, { status: 201 });
}
