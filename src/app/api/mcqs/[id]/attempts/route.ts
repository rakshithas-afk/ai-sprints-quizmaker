import { getDb } from "@/lib/db";
import {
	authenticateRequest,
	handleMcqRouteError,
	jsonSuccess,
	parseJsonBody,
	validationErrorResponse,
} from "@/lib/api/mcq-route-utils";
import { recordMcqAttempt } from "@/lib/services/mcq-service";
import { mcqIdSchema, recordMcqAttemptSchema } from "@/lib/validation/mcq-schemas";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
	const auth = await authenticateRequest();
	if (auth instanceof Response) {
		return auth;
	}

	const { id } = await context.params;
	const parsedMcqId = mcqIdSchema.safeParse(id);
	if (!parsedMcqId.success) {
		return validationErrorResponse(parsedMcqId.error);
	}

	const body = await parseJsonBody(request);
	if (body instanceof Response) {
		return body;
	}

	const parsedBody = recordMcqAttemptSchema.safeParse(body);
	if (!parsedBody.success) {
		return validationErrorResponse(parsedBody.error);
	}

	try {
		const db = await getDb();
		const attempt = await recordMcqAttempt(
			db,
			parsedMcqId.data,
			auth.sub,
			parsedBody.data.selectedChoiceId,
		);

		return jsonSuccess(
			{
				attemptId: attempt.id,
				isCorrect: attempt.isCorrect,
			},
			201,
		);
	} catch (error) {
		return handleMcqRouteError(error);
	}
}
