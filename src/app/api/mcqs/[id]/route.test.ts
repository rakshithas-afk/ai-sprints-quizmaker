vi.mock("server-only", () => ({}));

import { beforeEach, describe, expect, it, vi } from "vitest";

import { McqChoiceConflictError, McqNotFoundError } from "@/lib/errors";
import { DELETE, GET, PUT } from "@/app/api/mcqs/[id]/route";

const session = {
	sub: "a".repeat(32),
	email: "jane@example.com",
	name: "Jane Smith",
};

const mcqId = "c".repeat(32);
const choiceId = "d".repeat(32);

const previewMcq = {
	id: mcqId,
	name: "Cloudflare fundamentals",
	question: "Which Cloudflare product provides serverless compute?",
	createdByUserId: session.sub,
	creatorName: "Jane Smith",
	createdAt: "2026-09-01T10:00:00Z",
	updatedAt: "2026-09-01T10:00:00Z",
	choices: [
		{
			id: choiceId,
			mcqId,
			choice: "Workers",
			position: 0,
			createdAt: "2026-09-01T10:00:00Z",
			updatedAt: "2026-09-01T10:00:00Z",
		},
	],
};

const editMcq = {
	...previewMcq,
	choices: [{ ...previewMcq.choices[0], isCorrect: true }],
};

const validUpdateBody = {
	name: "Updated name",
	question: "Updated question?",
	choices: [
		{ id: choiceId, choice: "Workers", isCorrect: true },
		{ choice: "Pages", isCorrect: false },
	],
};

vi.mock("@/lib/auth/session", () => ({
	getSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	getDb: vi.fn(async () => ({})),
}));

vi.mock("@/lib/services/mcq-service", () => ({
	getMcqById: vi.fn(),
	getMcqForPreview: vi.fn(),
	updateMcq: vi.fn(),
	deleteMcq: vi.fn(),
}));

import { getSession } from "@/lib/auth/session";
import { deleteMcq, getMcqById, getMcqForPreview, updateMcq } from "@/lib/services/mcq-service";

function routeContext(id: string) {
	return { params: Promise.resolve({ id }) };
}

describe("GET /api/mcqs/[id]", () => {
	beforeEach(() => {
		vi.mocked(getSession).mockReset();
		vi.mocked(getMcqForPreview).mockReset();
		vi.mocked(getMcqById).mockReset();
	});

	it("returns 401 when the request is unauthenticated", async () => {
		vi.mocked(getSession).mockResolvedValue(null);

		const response = await GET(new Request(`http://localhost/api/mcqs/${mcqId}`), routeContext(mcqId));

		expect(response.status).toBe(401);
	});

	it("returns 400 for malformed route IDs", async () => {
		vi.mocked(getSession).mockResolvedValue(session);

		const response = await GET(new Request("http://localhost/api/mcqs/mcq-1"), routeContext("mcq-1"));

		expect(response.status).toBe(400);
	});

	it("returns preview data without correct-answer flags", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(getMcqForPreview).mockResolvedValue(previewMcq);

		const response = await GET(new Request(`http://localhost/api/mcqs/${mcqId}`), routeContext(mcqId));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.data).toEqual(previewMcq);
		expect(JSON.stringify(body)).not.toContain("isCorrect");
	});

	it("returns 404 when previewing a missing MCQ", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(getMcqForPreview).mockResolvedValue(null);

		const response = await GET(new Request(`http://localhost/api/mcqs/${mcqId}`), routeContext(mcqId));

		expect(response.status).toBe(404);
	});

	it("returns edit data with correctness for the creator", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(getMcqById).mockResolvedValue(editMcq);

		const response = await GET(
			new Request(`http://localhost/api/mcqs/${mcqId}?mode=edit`),
			routeContext(mcqId),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.data.choices[0].isCorrect).toBe(true);
		expect(getMcqById).toHaveBeenCalledWith({}, mcqId, session.sub);
	});

	it("returns 404 when a non-owner requests edit data", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(getMcqById).mockRejectedValue(new McqNotFoundError());

		const response = await GET(
			new Request(`http://localhost/api/mcqs/${mcqId}?mode=edit`),
			routeContext(mcqId),
		);

		expect(response.status).toBe(404);
	});
});

describe("PUT /api/mcqs/[id]", () => {
	beforeEach(() => {
		vi.mocked(getSession).mockReset();
		vi.mocked(updateMcq).mockReset();
	});

	it("returns 401 when the request is unauthenticated", async () => {
		vi.mocked(getSession).mockResolvedValue(null);

		const response = await PUT(
			new Request(`http://localhost/api/mcqs/${mcqId}`, {
				method: "PUT",
				body: JSON.stringify(validUpdateBody),
			}),
			routeContext(mcqId),
		);

		expect(response.status).toBe(401);
	});

	it("returns 400 for invalid update payloads", async () => {
		vi.mocked(getSession).mockResolvedValue(session);

		const response = await PUT(
			new Request(`http://localhost/api/mcqs/${mcqId}`, {
				method: "PUT",
				body: JSON.stringify({ ...validUpdateBody, question: "   " }),
			}),
			routeContext(mcqId),
		);

		expect(response.status).toBe(400);
	});

	it("updates an owned MCQ using the authenticated creator", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(updateMcq).mockResolvedValue(editMcq);

		const response = await PUT(
			new Request(`http://localhost/api/mcqs/${mcqId}`, {
				method: "PUT",
				body: JSON.stringify(validUpdateBody),
			}),
			routeContext(mcqId),
		);

		expect(response.status).toBe(200);
		expect(updateMcq).toHaveBeenCalledWith({}, mcqId, session.sub, validUpdateBody);
	});

	it("returns 404 when a non-owner updates an MCQ", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(updateMcq).mockRejectedValue(new McqNotFoundError());

		const response = await PUT(
			new Request(`http://localhost/api/mcqs/${mcqId}`, {
				method: "PUT",
				body: JSON.stringify(validUpdateBody),
			}),
			routeContext(mcqId),
		);

		expect(response.status).toBe(404);
	});

	it("returns 409 for stale choice conflicts", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(updateMcq).mockRejectedValue(new McqChoiceConflictError());

		const response = await PUT(
			new Request(`http://localhost/api/mcqs/${mcqId}`, {
				method: "PUT",
				body: JSON.stringify(validUpdateBody),
			}),
			routeContext(mcqId),
		);

		expect(response.status).toBe(409);
	});
});

describe("DELETE /api/mcqs/[id]", () => {
	beforeEach(() => {
		vi.mocked(getSession).mockReset();
		vi.mocked(deleteMcq).mockReset();
	});

	it("returns 401 when the request is unauthenticated", async () => {
		vi.mocked(getSession).mockResolvedValue(null);

		const response = await DELETE(new Request(`http://localhost/api/mcqs/${mcqId}`), routeContext(mcqId));

		expect(response.status).toBe(401);
	});

	it("returns 204 when the creator deletes an MCQ", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(deleteMcq).mockResolvedValue(true);

		const response = await DELETE(new Request(`http://localhost/api/mcqs/${mcqId}`), routeContext(mcqId));

		expect(response.status).toBe(204);
		expect(deleteMcq).toHaveBeenCalledWith({}, mcqId, session.sub);
	});

	it("returns 404 when a non-owner deletes an MCQ", async () => {
		vi.mocked(getSession).mockResolvedValue(session);
		vi.mocked(deleteMcq).mockRejectedValue(new McqNotFoundError());

		const response = await DELETE(new Request(`http://localhost/api/mcqs/${mcqId}`), routeContext(mcqId));

		expect(response.status).toBe(404);
	});
});
