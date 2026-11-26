"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flower2, Eye, EyeOff, CheckCircle2, ChevronLeft, ChevronRight, Users, ShieldCheck, Sparkles } from "lucide-react";

const gallery = [
  { src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1000&q=85", alt: "Green mountain lake surrounded by forest", label: "Find your calm" },
  { src: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1000&q=85", alt: "Golden retriever enjoying the outdoors", label: "Little moments" },
  { src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&q=85", alt: "Open sky above a peaceful landscape", label: "Chase the horizon" },
  { src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000&q=85", alt: "Friends spending time together outdoors", label: "Better together" },
  { src: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1000&q=85", alt: "Soft flowers in a sunlit garden", label: "Notice the beauty" },
  { src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1000&q=85", alt: "A relaxed cat enjoying a quiet moment", label: "Every kind of joy" },
];

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
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActivePhoto((current) => (current + 1) % gallery.length), 4800);
    return () => window.clearInterval(timer);
  }, []);

  function movePhoto(direction: number) {
    setActivePhoto((current) => (current + direction + gallery.length) % gallery.length);
  }

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
    <div className="th-auth-orb th-auth-orb-one" />
    <div className="th-auth-orb th-auth-orb-two" />
    <header className="th-auth-header">
      <a className="th-auth-brand" href="/"><span className="th-auth-brand-mark"><Flower2 size={27}/></span><b>THRYV</b></a>
      <span className="th-auth-header-note">A little more connected.</span>
    </header>

    <div className="th-auth-layout">
      <section className="th-auth-story">
        <div className="th-auth-copy">
          <span className="th-kicker">YOUR SPACE TO CONNECT</span>
          <h1>Connect. Share.<br/><em>Belong.</em></h1>
          <p>A social space where your thoughts find their people. Share moments, discover new perspectives and enjoy the little things together.</p>
          <div className="th-auth-perks">
            <span><Users size={14}/> Find your people</span>
            <span><ShieldCheck size={14}/> Your space, your choice</span>
            <span><Sparkles size={14}/> Be yourself</span>
          </div>
        </div>

        <div className="th-auth-gallery" aria-label="THRYV photo carousel">
          <button type="button" className="th-gallery-arrow th-gallery-prev" onClick={() => movePhoto(-1)} aria-label="Previous photo"><ChevronLeft size={21}/></button>
          <div className="th-gallery-stage">
            {[-2, -1, 0, 1, 2].map((offset) => {
              const index = (activePhoto + offset + gallery.length) % gallery.length;
              return <button
                type="button"
                key={offset}
                className={`th-gallery-card th-gallery-card-${offset + 2} ${offset === 0 ? "is-active" : ""}`}
                onClick={() => setActivePhoto(index)}
                aria-label={`Show photo: ${gallery[index].label}`}
                aria-current={offset === 0 ? "true" : undefined}
              >
                <img src={gallery[index].src} alt={gallery[index].alt} />
                {offset === 0 && <span className="th-gallery-caption">{gallery[index].label}</span>}
              </button>;
            })}
          </div>
          <button type="button" className="th-gallery-arrow th-gallery-next" onClick={() => movePhoto(1)} aria-label="Next photo"><ChevronRight size={21}/></button>
          <div className="th-gallery-dots">
            {gallery.map((photo, index) => <button type="button" key={photo.label} onClick={() => setActivePhoto(index)} className={index === activePhoto ? "active" : ""} aria-label={`Go to photo ${index + 1}`} />)}
          </div>
        </div>

        <div className="th-auth-story-foot"><span className="th-auth-avatar-stack"><i>✦</i><i>♡</i><i>☼</i></span><span><b>A place for every side of you</b><small>Connect · Create · Thrive</small></span></div>
      </section>

      <section className="th-auth-form-wrap">
        <form className="th-auth-form" onSubmit={submit}>
          <div className="th-auth-form-brand"><span className="th-auth-brand-mark"><Flower2 size={25}/></span><b>THRYV</b></div>
          <span className="th-kicker">{mode === "login" ? "WELCOME BACK" : "START YOUR JOURNEY"}</span>
          <h2>{mode === "login" ? "Welcome back!" : "Create your account"}</h2>
          <p>{mode === "login" ? "Sign in to continue your journey." : "Set up your profile and meet your community."}</p>
          {mode === "signup" && <>
            <label>Display name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} required maxLength={60} placeholder="How people will know you"/></label>
            <label>Username<input value={username} onChange={e=>setUsername(e.target.value)} required minLength={3} maxLength={24} pattern="[A-Za-z0-9_.]+" placeholder="Choose a unique username"/></label>
            <label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"/></label>
          </>}
          {mode === "login" && <label>Email or username<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required placeholder="Username or Email"/></label>}
          <label>Password<div className="th-auth-password"><input autoComplete={mode === "login" ? "current-password" : "new-password"} type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={mode==="signup"?8:1} placeholder="Password"/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
          {mode === "login" && <div className="th-auth-remember"><label><input type="checkbox"/> Remember me</label><span>Secure sign in</span></div>}
          {error && <div className="th-auth-error">{error}</div>}
          {success && <div className="th-auth-success"><CheckCircle2 size={15}/>{success}</div>}
          <button className="th-primary th-auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Login →" : "Create account →"}</button>
          <div className="th-auth-switch">{mode === "login" ? "Don’t have an account?" : "Already have an account?"} <button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setSuccess("");}}>{mode==="login"?"Sign up":"Sign in"}</button></div>
          <small className="th-auth-note">Your profile, posts and messages stay linked to your account.</small>
        </form>
      </section>
    </div>
  </main>;
}
