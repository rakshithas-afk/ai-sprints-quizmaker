import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({
	title,
	description,
	children,
	footer,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
	footer: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-xl">{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">{children}</CardContent>
				<div className="px-4 pb-4 text-center text-sm text-muted-foreground">{footer}</div>
			</Card>
		</div>
	);
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<Link href={href} className="font-medium text-primary underline-offset-4 hover:underline">
			{children}
		</Link>
	);
}
