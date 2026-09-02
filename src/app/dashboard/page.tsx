import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";

export default async function DashboardPage() {
	const session = await requireAuth();

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-lg">
				<CardHeader className="flex flex-row items-start justify-between gap-4">
					<div className="space-y-1">
						<CardTitle className="text-xl">Quiz Maker Dashboard</CardTitle>
						<CardDescription>Welcome, {session.name}!</CardDescription>
					</div>
					<SignOutButton />
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Manage multiple-choice questions in the shared test bank, preview questions, and track
						your quiz content from one place.
					</p>
					<Button nativeButton={false} render={<Link href="/mcqs" />}>
						Manage MCQs
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
