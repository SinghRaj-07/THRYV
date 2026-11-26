"use client";
import { useEffect, useState } from "react";
import { Users, Plus, ArrowRight, X, Lock } from "lucide-react";

type GroupSection = "circles" | "communities";
type Group = { id:string; name:string; slug?:string; description?:string; created_at:string; member_count:number; joined?:boolean; role?:string };
function Panel({children,className=""}:{children:React.ReactNode;className?:string}) {
  return <section className={"th-panel "+className}>{children}</section>;
}
function Empty({title,body}:{title:string;body:string}) {
  return <div className="th-empty"><div className="th-empty-icon"><Users size={23}/></div><b>{title}</b><p>{body}</p></div>;
}
export default function GroupsWorkspace({section}:{section:GroupSection}) {
  const [groups,setGroups]=useState<Group[]>([]);
  const [name,setName]=useState("");
  const [description,setDescription]=useState("");
  const [privateCommunity,setPrivateCommunity]=useState(false);
  const [memberNames,setMemberNames]=useState<Record<string,string>>({});
  const [selected,setSelected]=useState<Group|null>(null);
  const [posts,setPosts]=useState<any[]>([]);
  const [postDraft,setPostDraft]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const endpoint=section==="circles"?"/api/circles":"/api/communities";
  async function load() {
    setLoading(true);setError("");
    try {
      const response=await fetch(endpoint);
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"Could not load spaces.");
      setGroups(section==="circles"?(data.circles||[]):(data.communities||[]));
    } catch(e) { setError(e instanceof Error?e.message:"Could not load spaces."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{load();},[section]);
  async function createGroup(e:React.FormEvent) {
    e.preventDefault();if(name.trim().length<2)return;
    setBusy(true);setError("");
    try {
      const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name.trim(),description:description.trim(),is_private:privateCommunity})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"Could not create this space.");
      setGroups(old=>[section==="circles"?data.circle:data.community,...old]);
      setName("");setDescription("");setPrivateCommunity(false);
    } catch(e) { setError(e instanceof Error?e.message:"Could not create this space."); }
    finally { setBusy(false); }
  }
  async function addMember(group:Group) {
    const username=(memberNames[group.id]||"").trim();
    if(!username)return;
    const response=await fetch("/api/circles/"+group.id+"/members",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username})});
    const data=await response.json();
    if(!response.ok){setError(data.error||"Could not add member.");return;}
    setMemberNames(old=>({...old,[group.id]:""}));
    setGroups(old=>old.map(g=>g.id===group.id?{...g,member_count:g.member_count+1}:g));
  }
  async function toggleMembership(group:Group) {
    const response=await fetch("/api/communities/"+group.id+"/members",{method:group.joined?"DELETE":"POST"});
    const data=await response.json();
    if(!response.ok){setError(data.error||"Could not update membership.");return;}
    setGroups(old=>old.map(g=>g.id===group.id?{...g,joined:!group.joined,member_count:Math.max(0,g.member_count+(group.joined?-1:1))}:g));
    if(selected?.id===group.id)setSelected({...group,joined:!group.joined});
  }
  async function openCommunity(group:Group) {
    const response=await fetch("/api/communities/"+group.id+"/posts");
    const data=await response.json();
    if(!response.ok){setError(data.error||"Could not open community.");return;}
    setSelected(group);setPosts(data.posts||[]);setPostDraft("");
  }
  async function publishPost(e:React.FormEvent) {
    e.preventDefault();if(!selected||!postDraft.trim())return;
    const response=await fetch("/api/communities/"+selected.id+"/posts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:postDraft.trim()})});
    const data=await response.json();
    if(!response.ok){setError(data.error||"Could not publish post.");return;}
    setPosts(old=>[data.post,...old]);setPostDraft("");
  }
  return <div className="th-stack">
    <Panel className="th-explore-hero">
      <span className="th-kicker">BELONG TOGETHER</span>
      <h2>{section==="circles"?"Your people, your circle.":"Find your community."}</h2>
      <p>{section==="circles"?"Create a private space and invite people by their THRYV username.":"Discover public communities, join and share posts with members."}</p>
    </Panel>
    {error&&<div className="th-alert">{error}<button onClick={()=>setError("")}><X size={14}/></button></div>}
    <Panel>
      <h2 className="th-panel-title">{section==="circles"?"Create a circle":"Create a community"}</h2>
      <form className="th-group-create" onSubmit={createGroup}>
        <label className="th-label">Name<input className="th-input" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={section==="circles"?48:60} placeholder={section==="circles"?"e.g. Weekend friends":"e.g. Photography lovers"} required/></label>
        <label className="th-label">Description<textarea className="th-input" value={description} onChange={e=>setDescription(e.target.value)} maxLength={section==="circles"?240:500} rows={2} placeholder="What brings this group together?"/></label>
        {section==="communities"&&<label className="th-check-label"><input type="checkbox" checked={privateCommunity} onChange={e=>setPrivateCommunity(e.target.checked)}/><Lock size={14}/> Make this community private</label>}
        <button className="th-primary" disabled={busy||name.trim().length<2}>{busy?"Creating…":section==="circles"?"Create circle":"Create community"}</button>
      </form>
    </Panel>
    <div className="th-section-title"><h2>{section==="circles"?"Your circles":"Explore communities"}</h2><span>{groups.length} spaces</span></div>
    {loading?<Panel><Empty title="Loading spaces" body="Finding circles and communities for your account."/></Panel>:groups.length?<div className="th-group-grid">
      {groups.map(group=><Panel key={group.id} className="th-group-card">
        <div className="th-group-icon"><Users size={20}/></div>
        <div className="th-group-info"><b>{group.name}</b><small>{section==="communities"?"@"+group.slug:"Created "+new Date(group.created_at).toLocaleDateString()}</small></div>
        <p>{group.description||"A space for people to connect and share."}</p>
        <div className="th-group-meta"><span>{group.member_count||1} members</span>
          {section==="communities"?<button className="th-primary" onClick={()=>toggleMembership(group)}>{group.joined?"Leave":"Join"}</button>:null}
          {section==="communities"?<button className="th-secondary-button" onClick={()=>openCommunity(group)}>Open <ArrowRight size={13}/></button>:null}
        </div>
        {section==="circles"&&<form className="th-group-invite" onSubmit={e=>{e.preventDefault();addMember(group);}}>
          <input className="th-input" value={memberNames[group.id]||""} onChange={e=>setMemberNames(old=>({...old,[group.id]:e.target.value}))} placeholder="Member username"/>
          <button className="th-primary" disabled={!memberNames[group.id]?.trim()}><Plus size={14}/> Add</button>
        </form>}
      </Panel>)}
    </div>:<Panel><Empty title={section==="circles"?"Your first circle starts here":"No communities yet"} body={section==="circles"?"Create a circle above, then invite people by their THRYV username.":"Create a community or check back as members build new spaces."}/></Panel>}
    {section==="communities"&&selected&&<Panel className="th-community-feed">
      <div className="th-panel-heading"><div><h2>{selected.name}</h2><span>Community posts</span></div><button className="th-text-button" onClick={()=>setSelected(null)}>Close</button></div>
      {selected.joined&&<form className="th-community-compose" onSubmit={publishPost}><textarea className="th-input" value={postDraft} onChange={e=>setPostDraft(e.target.value)} rows={2} maxLength={3000} placeholder="Share something with this community…"/><button className="th-primary" disabled={!postDraft.trim()}>Publish</button></form>}
      {posts.length?posts.map(post=><div className="th-community-post" key={post.id}><div className="th-community-author"><span className="th-avatar-fallback" style={{width:34,height:34}}>{(post.profiles?.display_name||"T").slice(0,1).toUpperCase()}</span><div><b>{post.profiles?.display_name||"THRYV member"}</b><small>@{post.profiles?.username||"member"} · {new Date(post.created_at).toLocaleString()}</small></div></div><p>{post.content}</p></div>):<Empty title="No posts in this community yet" body={selected.joined?"Start the conversation with the first post.":"Join the community to take part in the conversation."}/>}
    </Panel>}
  </div>;
}
