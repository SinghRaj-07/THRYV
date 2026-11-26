"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Home, Search, Flower2, Users, MessageSquare, Bell, Bookmark, UserRound, Settings, Compass, Plus, Image as ImageIcon, Video, Smile, Heart, MessageCircle, Share2, MoreHorizontal, ArrowRight, CalendarDays, LogOut, Send, Globe, Camera, X, Sparkles } from "lucide-react";

type Profile = { id:string; username?:string; display_name?:string; bio?:string; avatar_url?:string; is_private?:boolean };
type Post = { id:string; user_id:string; content:string; media_url?:string; media_type?:string; created_at:string; profiles?:{display_name?:string;username?:string;avatar_url?:string}; likes?:{user_id:string}[]; comments?:{id:string}[] };
type Story = { id:string; user_id:string; media_url:string; created_at:string; expires_at:string; profiles?:{display_name?:string;avatar_url?:string} };
type Person = Profile;
const nav = [
  ["Home","/",Home],["Explore","/explore",Compass],["Circles","/circles",Flower2],["Communities","/communities",Users],
  ["Messages","/messages",MessageSquare],["Notifications","/notifications",Bell],["Memories","/memories",Bookmark],["Profile","/profile",UserRound],["Settings","/settings",Settings]
] as const;
function Avatar({src,name,size=40}:{src?:string|null;name?:string;size?:number}) {
  if(src) return <img src={src} alt={name||"Profile"} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>;
  return <span className="th-avatar-fallback" style={{width:size,height:size,fontSize:size*.38}}>{(name||"T").trim().slice(0,1).toUpperCase()}</span>;
}
function Empty({title,body}:{title:string;body:string}) { return <div className="th-home-empty"><span><Sparkles size={20}/></span><b>{title}</b><p>{body}</p></div>; }

