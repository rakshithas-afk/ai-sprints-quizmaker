"use server";

import { redirect } from "next/navigation";

import { setAuthCookie, clearAuthCookie } from "@/lib/auth/cookies";
import { createAuthToken } from "@/lib/auth/jwt";
import { getDb } from "@/lib/db";
import { DuplicateEmailError } from "@/lib/errors";
import { createUser, verifyCredentials } from "@/lib/services/user-service";
import {
	signInSchema,
	signUpSchema,
	zodFieldErrors,
} from "@/lib/validation/auth-schemas";

export type AuthActionState = {
	fieldErrors?: Record<string, string[]>;
	formError?: string;
};

export async function signUpAction(
	_prevState: AuthActionState,
	formData: FormData,
): Promise<AuthActionState> {
	const parsed = signUpSchema.safeParse({
		fullName: formData.get("fullName"),
		email: formData.get("email"),
		password: formData.get("password"),
		confirmPassword: formData.get("confirmPassword"),
	});

	if (!parsed.success) {
		return { fieldErrors: zodFieldErrors(parsed.error) };
	}

	try {
		const db = await getDb();
		await createUser(db, parsed.data);
	} catch (error) {
		if (error instanceof DuplicateEmailError) {
			return {
				fieldErrors: {
					email: ["An account with this email already exists. Please sign in."],
				},
			};
		}
		return { formError: "Something went wrong. Please try again later." };
	}

	redirect("/signin?registered=1");
}

export async function signInAction(
	_prevState: AuthActionState,
	formData: FormData,
): Promise<AuthActionState> {
	const parsed = signInSchema.safeParse({
		email: formData.get("email"),
		password: formData.get("password"),
	});

	if (!parsed.success) {
		return { fieldErrors: zodFieldErrors(parsed.error) };
	}

	const db = await getDb();
	const user = await verifyCredentials(db, parsed.data.email, parsed.data.password);

	if (!user) {
		return { formError: "Invalid email or password." };
	}

	const token = await createAuthToken({
		sub: user.id,
		email: user.email,
		name: user.fullName,
	});

	await setAuthCookie(token);
	redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
	await clearAuthCookie();
	redirect("/signin?signedOut=1");
}
