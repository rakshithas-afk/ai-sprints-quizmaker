export class DuplicateEmailError extends Error {
	constructor() {
		super("An account with this email already exists.");
		this.name = "DuplicateEmailError";
	}
}

export class UserNotFoundError extends Error {
	constructor() {
		super("User not found.");
		this.name = "UserNotFoundError";
	}
}

abstract class McqDomainError extends Error {
	abstract readonly code: string;

	protected constructor(message: string) {
		super(message);
		this.name = new.target.name;
	}
}

export class McqNotFoundError extends McqDomainError {
	readonly code = "MCQ_NOT_FOUND";

	constructor() {
		super("MCQ not found.");
	}
}

export class InvalidMcqChoiceError extends McqDomainError {
	readonly code = "INVALID_MCQ_CHOICE";

	constructor() {
		super("The selected choice is not valid for this MCQ.");
	}
}

export class McqChoiceConflictError extends McqDomainError {
	readonly code = "MCQ_CHOICE_CONFLICT";

	constructor() {
		super("One or more choices are no longer valid.");
	}
}

export class McqPersistenceError extends McqDomainError {
	readonly code = "MCQ_PERSISTENCE_ERROR";
	readonly cause?: unknown;

	constructor(cause?: unknown) {
		super("The MCQ operation could not be completed.");
		this.cause = cause;
	}
}
