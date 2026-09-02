export function validateAttemptSelection(
	selectedChoiceId: string | null,
): { valid: true; selectedChoiceId: string } | { valid: false; message: string } {
	if (!selectedChoiceId) {
		return {
			valid: false,
			message: "Please select an answer before submitting.",
		};
	}

	return { valid: true, selectedChoiceId };
}

export function canSubmitAttempt(selectedChoiceId: string | null, pending: boolean): boolean {
	return Boolean(selectedChoiceId) && !pending;
}

export function getAttemptFeedback(isCorrect: boolean): string {
	return isCorrect ? "Correct!" : "Incorrect.";
}
