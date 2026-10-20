// Field-level building blocks reused by every entity schema.
import { z } from 'zod';

export const idSchema = z.uuid();
export type Id = z.infer<typeof idSchema>;

export const emailSchema = z.email().max(254);

// Names are trimmed so "  " cannot pass as a name.
export const nameSchema = z.string().trim().min(1).max(100);

export const optionalTextSchema = z.string().trim().min(1).max(200).nullable();

// Calendar dates (credential expiry, notice sent on) are plain YYYY-MM-DD, no time zone.
export const isoDateSchema = z.iso.date();
export type IsoDate = z.infer<typeof isoDateSchema>;

export const isoDateTimeSchema = z.iso.datetime({ offset: true });
export type IsoDateTime = z.infer<typeof isoDateTimeSchema>;

// ABN is 11 digits; people often type it with spaces ("12 345 678 901").
export const abnSchema = z
	.string()
	.transform((value) => value.replace(/\s+/g, ''))
	.pipe(z.string().regex(/^\d{11}$/, 'ABN must be 11 digits'));

// No MFA in M0 (tech design §1), so a long passphrase is the only factor.
export const PASSWORD_MIN_LENGTH = 14;
export const PASSWORD_MAX_LENGTH = 128;
export const newPasswordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH);

export const timestampsSchema = z.object({
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

// PA-06 / SA-04: metrics that need the nurse app are shown as "no data yet", never invented (CORE-09).
export const UNAVAILABLE_REASONS = ['nurse_app_not_live'] as const;
export const unavailableMetricSchema = z.object({
	value: z.null(),
	reason: z.enum(UNAVAILABLE_REASONS),
});
export type UnavailableMetric = z.infer<typeof unavailableMetricSchema>;

export const NURSE_APP_NOT_LIVE: UnavailableMetric = { value: null, reason: 'nurse_app_not_live' };

// A PATCH body must change at least one field.
export function hasAtLeastOneField(value: Record<string, unknown>): boolean {
	return Object.values(value).some((field) => field !== undefined);
}

export const AT_LEAST_ONE_FIELD_MESSAGE = 'Provide at least one field to change';
