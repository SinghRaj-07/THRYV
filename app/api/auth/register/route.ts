import {NextResponse} from "next/server";
export async function POST(){return NextResponse.json({error:"Registration is disabled while THRYV is in private single-user mode."},{status:403})}
