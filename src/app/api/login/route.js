import { getDatabase } from "@/components/lib/mongoLibrary";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { getJWT } from "@/components/lib/jwtLibrary";

export async function POST(req) {

    const { username, password } = await req.json();

    const db = await getDatabase();
    const user = await db.collection("users").findOne({ username });

    if (!user) {
       return new Response("Invalid credentials", { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
        return new Response("Invalid credentials", { status: 401 });
    }

    const mfaToken = await getJWT({ userId: user._id.toString() }, '5m', 'mfa');

    (await cookies()).set("mfap", mfaToken, {
        httpOnly: true,
        path: "/",
        sameSite: 'strict',
        secure: process.env.NODE_ENV != 'development',
        maxAge: 5 * 60,
    });

    return new Response("TOTP authentication required to proceed", { status: 200 });
}
