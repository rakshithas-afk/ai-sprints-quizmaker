import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireAuth } from "@/lib/auth/session";

export default async function McqsLayout({ children }: { children: React.ReactNode }) {
	await requireAuth();

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
					<div className="space-y-1">
						<p className="font-heading text-lg font-semibold">Quiz Maker</p>
						<nav aria-label="Primary" className="flex flex-wrap items-center gap-4 text-sm">
							<Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
								Dashboard
							</Link>
							<Link href="/mcqs" className="font-medium text-foreground">
								MCQs
							</Link>
						</nav>
					</div>
					<SignOutButton />
				</div>
			</header>
			<main className="mx-auto max-w-6xl p-4">{children}</main>
		</div>
	);
}
