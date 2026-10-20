// Every enum value list from the M0 admin tech design §2–§3, defined once (code-rules D-1).
// The DB, API and both admin UIs import these instead of re-typing the strings.
import { z } from 'zod';

// PA-01: the facility's state decides which recording, health-privacy and staff-notice law applies.
export const AUSTRALIAN_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;
export const australianStateSchema = z.enum(AUSTRALIAN_STATES);
export type AustralianState = z.infer<typeof australianStateSchema>;

export const ORGANISATION_STATUSES = ['active', 'suspended'] as const;
export const organisationStatusSchema = z.enum(ORGANISATION_STATUSES);
export type OrganisationStatus = z.infer<typeof organisationStatusSchema>;

export const FACILITY_STATUSES = ['configuring', 'live', 'suspended'] as const;
export const facilityStatusSchema = z.enum(FACILITY_STATUSES);
export type FacilityStatus = z.infer<typeof facilityStatusSchema>;

// SA-02: MVP record types are progress notes and ADL charting only.
export const RECORD_TYPES = ['progress_note', 'adl'] as const;
export const recordTypeSchema = z.enum(RECORD_TYPES);
export type RecordType = z.infer<typeof recordTypeSchema>;

export const PLATFORM_ROLES = ['platform_admin'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

// Tech design §2: facility-level roles that may use the facility admin console.
export const FACILITY_ADMIN_ROLES = ['facility_manager', 'don', 'admin_officer'] as const;
export type FacilityAdminRole = (typeof FACILITY_ADMIN_ROLES)[number];

// Roles stored on staff_assignments (one per staff member per facility).
export const FACILITY_ROLES = [...FACILITY_ADMIN_ROLES, 'rn', 'en', 'pcw', 'no_app'] as const;
export const facilityRoleSchema = z.enum(FACILITY_ROLES);
export type FacilityRole = z.infer<typeof facilityRoleSchema>;

// org_admin is a company-level flag on staff, not an assignment role.
export const ORG_ADMIN_ROLE = 'org_admin';
export type OrgAdminRole = typeof ORG_ADMIN_ROLE;

export type Role = PlatformRole | OrgAdminRole | FacilityRole;

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'casual', 'agency'] as const;
export const employmentTypeSchema = z.enum(EMPLOYMENT_TYPES);
export type EmploymentType = z.infer<typeof employmentTypeSchema>;

export const STAFF_LIFECYCLES = [
	'recorded',
	'invited',
	'pending_training',
	'active',
	'deactivated',
] as const;
export const staffLifecycleSchema = z.enum(STAFF_LIFECYCLES);
export type StaffLifecycle = z.infer<typeof staffLifecycleSchema>;

export const CREDENTIAL_KINDS = [
	'ahpra_registration',
	'worker_screening',
	'police_check',
	'carekind_training',
] as const;
export const credentialKindSchema = z.enum(CREDENTIAL_KINDS);
export type CredentialKind = z.infer<typeof credentialKindSchema>;

export const RESIDENT_STATUSES = [
	'pre_admission',
	'in_residence',
	'temporary_leave',
	'transferring',
	'departed',
	'deceased',
	'archived',
] as const;
export const residentStatusSchema = z.enum(RESIDENT_STATUSES);
export type ResidentStatus = z.infer<typeof residentStatusSchema>;

export const RESIDENT_EVENT_TYPES = [
	'admit',
	'temporary_leave',
	'return',
	'transfer_out',
	'transfer_accept',
	'depart',
	'death',
	'archive',
] as const;
export const residentEventTypeSchema = z.enum(RESIDENT_EVENT_TYPES);
export type ResidentEventType = z.infer<typeof residentEventTypeSchema>;

export const CONSENT_STATUSES = ['consented', 'not_consented', 'withdrawn', 'unknown'] as const;
export const consentStatusSchema = z.enum(CONSENT_STATUSES);
export type ConsentStatus = z.infer<typeof consentStatusSchema>;

export const CONSENT_SOURCES = ['self', 'supporter', 'substitute_decision_maker'] as const;
export const consentSourceSchema = z.enum(CONSENT_SOURCES);
export type ConsentSource = z.infer<typeof consentSourceSchema>;

export const ESCALATION_TARGETS = ['on_duty_rn', 'don'] as const;
export const escalationTargetSchema = z.enum(ESCALATION_TARGETS);
export type EscalationTarget = z.infer<typeof escalationTargetSchema>;

export const GOLIVE_ITEM_KEYS = [
	'contract_signed',
	'staff_register_imported',
	'resident_register_imported',
	'consent_recorded',
	'staff_notice_sent',
	'training_completed',
	'record_transfer_agreed',
] as const;
export const goLiveItemKeySchema = z.enum(GOLIVE_ITEM_KEYS);
export type GoLiveItemKey = z.infer<typeof goLiveItemKeySchema>;

export const AUDIT_ACTOR_TYPES = ['platform_admin', 'staff'] as const;
export const auditActorTypeSchema = z.enum(AUDIT_ACTOR_TYPES);
export type AuditActorType = z.infer<typeof auditActorTypeSchema>;

export const AUTH_AUDIENCES = ['platform', 'org'] as const;
export const authAudienceSchema = z.enum(AUTH_AUDIENCES);
export type AuthAudience = z.infer<typeof authAudienceSchema>;
