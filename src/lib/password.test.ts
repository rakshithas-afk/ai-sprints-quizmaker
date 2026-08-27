vi.mock("server-only", () => ({}));

import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
	it("stores a bcrypt hash that is not the plain-text password", async () => {
		const password = "Password1!";
		const hash = await hashPassword(password);

		expect(hash).not.toBe(password);
		expect(hash.startsWith("$2")).toBe(true);
	});

	it("verifies the correct password against its hash", async () => {
		const password = "Password1!";
		const hash = await hashPassword(password);

		expect(await verifyPassword(password, hash)).toBe(true);
	});

	it("rejects an incorrect password", async () => {
		const hash = await hashPassword("Password1!");

		expect(await verifyPassword("WrongPassword1!", hash)).toBe(false);
	});
});
