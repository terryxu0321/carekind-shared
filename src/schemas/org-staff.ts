// SPEC-011 PA-02 / PA-02a / PA-02b: staff register, assignments and credentials.
import { z } from 'zod';
import { staffAssignmentSchema } from './auth.js';
import {
	AT_LEAST_ONE_FIELD_MESSAGE,
	emailSchema,
	hasAtLeastOneField,
	idSchema,
	isoDateSchema,
	isoDateTimeSchema,
	nameSchema,
	optionalTextSchema,
	timestampsSchema,
} from './common.js';
import {
	credentialKindSchema,
	employmentTypeSchema,
	facilityRoleSchema,
	staffLifecycleSchema,
} from './enums.js';

export const staffSchema = z
	.object({
		id: idSchema,
		organisationId: idSchema,
		givenName: nameSchema,
		familyName: nameSchema,
		position: nameSchema,
		employmentType: employmentTypeSchema,
		isOrgAdmin: z.boolean(),
		hasAppAccess: z.boolean(),
		email: emailSchema.nullable(),
		lifecycle: staffLifecycleSchema,
		trainingCompletedAt: isoDateTimeSchema.nullable(),
		assignments: z.array(staffAssignmentSchema),
	})
	.extend(timestampsSchema.shape);
export type Staff = z.infer<typeof staffSchema>;

// (staff_id, facility_id) is unique (tech design §3).
export const assignmentsSchema = z
	.array(staffAssignmentSchema)
	.refine(
		(assignments) =>
			new Set(assignments.map((item) => item.facilityId)).size === assignments.length,
		'Each facility can appear only once',
	);

export const staffAssignmentsUpdateRequestSchema = z.object({ assignments: assignmentsSchema });
export type StaffAssignmentsUpdateRequest = z.infer<typeof staffAssignmentsUpdateRequestSchema>;

const EMAIL_REQUIRED_MESSAGE = 'Email is required when the staff member has app access';

export const staffCreateRequestSchema = z
	.object({
		givenName: nameSchema,
		familyName: nameSchema,
		position: nameSchema,
		employmentType: employmentTypeSchema,
		isOrgAdmin: z.boolean().default(false),
		hasAppAccess: z.boolean(),
		email: emailSchema.nullable().optional(),
		assignments: assignmentsSchema,
	})
	// Tech design §3: email is mandatory once the person gets an app account.
	.refine((staff) => !staff.hasAppAccess || Boolean(staff.email), {
		message: EMAIL_REQUIRED_MESSAGE,
		path: ['email'],
	});
export type StaffCreateRequest = z.input<typeof staffCreateRequestSchema>;

// Lifecycle and assignments change only through their own endpoints.
export const staffUpdateRequestSchema = z
	.object({
		givenName: nameSchema,
		familyName: nameSchema,
		position: nameSchema,
		employmentType: employmentTypeSchema,
		isOrgAdmin: z.boolean(),
		hasAppAccess: z.boolean(),
		email: emailSchema.nullable(),
	})
	.partial()
	.refine(hasAtLeastOneField, AT_LEAST_ONE_FIELD_MESSAGE)
	.refine((staff) => !(staff.hasAppAccess === true && staff.email === null), {
		message: EMAIL_REQUIRED_MESSAGE,
		path: ['email'],
	});
export type StaffUpdateRequest = z.infer<typeof staffUpdateRequestSchema>;

export const staffListQuerySchema = z.object({ facilityId: idSchema.optional() });
export type StaffListQuery = z.infer<typeof staffListQuerySchema>;

export const CREDENTIAL_REMINDERS = ['none', 'due_60', 'due_30', 'expired'] as const;
export const credentialReminderSchema = z.enum(CREDENTIAL_REMINDERS);
export type CredentialReminder = z.infer<typeof credentialReminderSchema>;

export const credentialSchema = z
	.object({
		id: idSchema,
		staffId: idSchema,
		kind: credentialKindSchema,
		reference: optionalTextSchema,
		expiresAt: isoDateSchema.nullable(),
		// Computed at read time from expiresAt (rules/credentials.ts); reminder only, never deactivates.
		reminder: credentialReminderSchema,
	})
	.extend(timestampsSchema.shape);
export type Credential = z.infer<typeof credentialSchema>;

export const credentialCreateRequestSchema = z.object({
	kind: credentialKindSchema,
	reference: optionalTextSchema.optional(),
	expiresAt: isoDateSchema.nullable().optional(),
});
export type CredentialCreateRequest = z.infer<typeof credentialCreateRequestSchema>;

export const credentialUpdateRequestSchema = z
	.object({
		reference: optionalTextSchema,
		expiresAt: isoDateSchema.nullable(),
	})
	.partial()
	.refine(hasAtLeastOneField, AT_LEAST_ONE_FIELD_MESSAGE);
export type CredentialUpdateRequest = z.infer<typeof credentialUpdateRequestSchema>;

// CSV import: one header row with these columns; each row is assigned to the facility in the query.
export const STAFF_CSV_COLUMNS = [
	'given_name',
	'family_name',
	'position',
	'employment_type',
	'role',
	'has_app_access',
	'email',
] as const;

const csvBooleanSchema = z
	.enum(['yes', 'no', 'true', 'false'])
	.transform((value) => value === 'yes' || value === 'true');

export const staffCsvRowSchema = z
	.object({
		given_name: nameSchema,
		family_name: nameSchema,
		position: nameSchema,
		employment_type: employmentTypeSchema,
		role: facilityRoleSchema,
		has_app_access: csvBooleanSchema,
		email: z
			.string()
			.trim()
			.transform((value) => (value === '' ? null : value))
			.pipe(emailSchema.nullable()),
	})
	.refine((row) => !row.has_app_access || row.email !== null, {
		message: EMAIL_REQUIRED_MESSAGE,
		path: ['email'],
	});
export type StaffCsvRow = z.infer<typeof staffCsvRowSchema>;

export const staffImportQuerySchema = z.object({ facilityId: idSchema });
export type StaffImportQuery = z.infer<typeof staffImportQuerySchema>;

// Shared by staff and resident imports. Messages name the column, never echo row content.
export const csvImportResultSchema = z.object({
	importedCount: z.number().int().nonnegative(),
	rejectedRows: z.array(
		z.object({
			rowNumber: z.number().int().positive(),
			column: z.string().nullable(),
			message: z.string().min(1).max(200),
		}),
	),
});
export type CsvImportResult = z.infer<typeof csvImportResultSchema>;
