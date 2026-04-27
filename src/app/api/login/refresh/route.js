import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);
const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req) {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("rid")?.value;

    if (!refreshToken) {
        return new Response("No refresh token found", { status: 401 });
    }

    let payload;

    try {
        payload = (await jwtVerify(refreshToken, REFRESH_SECRET)).payload;
    } catch {
        return new Response("Refresh token expired or invalid", { status: 401 });
    }

    // Issue new access token
    const newAccessToken = await new SignJWT({ id: payload.id })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime('1h')
        .sign(ACCESS_SECRET);

    cookieStore.set("sid", newAccessToken, {
        maxAge: 60 * 60,
        httpOnly: true,
        path: "/",
        sameSite: 'strict',
        secure: process.env.NODE_ENV !== 'development'
    });

    return new Response("Token refreshed", { status: 200 });
}
