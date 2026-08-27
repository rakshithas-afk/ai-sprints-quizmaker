import "server-only";

import { EncryptJWT, jwtDecrypt } from "jose";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const AUTH_COOKIE_NAME = "auth_token";
export const JWT_EXPIRY = "15m";
export const COOKIE_MAX_AGE = 900;

export interface AuthPayload {
	sub: string;
	email: string;
	name: string;
}

async function getSecretKey(): Promise<Uint8Array> {
	const { env } = await getCloudflareContext({ async: true });
	const secret = env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET is not configured.");
	}
	const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
	return new Uint8Array(hash);
}

export async function createAuthToken(payload: AuthPayload): Promise<string> {
	const secretKey = await getSecretKey();
	return new EncryptJWT({ email: payload.email, name: payload.name })
		.setProtectedHeader({ alg: "dir", enc: "A256GCM" })
		.setSubject(payload.sub)
		.setIssuedAt()
		.setExpirationTime(JWT_EXPIRY)
		.encrypt(secretKey);
}

export async function verifyAuthToken(token: string): Promise<AuthPayload> {
	const secretKey = await getSecretKey();
	const { payload } = await jwtDecrypt(token, secretKey);
	const sub = payload.sub;
	const email = payload.email;
	const name = payload.name;

	if (typeof sub !== "string" || typeof email !== "string" || typeof name !== "string") {
		throw new Error("Invalid token payload.");
	}

	return { sub, email, name };
}
