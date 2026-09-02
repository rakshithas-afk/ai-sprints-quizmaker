vi.mock("server-only", () => ({}));

import { beforeEach, describe, expect, it, vi } from "vitest";

import { InvalidMcqChoiceError, McqNotFoundError } from "@/lib/errors";
import { POST } from "@/app/api/mcqs/[id]/attempts/route";

const session = {
	sub: "a".repeat(32),
	email: "jane@example.com",
	name: "Jane Smith",
};

const mcqId = "c".repeat(32);
const choiceId = "d".repeat(32);

vi.mock("@/lib/auth/session", () => ({
	getSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	getDb: vi.fn(async () => ({})),
}));

vi.mock("@/lib/services/mcq-service", () => ({
	recordMcqAttempt: vi.fn(),
}));

import { getSession } from "@/lib/auth/session";
import { recordMcqAttempt } from "@/lib/services/mcq-service";

function routeContext(id: string) {
	return { params: Promise.resolve({ id }) };
}

describe("POST /api/mcqs/[id]/attempts", () => {
	beforeEach(() => {
		vi.mocked(getSession).mockReset();
		vi.mocked(recordMcqAttempt).mockReset();
	});

	it("returns 401 when the request is unauthenticated", async () => {
		vi.mocked(getSession).mockResolvedValue(null);

		const response = await POST(
			new Request(`http://localhost/api/mcqs/${mcqId}/attempts`, {
				method: "POST",
				body: JSON.stringify({ selectedChoiceId: choiceId }),
			}),
			routeContext(mcqId),
		);

		expect(response.status).toBe(401);
	});

	it("returns 400 for invalid attempt payloads", async () => {
		vi.mocked(getSession).mockResolvedValue(session);

		const response = await POST(
			new Request(`http://localhost/api/mcqs/${mcqId}/attempts`, {
				method: "POST",
				body: JSON.stringify({ selectedChoiceId: "choice-1" }),
			}),
			routeContext(mcqId),
		);

		expect(response.status).toBe(400);
	});

	it("records an attempt and returns only attempt ID and correctness", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(recordMcqAttempt).mockResolvedValue({
			id: "1".repeat(32),
			mcqId,
			userId: session.sub,
			selectedChoiceId: choiceId,
			isCorrect: true,
			createdAt: "2026-09-01T11:00:00Z",
		});

		const response = await POST(
			new Request(`http://localhost/api/mcqs/${mcqId}/attempts`, {
				method: "POST",
				body: JSON.stringify({ selectedChoiceId: choiceId }),
			}),
			routeContext(mcqId),
		);
		const body = await response.json();

		expect(response.status).toBe(201);
		expect(body).toEqual({
			data: {
				attemptId: "1".repeat(32),
				isCorrect: true,
			},
			error: null,
		});
		expect(recordMcqAttempt).toHaveBeenCalledWith({}, mcqId, session.sub, choiceId);
	});

	it("returns 404 when the MCQ does not exist", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(recordMcqAttempt).mockRejectedValue(new McqNotFoundError());

		const response = await POST(
			new Request(`http://localhost/api/mcqs/${mcqId}/attempts`, {
				method: "POST",
				body: JSON.stringify({ selectedChoiceId: choiceId }),
			}),
			routeContext(mcqId),
		);

		expect(response.status).toBe(404);
	});

	it("returns 409 when the selected choice does not belong to the MCQ", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(recordMcqAttempt).mockRejectedValue(new InvalidMcqChoiceError());

		const response = await POST(
			new Request(`http://localhost/api/mcqs/${mcqId}/attempts`, {
				method: "POST",
				body: JSON.stringify({ selectedChoiceId: choiceId }),
			}),
			routeContext(mcqId),
		);

		expect(response.status).toBe(409);
	});
});
