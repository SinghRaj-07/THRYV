import {NextRequest,NextResponse} from "next/server";
export function middleware(req:NextRequest){
 const path=req.nextUrl.pathname;
 const isAuth=path==="/auth";
 const hasSession=!!req.cookies.get("thryv_access")?.value;
 if(!hasSession&&!isAuth){const url=req.nextUrl.clone();url.pathname="/auth";url.searchParams.set("next",path);return NextResponse.redirect(url)}
 if(hasSession&&isAuth){const url=req.nextUrl.clone();url.pathname="/";url.search="";return NextResponse.redirect(url)}
 return NextResponse.next();
}
export const config={matcher:["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]};
