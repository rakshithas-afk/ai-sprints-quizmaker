"use client";

import { useActionState, useEffect, useRef } from "react";

import { AuthLink, AuthShell } from "@/components/auth/auth-shell";
import { type AuthActionState, signInAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = {};

function toFieldErrors(messages?: string[]) {
	return messages?.map((message) => ({ message }));
}

function enableInput(event: React.FocusEvent<HTMLInputElement>) {
	event.currentTarget.removeAttribute("readonly");
}

export function SignInForm({
	registered,
	signedOut,
}: {
	registered?: boolean;
	signedOut?: boolean;
}) {
	const [state, formAction, pending] = useActionState(signInAction, initialState);
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (signedOut && formRef.current) {
			formRef.current.reset();
		}
	}, [signedOut]);

	return (
		<AuthShell
			title="Sign In"
			description="Welcome back. Sign in to your Quiz Maker Account."
			footer={
				<>
					Don&apos;t have an account? <AuthLink href="/signup">Sign Up</AuthLink>
				</>
			}
		>
			<form
				ref={formRef}
				key={signedOut ? "signed-out" : "default"}
				action={formAction}
				className="space-y-4"
				autoComplete={signedOut ? "off" : "on"}
			>
				{signedOut ? (
					<div role="status" className="text-sm text-muted-foreground">
						You have been signed out.
					</div>
				) : null}

				{registered ? (
					<div role="status" className="text-sm text-muted-foreground">
						Account created successfully. Please sign in.
					</div>
				) : null}

				{state.formError ? (
					<div role="alert" className="text-sm text-destructive">
						{state.formError}
					</div>
				) : null}

				<FieldGroup>
					<Field data-invalid={!!state.fieldErrors?.email}>
						<FieldLabel htmlFor="email">Email Address</FieldLabel>
						<Input
							id="email"
							name="email"
							type="email"
							defaultValue=""
							autoComplete={signedOut ? "off" : "email"}
							readOnly={signedOut}
							onFocus={signedOut ? enableInput : undefined}
							required
							aria-invalid={!!state.fieldErrors?.email}
						/>
						<FieldError errors={toFieldErrors(state.fieldErrors?.email)} />
					</Field>

					<Field data-invalid={!!state.fieldErrors?.password}>
						<FieldLabel htmlFor="password">Password</FieldLabel>
						<Input
							id="password"
							name="password"
							type="password"
							defaultValue=""
							autoComplete={signedOut ? "new-password" : "current-password"}
							readOnly={signedOut}
							onFocus={signedOut ? enableInput : undefined}
							required
							aria-invalid={!!state.fieldErrors?.password}
						/>
						<FieldError errors={toFieldErrors(state.fieldErrors?.password)} />
					</Field>
				</FieldGroup>

				<Button type="submit" className="w-full" disabled={pending}>
					{pending ? "Signing in..." : "Sign In"}
				</Button>
			</form>
		</AuthShell>
	);
}
