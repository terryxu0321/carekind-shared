// SPEC-011 PA-03 resident register and lifecycle; SPEC-009 consent.
// No date of birth or photo (tech design §3, YAGNI for M0).
import { z } from 'zod';
import {
	AT_LEAST_ONE_FIELD_MESSAGE,
	hasAtLeastOneField,
	idSchema,
	isoDateTimeSchema,
	nameSchema,
	timestampsSchema,
} from './common.js';
import {
	australianStateSchema,
	consentSourceSchema,
	consentStatusSchema,
	residentEventTypeSchema,
	residentStatusSchema,
} from './enums.js';

const roomSchema = z.string().trim().min(1).max(20).nullable();

export const residentSchema = z
	.object({
		id: idSchema,
		organisationId: idSchema,
		facilityId: idSchema,
		givenName: nameSchema,
		preferredName: nameSchema.nullable(),
		familyName: nameSchema,
		room: roomSchema,
		status: residentStatusSchema,
	})
	.extend(timestampsSchema.shape);
export type Resident = z.infer<typeof residentSchema>;

// New residents start before admission, or already in residence when loading an existing register.
export const INITIAL_RESIDENT_STATUSES = ['pre_admission', 'in_residence'] as const;
export const initialResidentStatusSchema = z.enum(INITIAL_RESIDENT_STATUSES);

export const residentCreateRequestSchema = z.object({
	givenName: nameSchema,
	preferredName: nameSchema.nullable().optional(),
	familyName: nameSchema,
	room: roomSchema.optional(),
	status: initialResidentStatusSchema.default('pre_admission'),
});
export type ResidentCreateRequest = z.input<typeof residentCreateRequestSchema>;

// Status changes only through lifecycle events (rules/resident-lifecycle.ts).
export const residentUpdateRequestSchema = z
	.object({
		givenName: nameSchema,
		preferredName: nameSchema.nullable(),
		familyName: nameSchema,
		room: roomSchema,
	})
	.partial()
	.refine(hasAtLeastOneField, AT_LEAST_ONE_FIELD_MESSAGE);
export type ResidentUpdateRequest = z.infer<typeof residentUpdateRequestSchema>;

export const residentEventSchema = z.object({
	id: idSchema,
	residentId: idSchema,
	type: residentEventTypeSchema,
	fromFacilityId: idSchema.nullable(),
	toFacilityId: idSchema.nullable(),
	occurredAt: isoDateTimeSchema,
	recordedBy: idSchema,
});
export type ResidentEvent = z.infer<typeof residentEventSchema>;

// GET /org/residents/:id also returns lifecycle history for the detail page (tech design §5).
export const residentDetailSchema = residentSchema.extend({
	events: z.array(residentEventSchema),
});
export type ResidentDetail = z.infer<typeof residentDetailSchema>;

// Only transfer_out names a destination; transfer_accept is recorded by the receiving facility.
export const residentEventCreateRequestSchema = z
	.object({
		type: residentEventTypeSchema,
		occurredAt: isoDateTimeSchema,
		toFacilityId: idSchema.optional(),
	})
	.refine((event) => (event.type === 'transfer_out') === (event.toFacilityId !== undefined), {
		message: 'toFacilityId is required for transfer_out and not allowed otherwise',
		path: ['toFacilityId'],
	});
export type ResidentEventCreateRequest = z.infer<typeof residentEventCreateRequestSchema>;

export const residentEventResultSchema = z.object({
	resident: residentSchema,
	event: residentEventSchema,
	// True after transfer_accept: consent went back to unknown (tech design §3).
	consentReset: z.boolean(),
	// SPEC-011 §3.1: cross-state transfer → UI asks staff to re-confirm under the new state's rules.
	crossStateTransfer: z.boolean(),
});
export type ResidentEventResult = z.infer<typeof residentEventResultSchema>;

// No record means unknown, treated as not consented (SPEC-009, PA-03a).
export const consentSchema = z.object({
	residentId: idSchema,
	status: consentStatusSchema,
	source: consentSourceSchema.nullable(),
	jurisdiction: australianStateSchema.nullable(),
	basisNote: z.string().trim().max(500).nullable(),
	recordedBy: idSchema.nullable(),
	recordedAt: isoDateTimeSchema.nullable(),
});
export type Consent = z.infer<typeof consentSchema>;

// Staff record a decision; "unknown" is only the absence of one (or a reset after transfer).
export const consentUpdateRequestSchema = z.object({
	status: consentStatusSchema.exclude(['unknown']),
	source: consentSourceSchema,
	jurisdiction: australianStateSchema,
	basisNote: z.string().trim().max(500).nullable().optional(),
});
export type ConsentUpdateRequest = z.infer<typeof consentUpdateRequestSchema>;

export const RESIDENT_CSV_COLUMNS = [
	'given_name',
	'preferred_name',
	'family_name',
	'room',
	'status',
] as const;

const blankToNull = z
	.string()
	.trim()
	.transform((value) => (value === '' ? null : value));

export const residentCsvRowSchema = z.object({
	given_name: nameSchema,
	preferred_name: blankToNull.pipe(nameSchema.nullable()),
	family_name: nameSchema,
	room: blankToNull.pipe(roomSchema),
	status: blankToNull.pipe(initialResidentStatusSchema.nullable()).transform(
		// An imported register lists people already living there.
		(status) => status ?? 'in_residence',
	),
});
export type ResidentCsvRow = z.infer<typeof residentCsvRowSchema>;