export default function Page() {
  const [user,setUser]=useState<any>(null),[profile,setProfile]=useState<Profile|null>(null);
  const [posts,setPosts]=useState<Post[]>([]),[stories,setStories]=useState<Story[]>([]),[suggestions,setSuggestions]=useState<Person[]>([]);
  const [text,setText]=useState(""),[search,setSearch]=useState(""),[comment,setComment]=useState<Record<string,string>>({});
  const [upload,setUpload]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[loading,setLoading]=useState(true);
  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try {
      const [meRes,postsRes,storiesRes,peopleRes]=await Promise.all([fetch("/api/me"),fetch("/api/posts"),fetch("/api/stories"),fetch("/api/people")]);
      if(meRes.ok){const d=await meRes.json();setUser(d.user);setProfile(d.profile||null);}
      else if(meRes.status===401){window.location.assign("/auth");return;}
      if(postsRes.ok){const d=await postsRes.json();setPosts(d.posts||[]);}
      if(storiesRes.ok){const d=await storiesRes.json();setStories(d.stories||[]);}
      if(peopleRes.ok){const d=await peopleRes.json();setSuggestions(d.people||[]);}
    } catch {setError("THRYV could not load right now. Check your connection and refresh.");}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  async function searchPosts(){const r=await fetch("/api/posts?q="+encodeURIComponent(search));if(r.ok){const d=await r.json();setPosts(d.posts||[]);}}
  async function publish(){
    if(!text.trim()&&!upload)return;setBusy(true);setError("");
    try {
      let media_url:string|undefined,media_type:string|undefined;
      if(upload){const fd=new FormData();fd.append("file",upload);const up=await fetch("/api/upload",{method:"POST",body:fd});const ud=await up.json();if(!up.ok)throw new Error(ud.error||"Upload failed");media_url=ud.url;media_type=ud.type;}
      const r=await fetch("/api/posts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:text.trim(),media_url,media_type})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not publish your post");
      setText("");setUpload(null);await load();
    } catch(e){setError(e instanceof Error?e.message:"Could not publish your post");}
    finally{setBusy(false);}
  }
  async function like(id:string){const r=await fetch("/api/posts/"+id+"/like",{method:"POST"});if(r.ok)load();}
  async function commentPost(id:string){const value=comment[id];if(!value?.trim())return;const r=await fetch("/api/posts/"+id+"/comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:value})});if(r.ok){setComment(old=>({...old,[id]:""}));load();}else{const d=await r.json();setError(d.error||"Comment could not be sent.");}}
  async function follow(id:string){const r=await fetch("/api/follow",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({following_id:id})});if(r.ok){setSuggestions(old=>old.filter(p=>p.id!==id));}else{const d=await r.json();setError(d.error||"Could not follow this member.");}}
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});window.location.assign("/auth");}
  const myStories=stories.filter(s=>s.user_id===user?.id);
  const firstName=(profile?.display_name||user?.user_metadata?.display_name||"there").split(" ")[0];
  const profileNeedsSetup=!profile?.display_name||!profile?.bio;
  return <main className="scene th-home-scene">
    <div className="layout th-home-layout">
      <aside className="leftcol glass th-home-sidebar">
        <Link href="/" className="th-home-brand"><Flower2 size={27}/><b>THRYV</b></Link>
        <nav className="th-home-nav">{nav.map(([label,href,Icon])=><Link key={label} href={href} className={"navitem "+(label==="Home"?"active":"")}><Icon size={17}/><span>{label}</span></Link>)}</nav>
        <div className="soft th-home-sidebar-card"><b>Create your circle</b><p className="muted">A space for people who matter to you.</p><Link href="/circles" className="darkpill"><Plus size={14}/> Create</Link></div>
        <button className="th-home-logout" onClick={logout}><LogOut size={15}/> Sign out</button>
      </aside>

      <section className="maincol th-home-main">
        <header className="topbar th-home-topbar">
          <div className="glass th-home-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchPosts()} placeholder="Search posts on THRYV…"/><button onClick={searchPosts} aria-label="Search"><ArrowRight size={16}/></button></div>
          <Link href="/notifications" className="glass th-home-icon" aria-label="Notifications"><Bell size={18}/></Link>
          <Link href="/profile" aria-label="Your profile"><Avatar src={profile?.avatar_url} name={profile?.display_name} size={39}/></Link>
        </header>

        <div className="th-home-welcome"><div><span className="th-kicker">YOUR COMMUNITY, YOUR SPACE</span><h1>Good to see you, {firstName}.</h1><p>What would you like to share today?</p></div><div className="th-welcome-orb"><Flower2 size={30}/></div></div>
        {profileNeedsSetup&&<div className="glass th-onboarding"><div className="th-onboarding-icon"><Sparkles size={18}/></div><div><b>Make THRYV yours</b><p>Add a display name and a short bio so people can recognise you.</p></div><Link href="/profile" className="darkpill">Complete profile <ArrowRight size={14}/></Link></div>}
        {error&&<div className="th-home-error">{error}<button onClick={()=>setError("")}><X size={14}/></button></div>}

        <section className="th-home-section">
          <div className="th-home-section-head"><div><h2>Stories</h2><p>Moments shared by your community</p></div><Link href="/stories">View all <ArrowRight size={14}/></Link></div>
          <div className="th-home-stories">
            <Link href="/stories" className="th-story-create"><span><Plus size={23}/></span><b>Your story</b><small>Share a moment</small></Link>
            {stories.map(s=><Link href="/stories" className="th-story-card" key={s.id}><img src={s.media_url} alt="Story"/><div className="th-story-user"><Avatar src={s.profiles?.avatar_url} name={s.profiles?.display_name} size={29}/><b>{s.profiles?.display_name||"THRYV member"}</b></div></Link>)}
            {stories.length===0&&<div className="th-story-empty">No active stories yet. Share the first one.</div>}
          </div>
        </section>

        <section className="glass th-composer">
          <div className="th-composer-top"><Avatar src={profile?.avatar_url} name={profile?.display_name} size={43}/><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="What's on your mind?" rows={2} maxLength={3000}/></div>
          {upload&&<div className="th-upload-chip">{upload.name}<button onClick={()=>setUpload(null)}><X size={13}/></button></div>}
          <div className="th-composer-actions"><label className="pill"><ImageIcon size={15}/> Photo / Video<input type="file" accept="image/*,video/*" hidden onChange={e=>setUpload(e.target.files?.[0]||null)}/></label><button className="pill" onClick={()=>setText(old=>old+" ✨")}><Smile size={15}/> Feeling</button><span/><button className="darkpill" disabled={busy||(!text.trim()&&!upload)} onClick={publish}>{busy?"Publishing…":"Share post"}</button></div>
        </section>

        <div className="th-home-section-head th-feed-heading"><div><h2>Your feed</h2><p>Posts from you and people you follow</p></div><button onClick={load}>Refresh</button></div>
        {loading?<div className="glass"><Empty title="Loading your feed" body="Getting the latest moments from your THRYV community."/></div>:posts.length===0?<div className="glass"><Empty title="Your feed is ready for its first post" body="Share something, or explore real members and follow people to build your feed."/></div>:posts.map(p=><article key={p.id} className="glass th-post-card">
          <div className="th-post-author"><Avatar src={p.profiles?.avatar_url} name={p.profiles?.display_name} size={42}/><div><b>{p.profiles?.display_name||"THRYV member"}</b><small>@{p.profiles?.username||"member"} · {new Date(p.created_at).toLocaleString()}</small></div><button className="th-post-more" aria-label="More options"><MoreHorizontal size={19}/></button></div>
          {p.content&&<p className="th-post-content">{p.content}</p>}
          {p.media_url&&(p.media_type==="video"?<video controls src={p.media_url} className="th-post-media"/>:<img src={p.media_url} className="th-post-media" alt="Post media"/>)}
          <div className="th-post-actions"><button onClick={()=>like(p.id)}><Heart size={17}/> {p.likes?.length||0}</button><button onClick={()=>document.getElementById("comment-"+p.id)?.focus()}><MessageCircle size={17}/> {p.comments?.length||0}</button><button onClick={async()=>{const r=await fetch("/api/posts/"+p.id+"/share",{method:"POST"});if(!r.ok){const d=await r.json();setError(d.error||"Share failed");}}}><Share2 size={17}/> Share</button></div>
          <form className="th-comment-form" onSubmit={e=>{e.preventDefault();commentPost(p.id)}}><input id={"comment-"+p.id} value={comment[p.id]||""} onChange={e=>setComment(old=>({...old,[p.id]:e.target.value}))} placeholder="Write a comment…"/><button disabled={!comment[p.id]?.trim()} aria-label="Send comment"><Send size={16}/></button></form>
        </article>)}
      </section>

      <aside className="rightcol th-home-right">
        <section className="glass th-right-card"><div className="th-right-heading"><b>People to discover</b><Link href="/explore">Explore <ArrowRight size={13}/></Link></div>
          {suggestions.slice(0,5).map(p=><div className="th-suggestion" key={p.id}><Avatar src={p.avatar_url} name={p.display_name} size={37}/><div><b>{p.display_name||"THRYV member"}</b><small>@{p.username||"member"}</small></div><button onClick={()=>follow(p.id)} aria-label={"Follow "+p.display_name}><Plus size={15}/></button></div>)}
          {suggestions.length===0&&<p className="th-right-empty">No new members to suggest yet. Check back as people join THRYV.</p>}
        </section>
        <section className="glass th-right-card th-quick-links"><b>Your shortcuts</b><Link href="/messages"><MessageSquare size={16}/> Messages</Link><Link href="/memories"><CalendarDays size={16}/> Memories</Link><Link href="/settings"><Settings size={16}/> Privacy & settings</Link></section>
        <p className="th-home-footer">THRYV · Connect. Create. Thrive.</p>
      </aside>
    </div>
    <nav className="th-home-mobile-nav"><Link href="/"><Home size={20}/></Link><Link href="/explore"><Compass size={20}/></Link><Link href="/stories"><Plus size={22}/></Link><Link href="/messages"><MessageSquare size={20}/></Link><Link href="/profile"><UserRound size={20}/></Link></nav>
  </main>;
}
