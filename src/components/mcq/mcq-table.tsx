"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EllipsisVerticalIcon } from "lucide-react";

import { DeleteMcqDialog } from "@/components/mcq/delete-mcq-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatMcqDate, truncateText } from "@/lib/mcq/form-utils";
import type { McqListItem } from "@/lib/mcq-types";

export function McqTable({
	items,
	currentUserId,
}: {
	items: McqListItem[];
	currentUserId: string;
}) {
	const router = useRouter();
	const [deleteTarget, setDeleteTarget] = useState<McqListItem | null>(null);

	if (items.length === 0) {
		return (
			<div className="rounded-xl border border-dashed p-8 text-center">
				<h2 className="text-lg font-medium">No multiple-choice questions yet</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Create your first MCQ to start building the shared question bank.
				</p>
			</div>
		);
	}

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Question</TableHead>
						<TableHead>Creator</TableHead>
						<TableHead>Created</TableHead>
						<TableHead>Updated</TableHead>
						<TableHead className="w-12">
							<span className="sr-only">Actions</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((item) => {
						const isOwner = item.createdByUserId === currentUserId;

						return (
							<TableRow key={item.id}>
								<TableCell className="font-medium">{item.name}</TableCell>
								<TableCell className="max-w-md whitespace-normal">
									{truncateText(item.question)}
								</TableCell>
								<TableCell>{item.creatorName}</TableCell>
								<TableCell>{formatMcqDate(item.createdAt)}</TableCell>
								<TableCell>{formatMcqDate(item.updatedAt)}</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger
											render={
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label={`Actions for ${item.name}`}
												/>
											}
										>
											<EllipsisVerticalIcon />
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem render={<Link href={`/mcqs/${item.id}/preview`} />}>
												Preview
											</DropdownMenuItem>
											{isOwner ? (
												<DropdownMenuItem render={<Link href={`/mcqs/${item.id}/edit`} />}>
													Edit
												</DropdownMenuItem>
											) : null}
											{isOwner ? (
												<DropdownMenuItem
													variant="destructive"
													onClick={() => setDeleteTarget(item)}
												>
													Delete
												</DropdownMenuItem>
											) : null}
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>

			{deleteTarget ? (
				<DeleteMcqDialog
					mcqId={deleteTarget.id}
					mcqName={deleteTarget.name}
					open={Boolean(deleteTarget)}
					onOpenChange={(open) => {
						if (!open) {
							setDeleteTarget(null);
						}
					}}
					onDeleted={() => {
						setDeleteTarget(null);
						router.refresh();
					}}
				/>
			) : null}
		</>
	);
}
