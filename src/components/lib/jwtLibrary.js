import { SignJWT, jwtVerify, errors } from "jose";

const mfaSecret = new TextEncoder().encode(process.env.JWT_STEP1_SECRET);
const accessSecret = new TextEncoder().encode(process.env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

const typeMap = {
    'mfa': mfaSecret,
    'access': accessSecret,
    'refresh': refreshSecret
}

export async function getJWT(payload, expiration, type) {

    const secret = getSecret(type);

    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(expiration)
        .sign(secret);
}

export async function parseJWT(jwt, type) {
    const secret = getSecret(type);
    try {
        const { payload } = await jwtVerify(jwt, secret);
        return { ok: true, payload };
    } catch (e) {
        if (e instanceof errors.JOSEError) {
            return { ok: false, message: e.code || 'Invalid token' };
        }
        throw e;
    }
}

function getSecret(type) {
    const secret = typeMap[type];

    if (!secret) {
        throw new Error('Invalid secret type');
    }

    return secret;
}
