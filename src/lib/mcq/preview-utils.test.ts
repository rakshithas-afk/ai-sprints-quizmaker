import { describe, expect, it } from "vitest";

import {
	canSubmitAttempt,
	getAttemptFeedback,
	validateAttemptSelection,
} from "@/lib/mcq/preview-utils";

describe("validateAttemptSelection", () => {
	it("requires a selected choice before submission", () => {
		expect(validateAttemptSelection(null)).toEqual({
			valid: false,
			message: "Please select an answer before submitting.",
		});
	});

	it("accepts a selected choice ID", () => {
		expect(validateAttemptSelection("d".repeat(32))).toEqual({
			valid: true,
			selectedChoiceId: "d".repeat(32),
		});
	});
});

describe("canSubmitAttempt", () => {
	it("allows submission only when a choice is selected and no request is pending", () => {
		expect(canSubmitAttempt("d".repeat(32), false)).toBe(true);
		expect(canSubmitAttempt(null, false)).toBe(false);
		expect(canSubmitAttempt("d".repeat(32), true)).toBe(false);
	});
});

describe("getAttemptFeedback", () => {
	it("returns clear correct and incorrect messages", () => {
		expect(getAttemptFeedback(true)).toBe("Correct!");
		expect(getAttemptFeedback(false)).toBe("Incorrect.");
	});
});
