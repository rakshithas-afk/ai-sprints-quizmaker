import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema, zodFieldErrors } from "@/lib/validation/auth-schemas";

const validSignUp = {
	fullName: "Jane Smith",
	email: "jane@example.com",
	password: "Password1!",
	confirmPassword: "Password1!",
};

describe("signUpSchema", () => {
	it("accepts valid registration input and normalizes email", () => {
		const result = signUpSchema.safeParse({
			...validSignUp,
			email: "Jane@Example.COM",
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.email).toBe("jane@example.com");
			expect(result.data.fullName).toBe("Jane Smith");
		}
	});

	it("rejects empty full name", () => {
		const result = signUpSchema.safeParse({ ...validSignUp, fullName: "   " });
		expect(result.success).toBe(false);
	});

	it("rejects invalid email format", () => {
		const result = signUpSchema.safeParse({ ...validSignUp, email: "not-an-email" });
		expect(result.success).toBe(false);
	});

	it("rejects weak passwords missing complexity rules", () => {
		const result = signUpSchema.safeParse({ ...validSignUp, password: "password", confirmPassword: "password" });
		expect(result.success).toBe(false);
	});

	it("rejects mismatched confirm password", () => {
		const result = signUpSchema.safeParse({
			...validSignUp,
			confirmPassword: "Password2!",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			const errors = zodFieldErrors(result.error);
			expect(errors.confirmPassword).toContain("Passwords do not match.");
		}
	});
});

describe("signInSchema", () => {
	it("accepts valid sign-in input and lowercases email", () => {
		const result = signInSchema.safeParse({
			email: "User@Example.com",
			password: "secret",
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.email).toBe("user@example.com");
		}
	});

	it("rejects empty password", () => {
		const result = signInSchema.safeParse({ email: "user@example.com", password: "" });
		expect(result.success).toBe(false);
	});
});
