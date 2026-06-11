import * as z from "zod/v4";
import { LIMITS, REGEX } from "../constants/app.constants";
import { AUTH_VALIDATION_ERRORS } from "../constants/app.messages";
import { ApiError } from "../utils/api_error";

// Reusable validators
const emailField = z.string().trim().toLowerCase().email(AUTH_VALIDATION_ERRORS.EMAIL_INVALID);

const passwordField = z
	.string()
	.min(LIMITS.PASSWORD_MIN, AUTH_VALIDATION_ERRORS.PASSWORD_MIN)
	.max(LIMITS.PASSWORD_MAX, AUTH_VALIDATION_ERRORS.PASSWORD_MAX);

const displayNameField = z
	.string()
	.trim()
	.min(1, AUTH_VALIDATION_ERRORS.DISPLAY_NAME_REQUIRED)
	.max(LIMITS.DISPLAY_NAME_MAX, AUTH_VALIDATION_ERRORS.DISPLAY_NAME_MAX)
	.refine((value) => !REGEX.DIGITS.test(value), AUTH_VALIDATION_ERRORS.DISPLAY_NAME_NO_DIGITS)
	.refine((value) => REGEX.DISPLAY_NAME.test(value), AUTH_VALIDATION_ERRORS.DISPLAY_NAME_INVALID_CHARS);

// Schemas
const signupSchema = z.object({
	displayName: displayNameField,
	email: emailField,
	password: passwordField,
});

const loginSchema = z.object({
	email: emailField,
	password: passwordField,
});

const updateProfileSchema = z.object({
	displayName: displayNameField,
});

const googleLoginSchema = z.object({
	accessToken: z.string().min(1, AUTH_VALIDATION_ERRORS.ACCESS_TOKEN_REQUIRED),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

// Validator functions (called in services)
export function validateSignup(data: unknown): SignupInput {
	const result = signupSchema.safeParse(data);
	if (!result.success) {
		throw new ApiError(
			400,
			"Signup validation failed",
			result.error.issues.map((issue) => issue.message),
		);
	}
	return result.data;
}

export function validateLogin(data: unknown): LoginInput {
	const result = loginSchema.safeParse(data);
	if (!result.success) {
		throw new ApiError(
			400,
			"Login validation failed",
			result.error.issues.map((issue) => issue.message),
		);
	}
	return result.data;
}

export function validateUpdateProfile(data: unknown): UpdateProfileInput {
	const result = updateProfileSchema.safeParse(data);
	if (!result.success) {
		throw new ApiError(
			400,
			"Profile update validation failed",
			result.error.issues.map((issue) => issue.message),
		);
	}
	return result.data;
}

export function validateGoogleLogin(data: unknown): GoogleLoginInput {
	const result = googleLoginSchema.safeParse(data);
	if (!result.success) {
		throw new ApiError(
			400,
			"Google login validation failed",
			result.error.issues.map((issue) => issue.message),
		);
	}
	return result.data;
}
