"use client";

import { useActionState } from "react";

import { AuthLink, AuthShell } from "@/components/auth/auth-shell";
import { type AuthActionState, signUpAction } from "@/lib/actions/auth-actions";
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

export function SignUpForm() {
	const [state, formAction, pending] = useActionState(signUpAction, initialState);

	return (
		<AuthShell
			title="Create Account"
			description="Sign up to start using Quiz Maker."
			footer={
				<>
					Already have an Account? <AuthLink href="/signin">Sign In</AuthLink>
				</>
			}
		>
			<form action={formAction} className="space-y-4">
				{state.formError ? (
					<div role="alert" className="text-sm text-destructive">
						{state.formError}
					</div>
				) : null}

				<FieldGroup>
					<Field data-invalid={!!state.fieldErrors?.fullName}>
						<FieldLabel htmlFor="fullName">Full Name</FieldLabel>
						<Input
							id="fullName"
							name="fullName"
							type="text"
							autoComplete="name"
							required
							aria-invalid={!!state.fieldErrors?.fullName}
						/>
						<FieldError errors={toFieldErrors(state.fieldErrors?.fullName)} />
					</Field>

					<Field data-invalid={!!state.fieldErrors?.email}>
						<FieldLabel htmlFor="email">Email Address</FieldLabel>
						<Input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
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
							autoComplete="new-password"
							required
							aria-invalid={!!state.fieldErrors?.password}
						/>
						<FieldError errors={toFieldErrors(state.fieldErrors?.password)} />
					</Field>

					<Field data-invalid={!!state.fieldErrors?.confirmPassword}>
						<FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
						<Input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							autoComplete="new-password"
							required
							aria-invalid={!!state.fieldErrors?.confirmPassword}
						/>
						<FieldError errors={toFieldErrors(state.fieldErrors?.confirmPassword)} />
					</Field>
				</FieldGroup>

				<Button type="submit" className="w-full" disabled={pending}>
					{pending ? "Creating account..." : "Sign Up"}
				</Button>
			</form>
		</AuthShell>
	);
}
