import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
	const session = await getSession();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8">
			<div className="max-w-lg space-y-3 text-center">
				<h1 className="font-heading text-3xl font-semibold tracking-tight">Quiz Maker</h1>
				<p className="text-muted-foreground">
					Create quizzes, manage assessments, and track results. Authentication is live — quiz
					features are coming in future sprints.
				</p>
			</div>

			<div className="flex flex-wrap items-center justify-center gap-3">
				{session ? (
					<Button nativeButton={false} render={<Link href="/dashboard" />}>
						Go to Dashboard
					</Button>
				) : (
					<>
						<Button nativeButton={false} render={<Link href="/signin" />}>
							Sign In
						</Button>
						<Button nativeButton={false} variant="outline" render={<Link href="/signup" />}>
							Sign Up
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
