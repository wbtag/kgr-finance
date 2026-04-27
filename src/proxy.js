import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(req) {

  const token = req.cookies.get("sid")?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
  }

  try {
    await jwtVerify(token, ACCESS_SECRET);
  } catch {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|login).*)'
  ]
};