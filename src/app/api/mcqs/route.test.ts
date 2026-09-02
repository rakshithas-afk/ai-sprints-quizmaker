vi.mock("server-only", () => ({}));

import { beforeEach, describe, expect, it, vi } from "vitest";

import { McqPersistenceError } from "@/lib/errors";
import { GET, POST } from "@/app/api/mcqs/route";

const session = {
	sub: "a".repeat(32),
	email: "jane@example.com",
	name: "Jane Smith",
};

const listItem = {
	id: "c".repeat(32),
	name: "Cloudflare fundamentals",
	question: "Which Cloudflare product provides serverless compute?",
	createdByUserId: session.sub,
	creatorName: "Jane Smith",
	createdAt: "2026-09-01T10:00:00Z",
	updatedAt: "2026-09-01T10:00:00Z",
};

const validCreateBody = {
	name: "Cloudflare fundamentals",
	question: "Which Cloudflare product provides serverless compute?",
	choices: [
		{ choice: "Workers", isCorrect: true },
		{ choice: "Registrar", isCorrect: false },
	],
};

vi.mock("@/lib/auth/session", () => ({
	getSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	getDb: vi.fn(async () => ({})),
}));

vi.mock("@/lib/services/mcq-service", () => ({
	listMcqs: vi.fn(),
	createMcq: vi.fn(),
}));

import { getSession } from "@/lib/auth/session";
import { createMcq, listMcqs } from "@/lib/services/mcq-service";

describe("GET /api/mcqs", () => {
	beforeEach(() => {
		vi.mocked(getSession).mockReset();
		vi.mocked(listMcqs).mockReset();
	});

	it("returns 401 when the request is unauthenticated", async () => {
		vi.mocked(getSession).mockResolvedValue(null);

		const response = await GET();

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			data: null,
			error: {
				code: "UNAUTHORIZED",
				message: "Authentication required.",
			},
		});
	});

	it("returns the shared MCQ list without correct-answer fields", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(listMcqs).mockResolvedValue([listItem]);

		const response = await GET();
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({ data: [listItem], error: null });
		expect(JSON.stringify(body)).not.toContain("isCorrect");
		expect(listMcqs).toHaveBeenCalledWith({}, session.sub);
	});

	it("returns a generic 500 response for unexpected failures", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(listMcqs).mockRejectedValue(new Error("database unavailable"));

		const response = await GET();

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			data: null,
			error: {
				code: "INTERNAL_ERROR",
				message: "Something went wrong. Please try again later.",
			},
		});
	});
});

describe("POST /api/mcqs", () => {
	beforeEach(() => {
		vi.mocked(getSession).mockReset();
		vi.mocked(createMcq).mockReset();
	});

	it("returns 401 when the request is unauthenticated", async () => {
		vi.mocked(getSession).mockResolvedValue(null);

		const response = await POST(
			new Request("http://localhost/api/mcqs", {
				method: "POST",
				body: JSON.stringify(validCreateBody),
			}),
		);

		expect(response.status).toBe(401);
	});

	it("returns 400 for malformed JSON", async () => {
		vi.mocked(getSession).mockResolvedValue(session);

		const response = await POST(
			new Request("http://localhost/api/mcqs", {
				method: "POST",
				body: "{",
			}),
		);

		expect(response.status).toBe(400);
		expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
	});

	it("returns 400 with field errors for invalid create payloads", async () => {
		vi.mocked(getSession).mockResolvedValue(session);

		const response = await POST(
			new Request("http://localhost/api/mcqs", {
				method: "POST",
				body: JSON.stringify({ ...validCreateBody, name: "   " }),
			}),
		);

		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error.code).toBe("VALIDATION_ERROR");
		expect(body.error.fieldErrors.name).toBeDefined();
	});

	it("creates an MCQ using the authenticated user as creator", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(createMcq).mockResolvedValue({
			...listItem,
			choices: [
				{
					id: "d".repeat(32),
					mcqId: listItem.id,
					choice: "Workers",
					isCorrect: true,
					position: 0,
					createdAt: "2026-09-01T10:00:00Z",
					updatedAt: "2026-09-01T10:00:00Z",
				},
			],
		});

		const response = await POST(
			new Request("http://localhost/api/mcqs", {
				method: "POST",
				body: JSON.stringify(validCreateBody),
			}),
		);

		expect(response.status).toBe(201);
		expect(createMcq).toHaveBeenCalledWith({}, session.sub, validCreateBody);
	});

	it("returns 500 for persistence failures", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(createMcq).mockRejectedValue(new McqPersistenceError());

		const response = await POST(
			new Request("http://localhost/api/mcqs", {
				method: "POST",
				body: JSON.stringify(validCreateBody),
			}),
		);

		expect(response.status).toBe(500);
		expect((await response.json()).error.code).toBe("MCQ_PERSISTENCE_ERROR");
	});
});
