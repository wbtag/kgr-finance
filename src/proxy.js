import { NextResponse } from "next/server";
import { validateSession } from "./components/lib/mongoLibrary";
import { parseJWT } from "./components/lib/jwtLibrary";

export async function proxy(req) {

  const token = req.cookies.get("sid")?.value;

  if (token) {
    const accessResult = await parseJWT(token, 'access');
    if (accessResult.ok) {
      return NextResponse.next();
    }
  }

  const refreshToken = req.cookies.get("rid")?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
  }

  const refreshResult = await parseJWT(refreshToken, 'refresh');
  if (!refreshResult.ok) {
    const res = NextResponse.redirect(new URL('/login', req.nextUrl.origin));
    res.cookies.delete("sid");
    res.cookies.delete("rid");
    return res;
  }
  const { userId } = refreshResult.payload;

  const { ok, sid } = await validateSession(refreshToken, userId);

  if (!ok) {
    const res = NextResponse.redirect(new URL('/login', req.nextUrl.origin));
    res.cookies.delete("sid");
    res.cookies.delete("rid");
    return res;
  }

  const res = NextResponse.next();

  res.cookies.set("sid", sid, {
    maxAge: 60 * 60,
    httpOnly: true,
    path: "/",
    sameSite: 'strict',
    secure: process.env.NODE_ENV !== 'development'
  });

  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|login|.*\\.ttf|.*\\.svg).*)'
  ]
};
