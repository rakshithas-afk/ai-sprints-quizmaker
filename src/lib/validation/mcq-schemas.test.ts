import { describe, expect, it } from "vitest";

import {
	createMcqSchema,
	mcqFieldErrors,
	mcqIdSchema,
	recordMcqAttemptSchema,
	updateMcqSchema,
} from "@/lib/validation/mcq-schemas";

const validChoices = [
	{ choice: "Workers", isCorrect: true },
	{ choice: "Registrar", isCorrect: false },
];

const validMcq = {
	name: "Cloudflare fundamentals",
	question: "Which Cloudflare product provides serverless compute?",
	choices: validChoices,
};

describe("createMcqSchema", () => {
	it.each([2, 3, 6])("accepts an MCQ with %i choices and exactly one correct answer", (count) => {
		const choices = Array.from({ length: count }, (_, index) => ({
			choice: `Choice ${index + 1}`,
			isCorrect: index === 0,
		}));

		expect(createMcqSchema.safeParse({ ...validMcq, choices }).success).toBe(true);
	});

	it("trims the name, question, and choice text", () => {
		const result = createMcqSchema.safeParse({
			name: "  Cloudflare fundamentals  ",
			question: "  Which product provides serverless compute?  ",
			choices: [
				{ choice: "  Workers  ", isCorrect: true },
				{ choice: "  Registrar  ", isCorrect: false },
			],
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toMatchObject({
				name: "Cloudflare fundamentals",
				question: "Which product provides serverless compute?",
				choices: [
					{ choice: "Workers", isCorrect: true },
					{ choice: "Registrar", isCorrect: false },
				],
			});
		}
	});

	it.each([
		["name", { ...validMcq, name: "   " }],
		["question", { ...validMcq, question: "   " }],
		[
			"choice",
			{
				...validMcq,
				choices: [
					{ choice: "   ", isCorrect: true },
					{ choice: "Registrar", isCorrect: false },
				],
			},
		],
	])("rejects a whitespace-only %s", (_field, input) => {
		expect(createMcqSchema.safeParse(input).success).toBe(false);
	});

	it("rejects fewer than two choices", () => {
		const result = createMcqSchema.safeParse({
			...validMcq,
			choices: [{ choice: "Workers", isCorrect: true }],
		});

		expect(result.success).toBe(false);
	});

	it("rejects more than six choices", () => {
		const choices = Array.from({ length: 7 }, (_, index) => ({
			choice: `Choice ${index + 1}`,
			isCorrect: index === 0,
		}));

		expect(createMcqSchema.safeParse({ ...validMcq, choices }).success).toBe(false);
	});

	it.each([
		[
			"no correct answer",
			[
				{ choice: "Workers", isCorrect: false },
				{ choice: "Registrar", isCorrect: false },
			],
		],
		[
			"multiple correct answers",
			[
				{ choice: "Workers", isCorrect: true },
				{ choice: "Pages", isCorrect: true },
			],
		],
	])("rejects %s", (_case, choices) => {
		expect(createMcqSchema.safeParse({ ...validMcq, choices }).success).toBe(false);
	});

	it("accepts documented maximum lengths", () => {
		const result = createMcqSchema.safeParse({
			name: "n".repeat(120),
			question: "q".repeat(2000),
			choices: [
				{ choice: "a".repeat(500), isCorrect: true },
				{ choice: "b".repeat(500), isCorrect: false },
			],
		});

		expect(result.success).toBe(true);
	});

	it.each([
		["name", { ...validMcq, name: "n".repeat(121) }],
		["question", { ...validMcq, question: "q".repeat(2001) }],
		[
			"choice",
			{
				...validMcq,
				choices: [
					{ choice: "a".repeat(501), isCorrect: true },
					{ choice: "Registrar", isCorrect: false },
				],
			},
		],
	])("rejects a %s over its maximum length", (_field, input) => {
		expect(createMcqSchema.safeParse(input).success).toBe(false);
	});

	it.each([
		["ownership", { ...validMcq, createdByUserId: "a".repeat(32) }],
		["timestamps", { ...validMcq, createdAt: "2026-09-01T00:00:00Z" }],
		["choice IDs", { ...validMcq, choices: validChoices.map((choice) => ({ ...choice, id: "a".repeat(32) })) }],
	])("rejects unexpected client-controlled %s", (_field, input) => {
		expect(createMcqSchema.safeParse(input).success).toBe(false);
	});

	it("returns indexed choice errors suitable for individual form rows", () => {
		const result = createMcqSchema.safeParse({
			...validMcq,
			choices: [
				{ choice: "Workers", isCorrect: true },
				{ choice: "   ", isCorrect: false },
			],
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(mcqFieldErrors(result.error)).toHaveProperty("choices.1.choice");
		}
	});
});

describe("updateMcqSchema", () => {
	it("accepts valid existing choice IDs and new choices without IDs", () => {
		const result = updateMcqSchema.safeParse({
			...validMcq,
			choices: [
				{ id: "a".repeat(32), choice: "Workers", isCorrect: true },
				{ choice: "Registrar", isCorrect: false },
			],
		});

		expect(result.success).toBe(true);
	});

	it("rejects malformed existing choice IDs", () => {
		const result = updateMcqSchema.safeParse({
			...validMcq,
			choices: [
				{ id: "choice-1", choice: "Workers", isCorrect: true },
				{ choice: "Registrar", isCorrect: false },
			],
		});

		expect(result.success).toBe(false);
	});
});

describe("MCQ identifiers and attempts", () => {
	it("accepts D1-generated lowercase hexadecimal IDs", () => {
		expect(mcqIdSchema.safeParse("0123456789abcdef0123456789abcdef").success).toBe(true);
	});

	it.each(["", "mcq-1", "A".repeat(32), "a".repeat(31), "a".repeat(33)])(
		"rejects malformed ID %j",
		(id) => {
			expect(mcqIdSchema.safeParse(id).success).toBe(false);
		},
	);

	it("accepts an attempt containing a valid selected choice ID", () => {
		const result = recordMcqAttemptSchema.safeParse({
			selectedChoiceId: "b".repeat(32),
		});

		expect(result.success).toBe(true);
	});

	it.each([
		{},
		{ selectedChoiceId: "choice-1" },
		{ selectedChoiceId: "b".repeat(32), isCorrect: true },
		{ selectedChoiceId: "b".repeat(32), userId: "a".repeat(32) },
	])("rejects an invalid or client-controlled attempt payload", (input) => {
		expect(recordMcqAttemptSchema.safeParse(input).success).toBe(false);
	});
});
