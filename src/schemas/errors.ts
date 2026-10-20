// Tech design §4: every error is { error: { code, message } }; message never contains health information.
import { z } from 'zod';

export const API_ERROR_CODES = [
	'validation_failed',
	'unauthenticated',
	'forbidden',
	'not_found',
	'conflict',
	'invalid_transition',
	'go_live_incomplete',
	'limit_exceeded',
	'organisation_suspended',
	'invite_invalid',
	'internal_error',
] as const;
export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const errorResponseSchema = z.object({
	error: z.object({
		code: apiErrorCodeSchema,
		message: z.string().min(1).max(500),
	}),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
