import { describe, expect, it, vi } from "vitest";

import { deleteMcqRequest, submitMcqAttemptRequest } from "@/lib/mcq/api-client";

describe("deleteMcqRequest", () => {
	it("returns ok when the API responds with 204", async () => {
		global.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;

		await expect(deleteMcqRequest("c".repeat(32))).resolves.toEqual({ ok: true });
	});

	it("returns an error when deletion is unauthorized", async () => {
		global.fetch = vi.fn(
			async () =>
				new Response(
					JSON.stringify({
						data: null,
						error: { code: "UNAUTHORIZED", message: "Authentication required." },
					}),
					{ status: 401 },
				),
		) as typeof fetch;

		const result = await deleteMcqRequest("c".repeat(32));

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("UNAUTHORIZED");
		}
	});
});

describe("submitMcqAttemptRequest", () => {
	it("returns attempt data when the API responds with 201", async () => {
		global.fetch = vi.fn(
			async () =>
				new Response(
					JSON.stringify({
						data: { attemptId: "1".repeat(32), isCorrect: true },
						error: null,
					}),
					{ status: 201 },
				),
		) as typeof fetch;

		const result = await submitMcqAttemptRequest("c".repeat(32), "d".repeat(32));

		expect(result).toEqual({
			ok: true,
			data: { attemptId: "1".repeat(32), isCorrect: true },
		});
	});

	it("returns an error when the attempt is rejected", async () => {
		global.fetch = vi.fn(
			async () =>
				new Response(
					JSON.stringify({
						data: null,
						error: {
							code: "INVALID_MCQ_CHOICE",
							message: "The selected choice is not valid for this MCQ.",
						},
					}),
					{ status: 409 },
				),
		) as typeof fetch;

		const result = await submitMcqAttemptRequest("c".repeat(32), "d".repeat(32));

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("INVALID_MCQ_CHOICE");
		}
	});
});
