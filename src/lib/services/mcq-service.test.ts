vi.mock("server-only", () => ({}));

import { describe, expect, it, vi } from "vitest";

import {
	InvalidMcqChoiceError,
	McqChoiceConflictError,
	McqNotFoundError,
	McqPersistenceError,
} from "@/lib/errors";
import type { CreateMcqInput, UpdateMcqInput } from "@/lib/validation/mcq-schemas";
import {
	createMcq,
	deleteMcq,
	getMcqById,
	getMcqForPreview,
	listMcqs,
	recordMcqAttempt,
	updateMcq,
} from "@/lib/services/mcq-service";

type QueryHandler = {
	run?: () => Promise<{ success: boolean; meta?: { changes?: number } }>;
	all?: () => Promise<{ results: unknown[] }>;
};

type BatchHandler = (statements: Array<{ sql: string; binds: unknown[] }>) => Promise<unknown[]>;

function createMockDb(options: {
	handlers?: Array<(sql: string, binds: unknown[]) => QueryHandler>;
	batchHandler?: BatchHandler;
}) {
	let handlerIndex = 0;

	const db = {
		prepare: vi.fn((sql: string) => ({
			bind: vi.fn((...binds: unknown[]) => ({
				sql,
				binds,
				run: async () => {
					const handler = options.handlers?.[handlerIndex]?.(sql, binds);
					if (handler?.run) {
						handlerIndex += 1;
						return handler.run();
					}
					return {
						success: true,
						meta: { changes: 1 },
					};
				},
				all: async () => {
					const handler = options.handlers?.[handlerIndex]?.(sql, binds);
					handlerIndex += 1;
					if (handler?.all) {
						return handler.all();
					}
					return { results: [] };
				},
			})),
		})),
		batch:
			options.batchHandler ??
			(async () => {
				throw new Error("Unexpected db.batch call");
			}),
	};

	return db;
}

const creatorUserId = "a".repeat(32);
const otherUserId = "b".repeat(32);
const mcqId = "c".repeat(32);
const choiceOneId = "d".repeat(32);
const choiceTwoId = "e".repeat(32);

const createInput: CreateMcqInput = {
	name: "Cloudflare fundamentals",
	question: "Which Cloudflare product provides serverless compute?",
	choices: [
		{ choice: "Workers", isCorrect: true },
		{ choice: "Registrar", isCorrect: false },
	],
};

const mcqRow = {
	id: mcqId,
	name: createInput.name,
	question: createInput.question,
	created_by_user_id: creatorUserId,
	created_at: "2026-09-01T10:00:00Z",
	updated_at: "2026-09-01T10:00:00Z",
	creator_name: "Jane Smith",
};

const choiceRows = [
	{
		id: choiceOneId,
		mcq_id: mcqId,
		choice: "Workers",
		is_correct: 1,
		position: 0,
		created_at: "2026-09-01T10:00:00Z",
		updated_at: "2026-09-01T10:00:00Z",
	},
	{
		id: choiceTwoId,
		mcq_id: mcqId,
		choice: "Registrar",
		is_correct: 0,
		position: 1,
		created_at: "2026-09-01T10:00:00Z",
		updated_at: "2026-09-01T10:00:00Z",
	},
];

