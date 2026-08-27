import { signOutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
	return (
		<form action={signOutAction}>
			<Button type="submit" variant="outline">
				Sign Out
			</Button>
		</form>
	);
}
