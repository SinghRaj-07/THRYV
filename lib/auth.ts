import { cookies } from "next/headers";
import { adminDb } from "./supabase";
export async function currentUser(){const token=(await cookies()).get("thryv_access")?.value;if(!token)return null;const {data,error}=await adminDb().auth.getUser(token);return error?null:data.user}
export function unauthorized(){return Response.json({error:"Authentication required"},{status:401})}
