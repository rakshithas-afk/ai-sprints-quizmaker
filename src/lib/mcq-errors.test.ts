import { describe, expect, it } from "vitest";

import {
	InvalidMcqChoiceError,
	McqChoiceConflictError,
	McqNotFoundError,
	McqPersistenceError,
} from "@/lib/errors";

describe("MCQ domain errors", () => {
	it.each([
		[new McqNotFoundError(), "MCQ_NOT_FOUND", "MCQ not found."],
		[new InvalidMcqChoiceError(), "INVALID_MCQ_CHOICE", "The selected choice is not valid for this MCQ."],
		[new McqChoiceConflictError(), "MCQ_CHOICE_CONFLICT", "One or more choices are no longer valid."],
		[new McqPersistenceError(), "MCQ_PERSISTENCE_ERROR", "The MCQ operation could not be completed."],
	])("provides a stable code and safe message for %s", (error, code, message) => {
		expect(error).toBeInstanceOf(Error);
		expect(error.code).toBe(code);
		expect(error.message).toBe(message);
		expect(error.name).toBe(error.constructor.name);
	});

	it("uses the same not-found error for missing and non-owned MCQs", () => {
		const missing = new McqNotFoundError();
		const nonOwned = new McqNotFoundError();

		expect(nonOwned.code).toBe(missing.code);
		expect(nonOwned.message).toBe(missing.message);
	});

	it("can retain an internal persistence cause without exposing it in the message", () => {
		const cause = new Error("SQLITE_CONSTRAINT: internal database detail");
		const error = new McqPersistenceError(cause);

		expect(error.cause).toBe(cause);
		expect(error.message).not.toContain("SQLITE");
	});
});
