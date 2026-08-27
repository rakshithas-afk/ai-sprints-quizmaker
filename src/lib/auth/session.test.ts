vi.mock("server-only", () => ({}));

const mockGetAuthCookieToken = vi.fn<() => Promise<string | undefined>>();
const mockVerifyAuthToken = vi.fn<(token: string) => Promise<{ sub: string; email: string; name: string }>>();
const mockRedirect = vi.fn<(url: string) => never>();

vi.mock("@/lib/auth/cookies", () => ({
	getAuthCookieToken: () => mockGetAuthCookieToken(),
}));

vi.mock("@/lib/auth/jwt", () => ({
	verifyAuthToken: (token: string) => mockVerifyAuthToken(token),
}));

vi.mock("next/navigation", () => ({
	redirect: (url: string) => mockRedirect(url),
}));

import { beforeEach, describe, expect, it } from "vitest";

import { getSession, redirectIfAuthenticated, requireAuth } from "@/lib/auth/session";

describe("session helpers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRedirect.mockImplementation((url: string) => {
			throw new Error(`REDIRECT:${url}`);
		});
	});

	it("returns null when no auth cookie is present", async () => {
		mockGetAuthCookieToken.mockResolvedValue(undefined);

		await expect(getSession()).resolves.toBeNull();
	});

	it("returns the verified payload when the token is valid", async () => {
		mockGetAuthCookieToken.mockResolvedValue("valid-token");
		mockVerifyAuthToken.mockResolvedValue({
			sub: "user-1",
			email: "user@example.com",
			name: "User One",
		});

		await expect(getSession()).resolves.toEqual({
			sub: "user-1",
			email: "user@example.com",
			name: "User One",
		});
	});

	it("redirects unauthenticated users away from protected routes", async () => {
		mockGetAuthCookieToken.mockResolvedValue(undefined);

		await expect(requireAuth()).rejects.toThrow("REDIRECT:/signin");
		expect(mockRedirect).toHaveBeenCalledWith("/signin");
	});

	it("redirects authenticated users away from sign-in pages", async () => {
		mockGetAuthCookieToken.mockResolvedValue("valid-token");
		mockVerifyAuthToken.mockResolvedValue({
			sub: "user-1",
			email: "user@example.com",
			name: "User One",
		});

		await redirectIfAuthenticated();

		expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
	});
});
