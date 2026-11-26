import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createSession } from "@/lib/session";
import { adminDb } from "@/lib/supabase";

export const runtime = "nodejs";
function safeEqual(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function privateEmail(username: string) {
  return `${username.toLowerCase().replace(/[^a-z0-9._-]/g, "")}@thryv.app`;
}
async function privateAccount(username: string, password: string) {
  const db = adminDb();
  const email = privateEmail(username);
  const { data: created, error: createError } = await db.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { username, display_name: username }
  });
  let user = created.user;
  if (!user && createError) {
    const { data: listed, error: listError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;
    user = listed.users.find((item) => item.email?.toLowerCase() === email)?.id
      ? listed.users.find((item) => item.email?.toLowerCase() === email)!
      : null;
    if (!user) throw createError;
    const { data: updated, error: updateError } = await db.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (updateError) throw updateError;
    user = updated.user;
  }
  if (!user) throw new Error("Could not create private account");
  await db.from("profiles").update({ username, display_name: username }).eq("id", user.id);
  return user;
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password) return NextResponse.json({ error: "Enter your username/email and password." }, { status: 400 });
    const allowedUsername = process.env.THRYV_SINGLE_USER_USERNAME;
    const allowedPassword = process.env.THRYV_SINGLE_USER_PASSWORD;
    let user;
    if (allowedUsername && allowedPassword &&
      safeEqual(username.toLowerCase(), allowedUsername.trim().toLowerCase()) &&
      safeEqual(password, allowedPassword)) {
      user = await privateAccount(allowedUsername, allowedPassword);
    } else {
      const db = adminDb();
      let email = username;
      if (!username.includes("@")) {
        const { data: profile } = await db.from("profiles").select("id").eq("username", username.toLowerCase()).maybeSingle();
        if (!profile) return NextResponse.json({ error: "No account found with that username." }, { status: 401 });
        const { data: account, error: accountError } = await db.auth.admin.getUserById(profile.id);
        if (accountError || !account.user.email) return NextResponse.json({ error: "This account has no sign-in email." }, { status: 401 });
        email = account.user.email;
      }
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error || !data.user) return NextResponse.json({ error: "Invalid email/username or password." }, { status: 401 });
      user = data.user;
    }
    const token = await createSession(user.id);
    const response = NextResponse.json({ user: { id: user.id, email: user.email, username: user.user_metadata?.username } });
    response.cookies.set("thryv_access", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sign in failed. Check Supabase configuration." }, { status: 503 });
  }
}
