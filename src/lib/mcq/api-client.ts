export type ApiErrorBody = {
	code: string;
	message: string;
	fieldErrors?: Record<string, string[]>;
};

export type ApiResponse<T> = {
	data: T | null;
	error: ApiErrorBody | null;
};

export async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
	return (await response.json()) as ApiResponse<T>;
}

export type AttemptResult = {
	attemptId: string;
	isCorrect: boolean;
};

export async function submitMcqAttemptRequest(
	mcqId: string,
	selectedChoiceId: string,
): Promise<{ ok: true; data: AttemptResult } | { ok: false; error: ApiErrorBody }> {
	const response = await fetch(`/api/mcqs/${mcqId}/attempts`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ selectedChoiceId }),
	});

	if (response.status === 201) {
		const body = await readApiResponse<AttemptResult>(response);
		if (!body.data) {
			return {
				ok: false,
				error: body.error ?? {
					code: "INTERNAL_ERROR",
					message: "Something went wrong. Please try again later.",
				},
			};
		}

		return { ok: true, data: body.data };
	}

	const body = await readApiResponse<null>(response);
	return {
		ok: false,
		error: body.error ?? {
			code: "INTERNAL_ERROR",
			message: "Something went wrong. Please try again later.",
		},
	};
}

export async function deleteMcqRequest(mcqId: string): Promise<{ ok: true } | { ok: false; error: ApiErrorBody }> {
	const response = await fetch(`/api/mcqs/${mcqId}`, {
		method: "DELETE",
	});

	if (response.status === 204) {
		return { ok: true };
	}

	if (response.status === 401) {
		return {
			ok: false,
			error: {
				code: "UNAUTHORIZED",
				message: "Authentication required.",
			},
		};
	}

	const body = await readApiResponse<null>(response);
	return {
		ok: false,
		error: body.error ?? {
			code: "INTERNAL_ERROR",
			message: "Something went wrong. Please try again later.",
		},
	};
}
