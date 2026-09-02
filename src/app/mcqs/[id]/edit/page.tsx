import { notFound } from "next/navigation";

import { McqFormFromMcq } from "@/components/mcq/mcq-form";
import { getDb } from "@/lib/db";
import { McqNotFoundError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/session";
import { getMcqById } from "@/lib/services/mcq-service";
import { mcqIdSchema } from "@/lib/validation/mcq-schemas";

async function loadEditableMcq(mcqId: string, userId: string) {
	try {
		const db = await getDb();
		return await getMcqById(db, mcqId, userId);
	} catch (error) {
		if (error instanceof McqNotFoundError) {
			return null;
		}
		throw error;
	}
}

export default async function EditMcqPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await requireAuth();
	const { id } = await params;

	if (!mcqIdSchema.safeParse(id).success) {
		notFound();
	}

	const mcq = await loadEditableMcq(id, session.sub);
	if (!mcq) {
		notFound();
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<div className="space-y-1">
				<h1 className="font-heading text-2xl font-semibold tracking-tight">Edit MCQ</h1>
				<p className="text-sm text-muted-foreground">
					Update the question, choices, and correct answer for this MCQ.
				</p>
			</div>
			<McqFormFromMcq mcq={mcq} />
		</div>
	);
}
