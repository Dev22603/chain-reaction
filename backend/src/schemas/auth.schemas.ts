import { z } from "zod";
import { AUTH_VALIDATION_ERRORS } from "../constants/app.messages.js";

const emailSchema = z.string().trim().toLowerCase().email(AUTH_VALIDATION_ERRORS.EMAIL_INVALID);

const passwordSchema = z.string().min(8, AUTH_VALIDATION_ERRORS.PASSWORD_MIN).max(200, AUTH_VALIDATION_ERRORS.PASSWORD_MAX);

const displayNameSchema = z
	.string()
	.trim()
	.min(1, AUTH_VALIDATION_ERRORS.DISPLAY_NAME_REQUIRED)
	.max(30, AUTH_VALIDATION_ERRORS.DISPLAY_NAME_MAX)
	.refine((value) => !/\d/.test(value), AUTH_VALIDATION_ERRORS.DISPLAY_NAME_NO_DIGITS)
	.refine((value) => /^[A-Za-z][A-Za-z _-]*$/.test(value), AUTH_VALIDATION_ERRORS.DISPLAY_NAME_INVALID_CHARS);

export const SignupSchema = z.object({
	displayName: displayNameSchema,
	email: emailSchema,
	password: passwordSchema,
});

export const LoginSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
});

export const UpdateProfileSchema = z.object({
	displayName: displayNameSchema,
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
