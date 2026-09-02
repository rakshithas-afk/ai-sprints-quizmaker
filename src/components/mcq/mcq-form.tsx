"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { readApiResponse } from "@/lib/mcq/api-client";
import {
	addChoice,
	buildMcqPayload,
	buildUpdatePayload,
	createDefaultChoices,
	getChoiceFieldError,
	MAX_CHOICES,
	MIN_CHOICES,
	removeChoice,
	setCorrectChoice,
	type FormChoice,
} from "@/lib/mcq/form-utils";
import type { Mcq } from "@/lib/mcq-types";

function toFieldErrors(messages?: string[]) {
	return messages?.map((message) => ({ message }));
}

function mapMcqToFormChoices(mcq: Mcq): FormChoice[] {
	return mcq.choices.map((choice) => ({
		id: choice.id,
		choice: choice.choice,
		isCorrect: choice.isCorrect,
	}));
}

export function McqForm({
	mode,
	mcqId,
	initialValues,
}: {
	mode: "create" | "edit";
	mcqId?: string;
	initialValues?: {
		name: string;
		question: string;
		choices: FormChoice[];
	};
}) {
	const router = useRouter();
	const [name, setName] = useState(initialValues?.name ?? "");
	const [question, setQuestion] = useState(initialValues?.question ?? "");
	const [choices, setChoices] = useState<FormChoice[]>(
		initialValues?.choices ?? createDefaultChoices(),
	);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const correctChoiceIndex = choices.findIndex((choice) => choice.isCorrect);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (pending) {
			return;
		}

		setPending(true);
		setFormError(null);
		setFieldErrors({});

		const payload =
			mode === "create"
				? buildMcqPayload(name, question, choices)
				: buildUpdatePayload(name, question, choices);

		const response = await fetch(mode === "create" ? "/api/mcqs" : `/api/mcqs/${mcqId}`, {
			method: mode === "create" ? "POST" : "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const body = await readApiResponse<null>(response);
			if (body.error?.fieldErrors) {
				setFieldErrors(body.error.fieldErrors);
			}
			setFormError(body.error?.message ?? "Something went wrong. Please try again later.");
			setPending(false);
			return;
		}

		router.push("/mcqs");
		router.refresh();
	}

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			{formError ? (
				<div role="alert" className="text-sm text-destructive">
					{formError}
				</div>
			) : null}

			<FieldGroup>
				<Field data-invalid={!!fieldErrors.name}>
					<FieldLabel htmlFor="mcq-name">Name</FieldLabel>
					<Input
						id="mcq-name"
						name="name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						required
						aria-invalid={!!fieldErrors.name}
					/>
					<FieldError errors={toFieldErrors(fieldErrors.name)} />
				</Field>

				<Field data-invalid={!!fieldErrors.question}>
					<FieldLabel htmlFor="mcq-question">Question</FieldLabel>
					<Textarea
						id="mcq-question"
						name="question"
						value={question}
						onChange={(event) => setQuestion(event.target.value)}
						required
						aria-invalid={!!fieldErrors.question}
					/>
					<FieldError errors={toFieldErrors(fieldErrors.question)} />
				</Field>
			</FieldGroup>

			<FieldSet>
				<FieldLegend>Choices</FieldLegend>
				<FieldGroup>
					<RadioGroup
						value={String(Math.max(correctChoiceIndex, 0))}
						onValueChange={(value) => {
							setChoices((currentChoices) => setCorrectChoice(currentChoices, Number(value)));
						}}
					>
						{choices.map((choice, index) => {
							const choiceErrors = getChoiceFieldError(fieldErrors, index);

							return (
								<div key={choice.id ?? `choice-${index}`} className="space-y-2 rounded-lg border p-4">
									<div className="flex items-center justify-between gap-3">
										<p className="text-sm font-medium">Choice {index + 1}</p>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											disabled={choices.length <= MIN_CHOICES || pending}
											onClick={() => setChoices((currentChoices) => removeChoice(currentChoices, index))}
										>
											Remove
										</Button>
									</div>

									<div className="space-y-3">
										<div className="flex items-center gap-2">
											<RadioGroupItem
												value={String(index)}
												id={`correct-choice-${index}`}
											/>
											<label
												htmlFor={`correct-choice-${index}`}
												className="text-sm font-medium"
											>
												Correct answer
											</label>
										</div>
										<Field data-invalid={!!choiceErrors}>
											<FieldLabel htmlFor={`choice-text-${index}`}>Choice text</FieldLabel>
											<Input
												id={`choice-text-${index}`}
												value={choice.choice}
												onChange={(event) => {
													const nextValue = event.target.value;
													setChoices((currentChoices) =>
														currentChoices.map((currentChoice, choiceIndex) =>
															choiceIndex === index
																? { ...currentChoice, choice: nextValue }
																: currentChoice,
														),
													);
												}}
												required
												aria-invalid={!!choiceErrors}
											/>
											<FieldError errors={toFieldErrors(choiceErrors)} />
										</Field>
									</div>
								</div>
							);
						})}
					</RadioGroup>

					{fieldErrors.choices ? (
						<div role="alert" className="text-sm text-destructive">
							{fieldErrors.choices.join(" ")}
						</div>
					) : null}
				</FieldGroup>
			</FieldSet>

			<div className="flex flex-wrap items-center gap-3">
				<Button
					type="button"
					variant="outline"
					disabled={choices.length >= MAX_CHOICES || pending}
					onClick={() => setChoices((currentChoices) => addChoice(currentChoices))}
				>
					Add choice
				</Button>
				<p className="text-sm text-muted-foreground">
					{choices.length} of {MAX_CHOICES} choices
				</p>
			</div>

			<div className="flex flex-wrap gap-3">
				<Button type="submit" disabled={pending}>
					{pending ? "Saving..." : "Save"}
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={pending}
					nativeButton={false}
					render={<Link href="/mcqs" />}
				>
					Cancel
				</Button>
			</div>
		</form>
	);
}

export function McqFormFromMcq({ mcq }: { mcq: Mcq }) {
	return (
		<McqForm
			mode="edit"
			mcqId={mcq.id}
			initialValues={{
				name: mcq.name,
				question: mcq.question,
				choices: mapMcqToFormChoices(mcq),
			}}
		/>
	);
}
