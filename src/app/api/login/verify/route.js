import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import speakeasy from "speakeasy";
import { getDatabase } from "@/components/lib/mongoLibrary";
import { ObjectId } from "bson";

const TEMP_SECRET = new TextEncoder().encode(process.env.JWT_STEP1_SECRET);
const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

export async function POST(req) {

    const { code } = await req.json();
    const cookieStore = await cookies();
    const mfaPending = cookieStore.get("mfap")?.value;

    if (!mfaPending) {
        return new Response("No MFA session found", { status: 401 });
    }

    let payload;

    try {
        payload = (await jwtVerify(mfaPending, TEMP_SECRET)).payload;
    } catch {
        return new Response("MFA token expired or invalid", { status: 401 });
    }

    const db = await getDatabase();
    const user = await db.collection("users").findOne({ _id: new ObjectId(payload.userId) });

    if (!user) {
        return new Response("User not found", { status: 401 });
    }

    const verified = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: "base32",
        token: code
    });

    if (!verified) {
        return new Response("Invalid TOTP", { status: 401 });
    }

    const accessToken = await new SignJWT({ id: user._id.toString() })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime('1h')
        .sign(ACCESS_SECRET);

    const refreshToken = await new SignJWT({ id: user._id.toString() })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime('7d')
        .sign(REFRESH_SECRET);

    cookieStore.set("sid", accessToken, {
        maxAge: 60 * 60,
        httpOnly: true,
        path: "/",
        sameSite: 'strict',
        secure: process.env.NODE_ENV !== 'development'
    });

    cookieStore.set("rid", refreshToken, {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        path: "/",
        sameSite: 'strict',
        secure: process.env.NODE_ENV !== 'development'
    });

    cookieStore.delete("mfap", { path: "/" });

    return new Response("Logged in", { status: 200 });
}