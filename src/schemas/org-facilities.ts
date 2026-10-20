// SPEC-011 facilities, go-live, workflow settings and overview (tech design §3–§4 /org).
import { z } from 'zod';
import {
	AT_LEAST_ONE_FIELD_MESSAGE,
	hasAtLeastOneField,
	idSchema,
	isoDateSchema,
	isoDateTimeSchema,
	nameSchema,
	timestampsSchema,
	unavailableMetricSchema,
} from './common.js';
import {
	australianStateSchema,
	escalationTargetSchema,
	facilityRoleSchema,
	facilityStatusSchema,
	goLiveItemKeySchema,
	recordTypeSchema,
} from './enums.js';

// Facilities are Australian sites only (data residency, PA-01), so the zone must be Australia/*.
export const facilityTimezoneSchema = z
	.string()
	.regex(/^Australia\/[A-Za-z_]+$/, 'Use an Australia/* IANA time zone');

export const facilitySchema = z
	.object({
		id: idSchema,
		organisationId: idSchema,
		name: nameSchema,
		address: z.string().trim().min(1).max(300),
		state: australianStateSchema,
		beds: z.number().int().positive(),
		timezone: facilityTimezoneSchema,
		status: facilityStatusSchema,
	})
	.extend(timestampsSchema.shape);
export type Facility = z.infer<typeof facilitySchema>;

// Status is not in the body: it only changes through go-live activation.
export const facilityCreateRequestSchema = facilitySchema.pick({
	name: true,
	address: true,
	state: true,
	beds: true,
	timezone: true,
});
export type FacilityCreateRequest = z.infer<typeof facilityCreateRequestSchema>;

export const facilityUpdateRequestSchema = facilityCreateRequestSchema
	.partial()
	.refine(hasAtLeastOneField, AT_LEAST_ONE_FIELD_MESSAGE);
export type FacilityUpdateRequest = z.infer<typeof facilityUpdateRequestSchema>;

export const goLiveItemSchema = z.object({
	key: goLiveItemKeySchema,
	completedAt: isoDateTimeSchema.nullable(),
	completedBy: idSchema.nullable(),
	// Only used by staff_notice_sent: the date written notice reached staff (NSW: ≥ 14 days, PA-05).
	noticeSentOn: isoDateSchema.nullable(),
});
export type GoLiveItem = z.infer<typeof goLiveItemSchema>;

export const goLiveBlockerSchema = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('item_incomplete'), key: goLiveItemKeySchema }),
	z.object({ kind: z.literal('notice_date_missing') }),
	z.object({ kind: z.literal('notice_period_not_met'), earliestActivationDate: isoDateSchema }),
]);
export type GoLiveBlocker = z.infer<typeof goLiveBlockerSchema>;

export const goLiveStatusSchema = z.object({
	facilityId: idSchema,
	state: australianStateSchema,
	status: facilityStatusSchema,
	items: z.array(goLiveItemSchema),
	canActivate: z.boolean(),
	blockers: z.array(goLiveBlockerSchema),
});
export type GoLiveStatus = z.infer<typeof goLiveStatusSchema>;

// The item key is a path parameter; rules/go-live.ts checks noticeSentOn against the key.
export const goLiveItemUpdateRequestSchema = z.object({
	completed: z.boolean(),
	noticeSentOn: isoDateSchema.nullable().optional(),
});
export type GoLiveItemUpdateRequest = z.infer<typeof goLiveItemUpdateRequestSchema>;

// PA-04: per-facility review and escalation workflow; must stay within organisation limits.
export const workflowSettingsBodySchema = z.object({
	pcwRequiresRnReview: z.boolean(),
	reviewRecordTypes: z
		.array(recordTypeSchema)
		.refine((types) => new Set(types).size === types.length, 'Record types must be unique'),
	unreviewedReminderMinutes: z.number().int().positive(),
	escalateTo: escalationTargetSchema,
	incidentNotifyRoles: z.array(facilityRoleSchema.exclude(['no_app'])),
	transferToFacilitySystemDays: z.number().int().positive(),
	transferOwnerStaffId: idSchema.nullable(),
});
export type WorkflowSettingsBody = z.infer<typeof workflowSettingsBodySchema>;

export const workflowSettingsSchema = workflowSettingsBodySchema.extend({ facilityId: idSchema });
export type WorkflowSettings = z.infer<typeof workflowSettingsSchema>;

export const workflowSettingsUpdateRequestSchema = workflowSettingsBodySchema;
export type WorkflowSettingsUpdateRequest = WorkflowSettingsBody;

const countSchema = z.number().int().nonnegative();

// PA-06 / PA-06a: facility-level aggregates only — no per-person or clinical-risk metrics.
export const facilityOverviewSchema = z.object({
	facilityId: idSchema,
	facilityName: nameSchema,
	state: australianStateSchema,
	status: facilityStatusSchema,
	residentsInResidence: countSchema,
	residentsConsented: countSchema,
	// consented / in_residence (rules/consent.ts); null when nobody is in residence.
	consentCoverage: z.number().min(0).max(1).nullable(),
	// Staff assigned here who are not deactivated (staff without the app stay "recorded").
	currentStaffCount: countSchema,
	appEnabledStaffCount: countSchema,
	credentialsDueWithin60Days: countSchema,
	recordTimeliness: unavailableMetricSchema,
	pendingReviewCount: unavailableMetricSchema,
	pendingAttributionRatio: unavailableMetricSchema,
});
export type FacilityOverview = z.infer<typeof facilityOverviewSchema>;

export const orgOverviewResponseSchema = z.array(facilityOverviewSchema);
export type OrgOverviewResponse = z.infer<typeof orgOverviewResponseSchema>;
