// Tech design §4 auth: invite + password login, JWT bearer, two audiences (platform | org).
import { z } from 'zod';
import {
	emailSchema,
	idSchema,
	isoDateTimeSchema,
	nameSchema,
	newPasswordSchema,
} from './common.js';
import { authAudienceSchema, facilityRoleSchema } from './enums.js';

export const loginRequestSchema = z.object({
	audience: authAudienceSchema,
	email: emailSchema,
	// Existing passwords are checked by the server, not re-validated against the current policy.
	password: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const acceptInviteRequestSchema = z.object({
	token: z.string().min(1).max(512),
	newPassword: newPasswordSchema,
});
export type AcceptInviteRequest = z.infer<typeof acceptInviteRequestSchema>;

export const staffAssignmentSchema = z.object({
	facilityId: idSchema,
	role: facilityRoleSchema,
});
export type StaffAssignment = z.infer<typeof staffAssignmentSchema>;

export const platformMeSchema = z.object({
	audience: z.literal('platform'),
	id: idSchema,
	name: nameSchema,
	email: emailSchema,
});
export type PlatformMe = z.infer<typeof platformMeSchema>;

export const orgMeSchema = z.object({
	audience: z.literal('org'),
	staffId: idSchema,
	organisationId: idSchema,
	organisationName: nameSchema,
	givenName: nameSchema,
	familyName: nameSchema,
	email: emailSchema,
	isOrgAdmin: z.boolean(),
	assignments: z.array(staffAssignmentSchema),
});
export type OrgMe = z.infer<typeof orgMeSchema>;

export const meResponseSchema = z.discriminatedUnion('audience', [platformMeSchema, orgMeSchema]);
export type MeResponse = z.infer<typeof meResponseSchema>;

// accept-invite returns the same session as login so the new user lands signed in.
export const loginResponseSchema = z.object({
	accessToken: z.string().min(1),
	expiresAt: isoDateTimeSchema,
	me: meResponseSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;
