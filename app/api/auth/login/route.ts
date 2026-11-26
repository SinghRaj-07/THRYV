import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const allowedUsername = process.env.THRYV_SINGLE_USER_USERNAME;
    const allowedPassword = process.env.THRYV_SINGLE_USER_PASSWORD;

    if (!allowedUsername || !allowedPassword || !process.env.THRYV_SESSION_SECRET) {
      return NextResponse.json({ error: "Private login is not configured. Check the THRYV login environment variables in Vercel." }, { status: 503 });
    }

    if (typeof username !== "string" || typeof password !== "string"
      || !safeEqual(username.trim().toLowerCase(), allowedUsername.trim().toLowerCase())
      || !safeEqual(password, allowedPassword)) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const token = await createSession(allowedUsername);
    const response = NextResponse.json({ user: { username: allowedUsername } });
    response.cookies.set("thryv_access", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Sign in failed. Please try again." }, { status: 503 });
  }
}
