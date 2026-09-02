export interface McqChoice {
	id: string;
	mcqId: string;
	choice: string;
	isCorrect: boolean;
	position: number;
	createdAt: string;
	updatedAt: string;
}

export type McqPreviewChoice = Omit<McqChoice, "isCorrect">;

export interface Mcq {
	id: string;
	name: string;
	question: string;
	createdByUserId: string;
	creatorName: string;
	createdAt: string;
	updatedAt: string;
	choices: McqChoice[];
}

export interface McqListItem {
	id: string;
	name: string;
	question: string;
	createdByUserId: string;
	creatorName: string;
	createdAt: string;
	updatedAt: string;
}

export interface McqPreview extends Omit<Mcq, "choices"> {
	choices: McqPreviewChoice[];
}

export interface McqAttempt {
	id: string;
	mcqId: string;
	userId: string;
	selectedChoiceId: string;
	isCorrect: boolean;
	createdAt: string;
}
