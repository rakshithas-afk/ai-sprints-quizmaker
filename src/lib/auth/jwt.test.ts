vi.mock("server-only", () => ({}));

vi.mock("@opennextjs/cloudflare", () => ({
	getCloudflareContext: vi.fn(async () => ({
		env: { JWT_SECRET: "test-secret-minimum-thirty-two-characters" },
	})),
}));

import { decodeJwt } from "jose";
import { describe, expect, it } from "vitest";

import {
	AUTH_COOKIE_NAME,
	COOKIE_MAX_AGE,
	JWT_EXPIRY,
	createAuthToken,
	verifyAuthToken,
} from "@/lib/auth/jwt";

describe("JWT session tokens", () => {
	const payload = {
		sub: "user-123",
		email: "user@example.com",
		name: "Test User",
	};

	it("uses the PRD cookie name and 15-minute expiry settings", () => {
		expect(AUTH_COOKIE_NAME).toBe("auth_token");
		expect(JWT_EXPIRY).toBe("15m");
		expect(COOKIE_MAX_AGE).toBe(900);
	});

	it("creates an encrypted token and verifies the payload", async () => {
		const token = await createAuthToken(payload);

		expect(token.split(".")).toHaveLength(5);

		const verified = await verifyAuthToken(token);
		expect(verified).toEqual(payload);
	});

	it("does not expose claims in plaintext JWT segments", async () => {
		const token = await createAuthToken(payload);

		expect(() => decodeJwt(token)).toThrow();
	});

	it("rejects tampered tokens", async () => {
		const token = await createAuthToken(payload);

		await expect(verifyAuthToken(`${token}x`)).rejects.toThrow();
	});
});
