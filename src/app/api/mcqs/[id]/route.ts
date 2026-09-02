import { getDb } from "@/lib/db";
import {
	authenticateRequest,
	handleMcqRouteError,
	jsonError,
	jsonSuccess,
	parseJsonBody,
	validationErrorResponse,
} from "@/lib/api/mcq-route-utils";
import { deleteMcq, getMcqById, getMcqForPreview, updateMcq } from "@/lib/services/mcq-service";
import { mcqIdSchema, updateMcqSchema } from "@/lib/validation/mcq-schemas";

type RouteContext = {
	params: Promise<{ id: string }>;
};

async function parseMcqId(id: string) {
	const parsed = mcqIdSchema.safeParse(id);
	if (!parsed.success) {
		return validationErrorResponse(parsed.error);
	}
	return parsed.data;
}

export async function GET(request: Request, context: RouteContext) {
	const auth = await authenticateRequest();
	if (auth instanceof Response) {
		return auth;
	}

	const { id } = await context.params;
	const mcqId = await parseMcqId(id);
	if (mcqId instanceof Response) {
		return mcqId;
	}

	const mode = new URL(request.url).searchParams.get("mode");

	try {
		const db = await getDb();

		if (mode === "edit") {
			const mcq = await getMcqById(db, mcqId, auth.sub);
			return jsonSuccess(mcq);
		}

		const preview = await getMcqForPreview(db, mcqId);
		if (!preview) {
			return jsonError("MCQ_NOT_FOUND", "MCQ not found.", 404);
		}

		return jsonSuccess(preview);
	} catch (error) {
		return handleMcqRouteError(error);
	}
}

export async function PUT(request: Request, context: RouteContext) {
	const auth = await authenticateRequest();
	if (auth instanceof Response) {
		return auth;
	}

	const { id } = await context.params;
	const mcqId = await parseMcqId(id);
	if (mcqId instanceof Response) {
		return mcqId;
	}

	const body = await parseJsonBody(request);
	if (body instanceof Response) {
		return body;
	}

	const parsed = updateMcqSchema.safeParse(body);
	if (!parsed.success) {
		return validationErrorResponse(parsed.error);
	}

	try {
		const db = await getDb();
		const mcq = await updateMcq(db, mcqId, auth.sub, parsed.data);
		return jsonSuccess(mcq);
	} catch (error) {
		return handleMcqRouteError(error);
	}
}

export async function DELETE(_request: Request, context: RouteContext) {
	const auth = await authenticateRequest();
	if (auth instanceof Response) {
		return auth;
	}

	const { id } = await context.params;
	const mcqId = await parseMcqId(id);
	if (mcqId instanceof Response) {
		return mcqId;
	}

	try {
		const db = await getDb();
		await deleteMcq(db, mcqId, auth.sub);
		return new Response(null, { status: 204 });
	} catch (error) {
		return handleMcqRouteError(error);
	}
}
