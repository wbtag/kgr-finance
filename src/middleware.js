import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
  };

  const verified = await jwtVerify(token, SECRET);

  if (!verified) {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
  };
  
  return NextResponse.next();
}

export const config = { matcher: ["/", "/query", "/receipt"] };