describe("mcq-service", () => {
	it("lists shared MCQs with creator details and without correct-answer data", async () => {
		const db = createMockDb({
			handlers: [
				(sql) => {
					expect(sql).toContain("FROM mcqs");
					expect(sql).toContain("JOIN users");
					expect(sql).not.toContain("is_correct");
					return {
						all: async () => ({
							results: [
								{
									id: mcqId,
									name: createInput.name,
									question: createInput.question,
									created_by_user_id: creatorUserId,
									created_at: mcqRow.created_at,
									updated_at: mcqRow.updated_at,
									creator_name: "Jane Smith",
								},
							],
						}),
					};
				},
			],
		});

		const items = await listMcqs(db as never, creatorUserId);

		expect(items).toEqual([
			{
				id: mcqId,
				name: createInput.name,
				question: createInput.question,
				createdByUserId: creatorUserId,
				creatorName: "Jane Smith",
				createdAt: mcqRow.created_at,
				updatedAt: mcqRow.updated_at,
			},
		]);
	});

	it("loads preview choices in position order without correctness flags", async () => {
		const db = createMockDb({
			handlers: [
				(sql) => {
					expect(sql).toContain("FROM mcqs");
					return { all: async () => ({ results: [mcqRow] }) };
				},
				(sql) => {
					expect(sql).toContain("FROM mcq_choices");
					expect(sql).toContain("ORDER BY position");
					return { all: async () => ({ results: choiceRows }) };
				},
			],
		});

		const preview = await getMcqForPreview(db as never, mcqId);

		expect(preview).toEqual({
			id: mcqId,
			name: createInput.name,
			question: createInput.question,
			createdByUserId: creatorUserId,
			creatorName: "Jane Smith",
			createdAt: mcqRow.created_at,
			updatedAt: mcqRow.updated_at,
			choices: [
				{
					id: choiceOneId,
					mcqId,
					choice: "Workers",
					position: 0,
					createdAt: choiceRows[0].created_at,
					updatedAt: choiceRows[0].updated_at,
				},
				{
					id: choiceTwoId,
					mcqId,
					choice: "Registrar",
					position: 1,
					createdAt: choiceRows[1].created_at,
					updatedAt: choiceRows[1].updated_at,
				},
			],
		});
		expect(preview?.choices.every((choice) => !("isCorrect" in choice))).toBe(true);
	});

	it("returns null when previewing a missing MCQ", async () => {
		const db = createMockDb({
			handlers: [() => ({ all: async () => ({ results: [] }) })],
		});

		await expect(getMcqForPreview(db as never, mcqId)).resolves.toBeNull();
	});

	it("loads an owned MCQ with full choice details for editing", async () => {
		const db = createMockDb({
			handlers: [
				(sql) => {
					expect(sql).toContain("created_by_user_id = ?2");
					return { all: async () => ({ results: [mcqRow] }) };
				},
				() => ({ all: async () => ({ results: choiceRows }) }),
			],
		});

		const mcq = await getMcqById(db as never, mcqId, creatorUserId);

		expect(mcq?.choices[0]).toMatchObject({
			id: choiceOneId,
			choice: "Workers",
			isCorrect: true,
			position: 0,
		});
	});

	it("throws the same not-found error when a non-owner requests an edit MCQ", async () => {
		const db = createMockDb({
			handlers: [() => ({ all: async () => ({ results: [] }) })],
		});

		await expect(getMcqById(db as never, mcqId, otherUserId)).rejects.toBeInstanceOf(McqNotFoundError);
	});

	it("creates an MCQ and its choices atomically using the authenticated creator", async () => {
		const batchCalls: Array<{ sql: string; binds: unknown[] }> = [];
		const db = createMockDb({
			batchHandler: async (statements: Array<{ sql: string; binds: unknown[] }>) => {
				for (const statement of statements) {
					batchCalls.push(statement);
				}
				return statements.map(() => ({ success: true }));
			},
			handlers: [
				() => ({ all: async () => ({ results: [mcqRow] }) }),
				() => ({ all: async () => ({ results: choiceRows }) }),
			],
		});

		const mcq = await createMcq(db as never, creatorUserId, createInput);

		expect(batchCalls.some((call) => call.sql.includes("INSERT INTO mcqs"))).toBe(true);
		expect(batchCalls.filter((call) => call.sql.includes("INSERT INTO mcq_choices"))).toHaveLength(2);
		expect(batchCalls[0]?.binds).toContain(creatorUserId);
		expect(mcq.createdByUserId).toBe(creatorUserId);
		expect(mcq.choices.map((choice) => choice.position)).toEqual([0, 1]);
	});

	it("throws a persistence error when atomic create fails", async () => {
		const db = createMockDb({
			batchHandler: async () => {
				throw new Error("SQLITE_CONSTRAINT");
			},
		});

		await expect(createMcq(db as never, creatorUserId, createInput)).rejects.toBeInstanceOf(
			McqPersistenceError,
		);
	});

	it("updates an owned MCQ while preserving creator and created timestamp", async () => {
		const updateInput: UpdateMcqInput = {
			name: "Updated name",
			question: "Updated question?",
			choices: [
				{ id: choiceOneId, choice: "Workers", isCorrect: true },
				{ id: choiceTwoId, choice: "Pages", isCorrect: false },
			],
		};

		const db = createMockDb({
			batchHandler: async () => [{ success: true }],
			handlers: [
				() => ({ all: async () => ({ results: [mcqRow] }) }),
				() => ({ all: async () => ({ results: choiceRows.map((row) => ({ id: row.id })) }) }),
				() => ({ all: async () => ({ results: [{ ...mcqRow, name: updateInput.name }] }) }),
				() => ({
					all: async () => ({
						results: choiceRows.map((row, index) => ({
							...row,
							choice: updateInput.choices[index]?.choice ?? row.choice,
						})),
					}),
				}),
			],
		});

		const updated = await updateMcq(db as never, mcqId, creatorUserId, updateInput);

		expect(updated.name).toBe("Updated name");
		expect(updated.createdByUserId).toBe(creatorUserId);
		expect(updated.createdAt).toBe(mcqRow.created_at);
	});

	it("throws not-found when a non-owner updates an MCQ", async () => {
		const db = createMockDb({
			handlers: [() => ({ all: async () => ({ results: [] }) })],
		});

		await expect(
			updateMcq(db as never, mcqId, otherUserId, {
				...createInput,
				choices: [
					{ id: choiceOneId, choice: "Workers", isCorrect: true },
					{ id: choiceTwoId, choice: "Registrar", isCorrect: false },
				],
			}),
		).rejects.toBeInstanceOf(McqNotFoundError);
	});

	it("throws a choice conflict when update references a stale choice ID", async () => {
		const db = createMockDb({
			handlers: [
				() => ({ all: async () => ({ results: [mcqRow] }) }),
				() => ({ all: async () => ({ results: [{ id: choiceOneId }] }) }),
			],
		});

		await expect(
			updateMcq(db as never, mcqId, creatorUserId, {
				...createInput,
				choices: [
					{ id: choiceOneId, choice: "Workers", isCorrect: true },
					{ id: "f".repeat(32), choice: "Registrar", isCorrect: false },
				],
			}),
		).rejects.toBeInstanceOf(McqChoiceConflictError);
	});

	it("deletes an owned MCQ and reports not-found for non-owners", async () => {
		const ownedDb = createMockDb({
			handlers: [
				(sql) => {
					expect(sql).toContain("DELETE FROM mcqs");
					return { run: async () => ({ success: true, meta: { changes: 1 } }) };
				},
			],
		});

		await expect(deleteMcq(ownedDb as never, mcqId, creatorUserId)).resolves.toBe(true);

		const missingDb = createMockDb({
			handlers: [() => ({ run: async () => ({ success: true, meta: { changes: 0 } }) })],
		});

		await expect(deleteMcq(missingDb as never, mcqId, otherUserId)).rejects.toBeInstanceOf(
			McqNotFoundError,
		);
	});

	it("records a correct attempt using server-derived correctness", async () => {
		const db = createMockDb({
			handlers: [
				() => ({ all: async () => ({ results: [{ id: mcqId }] }) }),
				() => ({ all: async () => ({ results: [{ id: choiceOneId, is_correct: 1 }] }) }),
				() => ({ run: async () => ({ success: true }) }),
				() => ({
					all: async () => ({
						results: [
							{
								id: "1".repeat(32),
								mcq_id: mcqId,
								user_id: creatorUserId,
								selected_choice_id: choiceOneId,
								is_correct: 1,
								created_at: "2026-09-01T11:00:00Z",
							},
						],
					}),
				}),
			],
		});

		const attempt = await recordMcqAttempt(db as never, mcqId, creatorUserId, choiceOneId);

		expect(attempt.isCorrect).toBe(true);
		expect(attempt.selectedChoiceId).toBe(choiceOneId);
	});

	it("records an incorrect attempt without trusting client correctness", async () => {
		const db = createMockDb({
			handlers: [
				() => ({ all: async () => ({ results: [{ id: mcqId }] }) }),
				() => ({ all: async () => ({ results: [{ id: choiceTwoId, is_correct: 0 }] }) }),
				() => ({ run: async () => ({ success: true }) }),
				() => ({
					all: async () => ({
						results: [
							{
								id: "2".repeat(32),
								mcq_id: mcqId,
								user_id: creatorUserId,
								selected_choice_id: choiceTwoId,
								is_correct: 0,
								created_at: "2026-09-01T11:05:00Z",
							},
						],
					}),
				}),
			],
		});

		const attempt = await recordMcqAttempt(db as never, mcqId, creatorUserId, choiceTwoId);

		expect(attempt.isCorrect).toBe(false);
	});

	it("rejects attempts when the MCQ does not exist", async () => {
		const db = createMockDb({
			handlers: [() => ({ all: async () => ({ results: [] }) })],
		});

		await expect(
			recordMcqAttempt(db as never, mcqId, creatorUserId, choiceOneId),
		).rejects.toBeInstanceOf(McqNotFoundError);
	});

	it("rejects attempts when the selected choice does not belong to the MCQ", async () => {
		const db = createMockDb({
			handlers: [
				() => ({ all: async () => ({ results: [{ id: mcqId }] }) }),
				() => ({ all: async () => ({ results: [] }) }),
			],
		});

		await expect(
			recordMcqAttempt(db as never, mcqId, creatorUserId, choiceOneId),
		).rejects.toBeInstanceOf(InvalidMcqChoiceError);
	});
});
