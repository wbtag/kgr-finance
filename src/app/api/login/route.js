import { getDatabase } from "@/components/lib/mongoLibrary";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req) {
    const db = await getDatabase();
    const { username, password } = await req.json();

    const user = await db.collection("users").findOne({ username });

    if (!user) {
        return new Response("Invalid", { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    
    if (!valid) {
        return new Response("Invalid", { status: 401 });
    }

    const token = await new SignJWT({id: user._id}).setProtectedHeader({alg: 'HS256'}).sign(SECRET);

    cookies().set("token", token, { httpOnly: true, path: "/", sameSite: 'strict', secure: process.env.NODE_ENV === 'PROD', });

    return new Response("Logged in", { status: 200 });
}
