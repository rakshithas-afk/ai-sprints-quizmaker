import { NextResponse } from "next/server";
import type { ZodError } from "zod";

import { getSession } from "@/lib/auth/session";
import type { AuthPayload } from "@/lib/auth/jwt";
import {
	InvalidMcqChoiceError,
	McqChoiceConflictError,
	McqNotFoundError,
	McqPersistenceError,
} from "@/lib/errors";
import { mcqFieldErrors } from "@/lib/validation/mcq-schemas";

export type ApiErrorBody = {
	code: string;
	message: string;
	fieldErrors?: Record<string, string[]>;
};

export function jsonSuccess<T>(data: T, status = 200): NextResponse {
	return NextResponse.json({ data, error: null }, { status });
}

export function jsonError(
	code: string,
	message: string,
	status: number,
	fieldErrors?: Record<string, string[]>,
): NextResponse {
	return NextResponse.json(
		{
			data: null,
			error: {
				code,
				message,
				...(fieldErrors ? { fieldErrors } : {}),
			},
		},
		{ status },
	);
}

export async function authenticateRequest(): Promise<AuthPayload | NextResponse> {
	const session = await getSession();
	if (!session) {
		return jsonError("UNAUTHORIZED", "Authentication required.", 401);
	}
	return session;
}

export async function parseJsonBody(request: Request): Promise<unknown | NextResponse> {
	try {
		return await request.json();
	} catch {
		return jsonError("VALIDATION_ERROR", "Request body must be valid JSON.", 400);
	}
}

export function validationErrorResponse(error: ZodError): NextResponse {
	return jsonError(
		"VALIDATION_ERROR",
		"Please correct the highlighted fields.",
		400,
		mcqFieldErrors(error),
	);
}

export function handleMcqRouteError(error: unknown): NextResponse {
	if (error instanceof McqNotFoundError) {
		return jsonError(error.code, error.message, 404);
	}
	if (error instanceof McqChoiceConflictError || error instanceof InvalidMcqChoiceError) {
		return jsonError(error.code, error.message, 409);
	}
	if (error instanceof McqPersistenceError) {
		return jsonError(error.code, error.message, 500);
	}
	return jsonError("INTERNAL_ERROR", "Something went wrong. Please try again later.", 500);
}
