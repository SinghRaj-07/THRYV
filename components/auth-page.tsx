"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flower2, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const payload = mode === "signup" ? { email, username, display_name: displayName, password } : { username: username || email, password };
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Unable to continue."); return; }
      if (mode === "signup") setSuccess("Your THRYV account is ready. Opening your space…");
      router.push("/"); router.refresh();
    } catch { setError("Could not connect. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="th-auth-scene">
    <Link href="/" className="th-auth-back"><ArrowLeft size={16}/> Back to THRYV</Link>
    <div className="th-auth-layout">
      <section className="th-auth-story">
        <div className="th-auth-logo"><Flower2 size={29}/><b>THRYV</b></div>
        <div><span className="th-kicker">YOUR SPACE TO CONNECT</span><h1>Your world.<br/>Your people.</h1><p>Share moments, find your people and build meaningful connections — one story at a time.</p></div>
        <div className="th-auth-photo"/>
        <div className="th-auth-foot">Connect · Create · Thrive</div>
      </section>
      <section className="th-auth-form-wrap">
        <form className="th-auth-form" onSubmit={submit}>
          <span className="th-kicker">{mode === "login" ? "WELCOME BACK" : "START YOUR JOURNEY"}</span>
          <h2>{mode === "login" ? "Sign in to THRYV" : "Create your account"}</h2>
          <p>{mode === "login" ? "Pick up where you left off." : "Set up your profile and meet your community."}</p>
          {mode === "signup" && <>
            <label>Display name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} required maxLength={60} placeholder="How people will know you"/></label>
            <label>Username<input value={username} onChange={e=>setUsername(e.target.value)} required minLength={3} maxLength={24} pattern="[A-Za-z0-9_.]+" placeholder="Choose a unique username"/></label>
            <label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"/></label>
          </>}
          {mode === "login" && <label>Email or username<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required placeholder="Email or assigned username"/></label>}
          <label>Password<div className="th-auth-password"><input autoComplete={mode === "login" ? "current-password" : "new-password"} type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={mode==="signup"?8:1} placeholder={mode==="signup"?"At least 8 characters":"Enter your password"}/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
          {error && <div className="th-auth-error">{error}</div>}
          {success && <div className="th-auth-success"><CheckCircle2 size={15}/>{success}</div>}
          <button className="th-primary th-auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
          <div className="th-auth-switch">{mode === "login" ? "New to THRYV?" : "Already have an account?"} <button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setSuccess("");}}>{mode==="login"?"Create account":"Sign in"}</button></div>
          <small className="th-auth-note">Your profile, posts and messages stay linked to your account.</small>
        </form>
      </section>
    </div>
  </main>;
}
