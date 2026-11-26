import {NextRequest,NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {adminDb} from "@/lib/supabase";
function safeEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export async function POST(req:NextRequest){
 try{
  const {username,password}=await req.json();
  const allowedUsername=process.env.THRYV_SINGLE_USER_USERNAME;
  const allowedPassword=process.env.THRYV_SINGLE_USER_PASSWORD;
  const email=process.env.THRYV_SINGLE_USER_EMAIL;
  if(!allowedUsername||!allowedPassword||!email)return NextResponse.json({error:"Private login is not configured. Add the THRYV login environment variables in Vercel."},{status:503});
  if(typeof username!=="string"||typeof password!=="string"||!safeEqual(username.trim().toLowerCase(),allowedUsername.trim().toLowerCase())||!safeEqual(password,allowedPassword))return NextResponse.json({error:"Invalid username or password."},{status:401});
  const db=adminDb();
  let signedIn=await db.auth.signInWithPassword({email,password:allowedPassword});
  if(signedIn.error||!signedIn.data.session){
   const listed=await db.auth.admin.listUsers({page:1,perPage:1000});
   if(listed.error)return NextResponse.json({error:"Could not check the private THRYV account."},{status:503});
   const existing=listed.data.users.find(u=>u.email?.toLowerCase()===email.toLowerCase());
   if(!existing){
    const created=await db.auth.admin.createUser({email,password:allowedPassword,email_confirm:true,user_metadata:{display_name:allowedUsername}});
    if(created.error)return NextResponse.json({error:"Could not create the private THRYV account."},{status:503});
   }
   signedIn=await db.auth.signInWithPassword({email,password:allowedPassword});
  }
  const session=signedIn.data.session,user=signedIn.data.user;
  if(signedIn.error||!session||!user)return NextResponse.json({error:"Could not sign in to the private THRYV account."},{status:503});
  const {error:profileError}=await db.from("profiles").upsert({id:user.id,username:allowedUsername,display_name:allowedUsername},{onConflict:"id"});
  if(profileError)return NextResponse.json({error:"Could not initialize the account profile."},{status:503});
  const res=NextResponse.json({user:{id:user.id,username:allowedUsername}});
  res.cookies.set("thryv_access",session.access_token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:session.expires_in});
  return res;
 }catch{return NextResponse.json({error:"Sign in failed. Check the Supabase server configuration."},{status:503})}
}
