import { z } from "zod";

export const mcqIdSchema = z
	.string()
	.regex(/^[0-9a-f]{32}$/, "ID must be a 32-character lowercase hexadecimal value.");

const choiceTextSchema = z
	.string()
	.trim()
	.min(1, "Choice text is required.")
	.max(500, "Choice text must be at most 500 characters.");

export const mcqChoiceSchema = z
	.object({
		choice: choiceTextSchema,
		isCorrect: z.boolean(),
	})
	.strict();

const updateMcqChoiceSchema = z
	.object({
		id: mcqIdSchema.optional(),
		choice: choiceTextSchema,
		isCorrect: z.boolean(),
	})
	.strict();

function hasExactlyOneCorrectChoice(choices: Array<{ isCorrect: boolean }>): boolean {
	return choices.filter((choice) => choice.isCorrect).length === 1;
}

function mcqObjectSchema<T extends z.ZodType<{ choice: string; isCorrect: boolean }>>(choiceSchema: T) {
	return z
		.object({
			name: z
				.string()
				.trim()
				.min(1, "Name is required.")
				.max(120, "Name must be at most 120 characters."),
			question: z
				.string()
				.trim()
				.min(1, "Question is required.")
				.max(2000, "Question must be at most 2000 characters."),
			choices: z
				.array(choiceSchema)
				.min(2, "At least two choices are required.")
				.max(6, "No more than six choices are allowed."),
		})
		.strict()
		.refine((input) => hasExactlyOneCorrectChoice(input.choices), {
			message: "Exactly one choice must be marked correct.",
			path: ["choices"],
		});
}

export const createMcqSchema = mcqObjectSchema(mcqChoiceSchema);
export const updateMcqSchema = mcqObjectSchema(updateMcqChoiceSchema);

export const recordMcqAttemptSchema = z
	.object({
		selectedChoiceId: mcqIdSchema,
	})
	.strict();

export type McqChoiceInput = z.infer<typeof mcqChoiceSchema>;
export type CreateMcqInput = z.infer<typeof createMcqSchema>;
export type UpdateMcqInput = z.infer<typeof updateMcqSchema>;
export type RecordMcqAttemptInput = z.infer<typeof recordMcqAttemptSchema>;

export function mcqFieldErrors(error: z.ZodError): Record<string, string[]> {
	const fieldErrors: Record<string, string[]> = {};

	for (const issue of error.issues) {
		if (issue.path.length === 0) {
			continue;
		}

		const field = issue.path.map(String).join(".");
		fieldErrors[field] ??= [];
		fieldErrors[field].push(issue.message);
	}

	return fieldErrors;
}
