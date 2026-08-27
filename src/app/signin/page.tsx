import { SignInForm } from "@/components/auth/sign-in-form";
import { redirectIfAuthenticated } from "@/lib/auth/session";

export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<{ registered?: string; signedOut?: string }>;
}) {
	await redirectIfAuthenticated();

	const params = await searchParams;
	const registered = params.registered === "1";
	const signedOut = params.signedOut === "1";

	return <SignInForm registered={registered} signedOut={signedOut} />;
}
