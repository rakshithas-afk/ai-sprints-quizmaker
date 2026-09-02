import type { CreateMcqInput, UpdateMcqInput } from "@/lib/validation/mcq-schemas";

export const MIN_CHOICES = 2;
export const MAX_CHOICES = 6;

export interface FormChoice {
	id?: string;
	choice: string;
	isCorrect: boolean;
}

export function createDefaultChoices(): FormChoice[] {
	return [
		{ choice: "", isCorrect: true },
		{ choice: "", isCorrect: false },
	];
}

export function addChoice(choices: FormChoice[]): FormChoice[] {
	if (choices.length >= MAX_CHOICES) {
		return choices;
	}

	return [...choices, { choice: "", isCorrect: false }];
}

export function removeChoice(choices: FormChoice[], index: number): FormChoice[] {
	if (choices.length <= MIN_CHOICES || index < 0 || index >= choices.length) {
		return choices;
	}

	const nextChoices = choices.filter((_, choiceIndex) => choiceIndex !== index);
	if (!nextChoices.some((choice) => choice.isCorrect)) {
		nextChoices[0] = { ...nextChoices[0], isCorrect: true };
	}

	return nextChoices;
}

export function setCorrectChoice(choices: FormChoice[], index: number): FormChoice[] {
	return choices.map((choice, choiceIndex) => ({
		...choice,
		isCorrect: choiceIndex === index,
	}));
}

export function buildMcqPayload(
	name: string,
	question: string,
	choices: FormChoice[],
): CreateMcqInput {
	return {
		name,
		question,
		choices: choices.map(({ choice, isCorrect }) => ({ choice, isCorrect })),
	};
}

export function buildUpdatePayload(
	name: string,
	question: string,
	choices: FormChoice[],
): UpdateMcqInput {
	return {
		name,
		question,
		choices: choices.map(({ id, choice, isCorrect }) => ({
			...(id ? { id } : {}),
			choice,
			isCorrect,
		})),
	};
}

export function getChoiceFieldError(
	fieldErrors: Record<string, string[]>,
	index: number,
): string[] | undefined {
	return fieldErrors[`choices.${index}.choice`];
}

export function truncateText(text: string, maxLength = 80): string {
	if (text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, maxLength - 1)}…`;
}

export function formatMcqDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return date.toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}
