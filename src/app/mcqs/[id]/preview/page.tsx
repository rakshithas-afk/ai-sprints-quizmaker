import { notFound } from "next/navigation";

import { McqPreviewPanel } from "@/components/mcq/mcq-preview";
import { getDb } from "@/lib/db";
import { getMcqForPreview } from "@/lib/services/mcq-service";
import { mcqIdSchema } from "@/lib/validation/mcq-schemas";

export default async function PreviewMcqPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	if (!mcqIdSchema.safeParse(id).success) {
		notFound();
	}

	const db = await getDb();
	const preview = await getMcqForPreview(db, id);

	if (!preview) {
		notFound();
	}

	return (
		<div className="mx-auto max-w-3xl">
			<McqPreviewPanel mcq={preview} />
		</div>
	);
}
