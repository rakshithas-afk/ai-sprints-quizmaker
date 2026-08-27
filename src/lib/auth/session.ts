import "server-only";

import { redirect } from "next/navigation";

import { getAuthCookieToken } from "@/lib/auth/cookies";
import { type AuthPayload, verifyAuthToken } from "@/lib/auth/jwt";

export async function getSession(): Promise<AuthPayload | null> {
	const token = await getAuthCookieToken();
	if (!token) {
		return null;
	}

	try {
		return await verifyAuthToken(token);
	} catch {
		return null;
	}
}

export async function requireAuth(): Promise<AuthPayload> {
	const session = await getSession();
	if (!session) {
		redirect("/signin");
	}
	return session;
}

export async function redirectIfAuthenticated(destination = "/dashboard"): Promise<void> {
	const token = await getAuthCookieToken();
	if (!token) {
		return;
	}

	try {
		await verifyAuthToken(token);
		redirect(destination);
	} catch {
		// Invalid token — treat as unauthenticated. Cookie is cleared on sign-out.
	}
}
