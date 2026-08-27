import { SignOutButton } from "@/components/auth/sign-out-button";
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
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Multiple-choice question and shared test-bank functionality will be implemented in a
						future sprint.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
