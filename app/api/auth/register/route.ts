import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { adminDb } from "@/lib/supabase";

export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "") : "";
    const displayName = typeof body.display_name === "string" ? body.display_name.trim().slice(0, 60) : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (!/^[a-z0-9_.]{3,24}$/.test(username)) return NextResponse.json({ error: "Username must be 3–24 characters (letters, numbers, _ or .)." }, { status: 400 });
    if (!displayName) return NextResponse.json({ error: "Enter your display name." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
    const db = adminDb();
    const { data: existing } = await db.from("profiles").select("id").eq("username", username).maybeSingle();
    if (existing) return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username, display_name: displayName } });
    if (error || !data.user) return NextResponse.json({ error: error?.message || "Could not create your account." }, { status: 400 });
    const { error: profileError } = await db.from("profiles").update({ username, display_name: displayName }).eq("id", data.user.id);
    if (profileError) return NextResponse.json({ error: "Account created, but profile setup failed. Please sign in and complete your profile." }, { status: 500 });
    const token = await createSession(data.user.id);
    const response = NextResponse.json({ user: { id: data.user.id, email: data.user.email, username } }, { status: 201 });
    response.cookies.set("thryv_access", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Registration failed. Check Supabase configuration." }, { status: 503 });
  }
}
