import { getDb } from "@/lib/db";
import {
	authenticateRequest,
	handleMcqRouteError,
	jsonSuccess,
	parseJsonBody,
	validationErrorResponse,
} from "@/lib/api/mcq-route-utils";
import { createMcq, listMcqs } from "@/lib/services/mcq-service";
import { createMcqSchema } from "@/lib/validation/mcq-schemas";

export async function GET() {
	const auth = await authenticateRequest();
	if (auth instanceof Response) {
		return auth;
	}

	try {
		const db = await getDb();
		const items = await listMcqs(db, auth.sub);
		return jsonSuccess(items);
	} catch (error) {
		return handleMcqRouteError(error);
	}
}

export async function POST(request: Request) {
	const auth = await authenticateRequest();
	if (auth instanceof Response) {
		return auth;
	}

	const body = await parseJsonBody(request);
	if (body instanceof Response) {
		return body;
	}

	const parsed = createMcqSchema.safeParse(body);
	if (!parsed.success) {
		return validationErrorResponse(parsed.error);
	}

	try {
		const db = await getDb();
		const mcq = await createMcq(db, auth.sub, parsed.data);
		return jsonSuccess(mcq, 201);
	} catch (error) {
		return handleMcqRouteError(error);
	}
}
