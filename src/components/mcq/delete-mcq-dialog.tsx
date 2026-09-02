"use client";

import { useState } from "react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteMcqRequest } from "@/lib/mcq/api-client";

export function DeleteMcqDialog({
	mcqId,
	mcqName,
	open,
	onOpenChange,
	onDeleted,
}: {
	mcqId: string;
	mcqName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleted: () => void;
}) {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleDelete() {
		if (pending) {
			return;
		}

		setPending(true);
		setError(null);

		const result = await deleteMcqRequest(mcqId);
		if (!result.ok) {
			setError(result.error.message);
			setPending(false);
			return;
		}

		setPending(false);
		onOpenChange(false);
		onDeleted();
	}

	function handleOpenChange(nextOpen: boolean) {
		if (pending) {
			return;
		}

		if (!nextOpen) {
			setError(null);
		}

		onOpenChange(nextOpen);
	}

	return (
		<AlertDialog open={open} onOpenChange={handleOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete MCQ</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete &quot;{mcqName}&quot;? This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{error ? (
					<div role="alert" className="text-sm text-destructive">
						{error}
					</div>
				) : null}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={pending}
						onClick={(event) => {
							event.preventDefault();
							void handleDelete();
						}}
					>
						{pending ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
