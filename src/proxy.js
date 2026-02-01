import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const TEMP_SECRET = new TextEncoder().encode(process.env.JWT_STEP1_SECRET);

export async function proxy(req) {

  const token = req.cookies.get("token")?.value;

  if (!token) {
    const tempToken = req.cookies.get("mfap")?.value;

    if (!tempToken) {
      return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
    };

    const verified = await jwtVerify(tempToken, TEMP_SECRET);

    if (!verified) {
      return NextResponse.json({ error: 'Invalid or malformed credentials' }, { status: 401 });
    }

    return NextResponse.redirect(new URL('/login/verify', req.nextUrl.origin));
  };

  const verified = await jwtVerify(token, SECRET);

  if (!verified) {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
  };

  return NextResponse.next();
}

export const config = { matcher: ["/", "/query", "/receipt", "/balance"] };