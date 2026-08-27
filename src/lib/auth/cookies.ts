import "server-only";

import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth/jwt";

function isProduction(): boolean {
	return process.env.NODE_ENV === "production";
}

export async function setAuthCookie(token: string): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.set(AUTH_COOKIE_NAME, token, {
		httpOnly: true,
		secure: isProduction(),
		sameSite: "lax",
		path: "/",
		maxAge: COOKIE_MAX_AGE,
	});
}

export async function clearAuthCookie(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getAuthCookieToken(): Promise<string | undefined> {
	const cookieStore = await cookies();
	return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}
