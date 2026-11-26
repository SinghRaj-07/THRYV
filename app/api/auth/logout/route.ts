import {NextResponse} from "next/server";export async function POST(){const r=NextResponse.json({ok:true});r.cookies.delete("thryv_access");return r}
