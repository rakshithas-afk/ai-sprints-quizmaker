"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldSet, FieldLegend } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { submitMcqAttemptRequest } from "@/lib/mcq/api-client";
import {
	canSubmitAttempt,
	getAttemptFeedback,
	validateAttemptSelection,
} from "@/lib/mcq/preview-utils";
import type { McqPreview } from "@/lib/mcq-types";

export function McqPreviewPanel({ mcq }: { mcq: McqPreview }) {
	const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const [result, setResult] = useState<{ isCorrect: boolean } | null>(null);

	async function handleSubmit() {
		const validation = validateAttemptSelection(selectedChoiceId);
		if (!validation.valid) {
			setValidationError(validation.message);
			setResult(null);
			return;
		}

		if (!canSubmitAttempt(validation.selectedChoiceId, pending)) {
			return;
		}

		setPending(true);
		setValidationError(null);
		setSubmitError(null);
		setResult(null);

		const response = await submitMcqAttemptRequest(mcq.id, validation.selectedChoiceId);
		setPending(false);

		if (!response.ok) {
			setSubmitError(response.error.message);
			return;
		}

		setResult({ isCorrect: response.data.isCorrect });
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="font-heading text-2xl font-semibold tracking-tight">{mcq.name}</h1>
				<p className="text-sm text-muted-foreground">Created by {mcq.creatorName}</p>
			</div>

			<div className="rounded-xl border p-6">
				<p className="text-base leading-relaxed">{mcq.question}</p>
			</div>

			<FieldSet>
				<FieldLegend>Choose your answer</FieldLegend>
				<RadioGroup
					value={selectedChoiceId ?? ""}
					onValueChange={(value) => {
						setSelectedChoiceId(value);
						setValidationError(null);
						setSubmitError(null);
					}}
					disabled={pending}
				>
					{mcq.choices.map((choice) => (
						<div key={choice.id} className="flex items-start gap-3 rounded-lg border p-4">
							<RadioGroupItem
								value={choice.id}
								id={`preview-choice-${choice.id}`}
							/>
							<Field className="flex-1">
								<FieldLabel htmlFor={`preview-choice-${choice.id}`}>
									{choice.choice}
								</FieldLabel>
							</Field>
						</div>
					))}
				</RadioGroup>
			</FieldSet>

			{validationError ? (
				<div role="alert" className="text-sm text-destructive">
					{validationError}
				</div>
			) : null}

			{submitError ? (
				<div role="alert" className="text-sm text-destructive">
					{submitError}
				</div>
			) : null}

			{result ? (
				<div
					role="status"
					className={
						result.isCorrect
							? "rounded-lg border border-green-600/30 bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-200"
							: "rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
					}
				>
					{getAttemptFeedback(result.isCorrect)}
				</div>
			) : null}

			<div className="flex flex-wrap gap-3">
				<Button
					type="button"
					disabled={!canSubmitAttempt(selectedChoiceId, pending)}
					onClick={() => void handleSubmit()}
				>
					{pending ? "Submitting..." : "Submit answer"}
				</Button>
				<Button type="button" variant="outline" nativeButton={false} render={<Link href="/mcqs" />}>
					Back to MCQs
				</Button>
			</div>
		</div>
	);
}
