import { SignUpForm } from "@/components/auth/sign-up-form";
import { redirectIfAuthenticated } from "@/lib/auth/session";

export default async function SignUpPage() {
	await redirectIfAuthenticated();

	return <SignUpForm />;
}
