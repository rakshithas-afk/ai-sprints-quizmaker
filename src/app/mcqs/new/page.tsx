import { McqForm } from "@/components/mcq/mcq-form";

export default function NewMcqPage() {
	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<div className="space-y-1">
				<h1 className="font-heading text-2xl font-semibold tracking-tight">Create MCQ</h1>
				<p className="text-sm text-muted-foreground">
					Add a new multiple-choice question with between two and six choices.
				</p>
			</div>
			<McqForm mode="create" />
		</div>
	);
}
