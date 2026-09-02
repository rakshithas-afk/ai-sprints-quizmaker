import Link from "next/link";

import { McqTable } from "@/components/mcq/mcq-table";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { listMcqs } from "@/lib/services/mcq-service";

export default async function McqsPage() {
	const session = await requireAuth();
	const db = await getDb();
	const items = await listMcqs(db, session.sub);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-1">
					<h1 className="font-heading text-2xl font-semibold tracking-tight">
						Multiple-choice questions
					</h1>
					<p className="text-sm text-muted-foreground">
						Browse the shared question bank, create new MCQs, and manage the questions you own.
					</p>
				</div>
				<Button nativeButton={false} render={<Link href="/mcqs/new" />}>
					Create MCQ
				</Button>
			</div>

			<McqTable items={items} currentUserId={session.sub} />
		</div>
	);
}
