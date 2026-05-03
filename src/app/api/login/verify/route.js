import { cookies } from "next/headers";
import speakeasy from "speakeasy";
import { createSession, getUser } from "@/components/lib/mongoLibrary";
import { parseJWT } from "@/components/lib/jwtLibrary";

const secure = process.env['NODE_ENV'] != 'development';

export async function POST(req) {
    const { code } = await req.json();
    const cookieStore = await cookies();
    const mfaPending = cookieStore.get("mfap")?.value;

    if (!mfaPending) {
        return new Response("No MFA session found", { status: 401 });
    }

    const mfaResult = await parseJWT(mfaPending, 'mfa');

    if (!mfaResult.ok) {
        return new Response("MFA token expired or invalid", { status: 401 });
    }
    
    const { userId } = mfaResult.payload;

    const user = await getUser(userId);

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
    };

    const { rid, sid } = await createSession(userId);

    cookieStore.set("sid", sid, {
        maxAge: 60 * 60,
        httpOnly: true,
        path: "/",
        sameSite: 'strict',
        secure
    });

    cookieStore.set("rid", rid, {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        path: "/",
        sameSite: 'strict',
        secure
    });

    cookieStore.delete("mfap", { path: "/" });
    return new Response("Logged in", { status: 200 });
}
