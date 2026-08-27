vi.mock("server-only", () => ({}));

import { describe, expect, it, vi } from "vitest";

import { DuplicateEmailError } from "@/lib/errors";
import { createUser, verifyCredentials } from "@/lib/services/user-service";

type QueryHandler = {
	run?: () => Promise<{ success: boolean }>;
	all?: () => Promise<{ results: unknown[] }>;
};

function createMockDb(handlers: Array<(sql: string) => QueryHandler>) {
	let callIndex = 0;

	return {
		prepare: vi.fn((sql: string) => ({
			bind: vi.fn(() => {
				const handler = handlers[callIndex]?.(sql) ?? {};
				callIndex += 1;

				return {
					run: handler.run ?? (async () => ({ success: true })),
					all: handler.all ?? (async () => ({ results: [] })),
				};
			}),
		})),
	};
}

const signUpInput = {
	fullName: "Jane Smith",
	email: "jane@example.com",
	password: "Password1!",
	confirmPassword: "Password1!",
};

describe("user-service", () => {
	it("creates a user without returning password fields", async () => {
		const db = createMockDb([
			() => ({ run: async () => ({ success: true }) }),
			() => ({
				all: async () => ({
					results: [
						{
							id: "user-1",
							full_name: "Jane Smith",
							email: "jane@example.com",
							created_at: "2026-08-27T00:00:00Z",
							updated_at: "2026-08-27T00:00:00Z",
						},
					],
				}),
			}),
		]);

		const user = await createUser(db as never, signUpInput);

		expect(user).toEqual({
			id: "user-1",
			fullName: "Jane Smith",
			email: "jane@example.com",
			createdAt: "2026-08-27T00:00:00Z",
			updatedAt: "2026-08-27T00:00:00Z",
		});
		expect(JSON.stringify(user)).not.toContain("Password1!");
	});

	it("maps duplicate email database errors to DuplicateEmailError", async () => {
		const db = createMockDb([
			() => ({
				run: async () => {
					throw new Error("UNIQUE constraint failed: users.email");
				},
			}),
		]);

		await expect(createUser(db as never, signUpInput)).rejects.toBeInstanceOf(DuplicateEmailError);
	});

	it("returns null for invalid credentials without revealing which field failed", async () => {
		const db = createMockDb([
			() => ({ all: async () => ({ results: [] }) }),
		]);

		await expect(verifyCredentials(db as never, "missing@example.com", "Password1!")).resolves.toBeNull();
	});

	it("returns the user when email and password match", async () => {
		const { hashPassword } = await import("@/lib/password");
		const passwordHash = await hashPassword("Password1!");

		const db = createMockDb([
			() => ({
				all: async () => ({
					results: [
						{
							id: "user-1",
							full_name: "Jane Smith",
							email: "jane@example.com",
							password_hash: passwordHash,
							created_at: "2026-08-27T00:00:00Z",
							updated_at: "2026-08-27T00:00:00Z",
						},
					],
				}),
			}),
		]);

		const user = await verifyCredentials(db as never, "jane@example.com", "Password1!");

		expect(user?.email).toBe("jane@example.com");
		expect(user).not.toHaveProperty("password_hash");
	});
});
