import { describe, expect, it } from "vitest";

import {
	addChoice,
	buildMcqPayload,
	createDefaultChoices,
	getChoiceFieldError,
	removeChoice,
	setCorrectChoice,
} from "@/lib/mcq/form-utils";

describe("createDefaultChoices", () => {
	it("creates two blank choices with the first marked correct by default", () => {
		const choices = createDefaultChoices();

		expect(choices).toHaveLength(2);
		expect(choices[0]).toEqual({ choice: "", isCorrect: true });
		expect(choices[1]).toEqual({ choice: "", isCorrect: false });
	});
});

describe("addChoice", () => {
	it("adds a blank incorrect choice until the maximum is reached", () => {
		let choices = createDefaultChoices();

		for (let index = 0; index < 4; index += 1) {
			choices = addChoice(choices);
		}

		expect(choices).toHaveLength(6);
		expect(choices.every((choice, index) => choice.isCorrect === (index === 0))).toBe(true);
	});

	it("does not add more than six choices", () => {
		let choices = createDefaultChoices();
		for (let index = 0; index < 10; index += 1) {
			choices = addChoice(choices);
		}

		expect(choices).toHaveLength(6);
	});
});

describe("removeChoice", () => {
	it("removes a choice while keeping exactly one correct answer", () => {
		let choices = addChoice(addChoice(createDefaultChoices()));
		choices = setCorrectChoice(choices, 2);
		choices = removeChoice(choices, 2);

		expect(choices).toHaveLength(3);
		expect(choices.filter((choice) => choice.isCorrect)).toHaveLength(1);
		expect(choices.some((choice) => choice.isCorrect)).toBe(true);
	});

	it("does not remove below two choices", () => {
		const choices = removeChoice(createDefaultChoices(), 0);

		expect(choices).toHaveLength(2);
	});
});

describe("setCorrectChoice", () => {
	it("marks only the selected choice as correct", () => {
		const choices = setCorrectChoice(addChoice(createDefaultChoices()), 2);

		expect(choices.map((choice) => choice.isCorrect)).toEqual([false, false, true]);
	});
});

describe("buildMcqPayload", () => {
	it("builds the API payload from form state", () => {
		const payload = buildMcqPayload("Name", "Question?", [
			{ choice: "A", isCorrect: true },
			{ choice: "B", isCorrect: false },
		]);

		expect(payload).toEqual({
			name: "Name",
			question: "Question?",
			choices: [
				{ choice: "A", isCorrect: true },
				{ choice: "B", isCorrect: false },
			],
		});
	});
});

describe("getChoiceFieldError", () => {
	it("returns indexed choice field errors for a specific row", () => {
		expect(
			getChoiceFieldError(
				{
					"choices.1.choice": ["Choice text is required."],
				},
				1,
			),
		).toEqual(["Choice text is required."]);
	});
});
