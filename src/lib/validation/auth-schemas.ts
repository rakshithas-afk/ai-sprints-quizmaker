import { z } from "zod";

const passwordSchema = z
	.string()
	.min(1, "Password is required.")
	.min(8, "Password must be at least 8 characters.")
	.regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
	.regex(/[a-z]/, "Password must contain at least one lowercase letter.")
	.regex(/[0-9]/, "Password must contain at least one number.")
	.regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

export const signUpSchema = z
	.object({
		fullName: z
			.string()
			.min(1, "Full name is required.")
			.max(100, "Full name must be at most 100 characters.")
			.transform((value) => value.trim())
			.refine((value) => value.length > 0, "Full name is required."),
		email: z
			.string()
			.min(1, "Email address is required.")
			.max(255, "Email address must be at most 255 characters.")
			.email("Please enter a valid email address.")
			.transform((value) => value.trim().toLowerCase()),
		password: passwordSchema,
		confirmPassword: z.string().min(1, "Please confirm your password."),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match.",
		path: ["confirmPassword"],
	});

export const signInSchema = z.object({
	email: z
		.string()
		.min(1, "Email address is required.")
		.email("Please enter a valid email address.")
		.transform((value) => value.trim().toLowerCase()),
	password: z.string().min(1, "Password is required.").max(128, "Password is too long."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
	const fieldErrors: Record<string, string[]> = {};
	for (const issue of error.issues) {
		const field = issue.path[0];
		if (typeof field === "string") {
			fieldErrors[field] ??= [];
			fieldErrors[field].push(issue.message);
		}
	}
	return fieldErrors;
}
