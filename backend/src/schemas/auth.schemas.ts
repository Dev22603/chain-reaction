import { z } from "zod";
import { AUTH_VALIDATION_ERRORS } from "../constants/app.messages.js";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email(AUTH_VALIDATION_ERRORS.EMAIL_INVALID);

const passwordSchema = z.string().min(8, AUTH_VALIDATION_ERRORS.PASSWORD_MIN);

const displayNameSchema = z
  .string()
  .trim()
  .min(1, AUTH_VALIDATION_ERRORS.DISPLAY_NAME_REQUIRED)
  .max(100, AUTH_VALIDATION_ERRORS.DISPLAY_NAME_MAX);

export const SignupSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema
});

export const LoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
