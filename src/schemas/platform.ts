// SPEC-010 Super Admin contract (tech design §3 organisations / platform_defaults, §4 /platform).
// SA-05: nothing here may carry residents, consents, or staff details beyond org-admin invites.
import { z } from 'zod';
import {
	AT_LEAST_ONE_FIELD_MESSAGE,
	abnSchema,
	emailSchema,
	hasAtLeastOneField,
	idSchema,
	isoDateTimeSchema,
	nameSchema,
	timestampsSchema,
	unavailableMetricSchema,
} from './common.js';
import {
	australianStateSchema,
	facilityStatusSchema,
	organisationStatusSchema,
	recordTypeSchema,
	staffLifecycleSchema,
} from './enums.js';

// SA-02: raw audio is kept at most 7 days (PRD C7); orgs and facilities may only go lower.
export const AUDIO_RETENTION_DAYS_MAX = 7;

// SA-02 / SA-02a: platform defaults and per-organisation limits share one shape.
export const organisationLimitsSchema = z.object({
	enabledRecordTypes: z
		.array(recordTypeSchema)
		.min(1)
		.refine((types) => new Set(types).size === types.length, 'Record types must be unique'),
	// A default copied into facility workflow settings, not a ceiling (SA-02 "默认值").
	pcwRequiresRnReview: z.boolean(),
	audioRetentionDaysMax: z.number().int().min(0).max(AUDIO_RETENTION_DAYS_MAX),
	aiProcessingEnabled: z.boolean(),
	facilityLimit: z.number().int().positive(),
});
export type OrganisationLimits = z.infer<typeof organisationLimitsSchema>;

export const platformDefaultsSchema = organisationLimitsSchema;
export type PlatformDefaults = OrganisationLimits;

export const organisationSchema = z
	.object({
		id: idSchema,
		name: nameSchema,
		abn: abnSchema,
		contactName: nameSchema,
		contactEmail: emailSchema,
		status: organisationStatusSchema,
		limits: organisationLimitsSchema,
	})
	.extend(timestampsSchema.shape);
export type Organisation = z.infer<typeof organisationSchema>;

// Limits are copied from platform defaults on create (tech design §3), so they are not in the body.
export const organisationCreateRequestSchema = z.object({
	name: nameSchema,
	abn: abnSchema,
	contactName: nameSchema,
	contactEmail: emailSchema,
});
export type OrganisationCreateRequest = z.infer<typeof organisationCreateRequestSchema>;

export const organisationUpdateRequestSchema = organisationCreateRequestSchema
	.partial()
	.refine(hasAtLeastOneField, AT_LEAST_ONE_FIELD_MESSAGE);
export type OrganisationUpdateRequest = z.infer<typeof organisationUpdateRequestSchema>;

// SA-01: platform sees facility name, state and status only.
export const facilitySummarySchema = z.object({
	id: idSchema,
	name: nameSchema,
	state: australianStateSchema,
	status: facilityStatusSchema,
});
export type FacilitySummary = z.infer<typeof facilitySummarySchema>;

// SA-03: the only staff detail the platform may see is the org admin it invited.
export const orgAdminSummarySchema = z.object({
	staffId: idSchema,
	givenName: nameSchema,
	familyName: nameSchema,
	email: emailSchema,
	lifecycle: staffLifecycleSchema,
});
export type OrgAdminSummary = z.infer<typeof orgAdminSummarySchema>;

export const adminInviteRequestSchema = z.object({
	givenName: nameSchema,
	familyName: nameSchema,
	email: emailSchema,
});
export type AdminInviteRequest = z.infer<typeof adminInviteRequestSchema>;

// Invites are never emailed (AGENTS hard rule 3): the inviter copies this link; valid 7 days.
export const INVITE_VALID_DAYS = 7;
export const inviteLinkResponseSchema = z.object({
	staffId: idSchema,
	inviteUrl: z.url(),
	expiresAt: isoDateTimeSchema,
});
export type InviteLinkResponse = z.infer<typeof inviteLinkResponseSchema>;

// SA-04: aggregate counts only — no per-person figures or rankings (PRD S-07).
const usageCountsSchema = z.object({
	appEnabledStaffCount: z.number().int().nonnegative(),
	staffLoggedInLast7Days: z.number().int().nonnegative(),
	segmentCount: unavailableMetricSchema,
	signedRecordCount: unavailableMetricSchema,
});

export const facilityUsageSchema = z
	.object({
		facilityId: idSchema,
		facilityName: nameSchema,
	})
	.extend(usageCountsSchema.shape);
export type FacilityUsage = z.infer<typeof facilityUsageSchema>;

export const organisationUsageSchema = z
	.object({
		organisationId: idSchema,
		organisationName: nameSchema,
		facilityCount: z.number().int().nonnegative(),
		facilities: z.array(facilityUsageSchema),
	})
	.extend(usageCountsSchema.shape);
export type OrganisationUsage = z.infer<typeof organisationUsageSchema>;

export const usageResponseSchema = z.array(organisationUsageSchema);
export type UsageResponse = z.infer<typeof usageResponseSchema>;
