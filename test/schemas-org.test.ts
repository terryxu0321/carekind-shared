import { describe, expect, it } from 'vitest';
import {
	consentUpdateRequestSchema,
	credentialCreateRequestSchema,
	facilityCreateRequestSchema,
	facilityOverviewSchema,
	residentCreateRequestSchema,
	residentCsvRowSchema,
	residentEventCreateRequestSchema,
	residentSchema,
	staffAssignmentsUpdateRequestSchema,
	staffCreateRequestSchema,
	staffCsvRowSchema,
	staffUpdateRequestSchema,
	workflowSettingsUpdateRequestSchema,
} from '../src/index.js';
import { FACILITY_A, FACILITY_B, NOW, syntheticResident } from './synthetic.js';

const facility = {
	name: 'Synthetic Banksia House',
	address: '1 Example Street, Exampletown NSW 2000',
	state: 'NSW',
	beds: 60,
	timezone: 'Australia/Sydney',
};

describe('facility schemas (PA-01)', () => {
	it('should_accept_a_valid_facility', () => {
		expect(facilityCreateRequestSchema.safeParse(facility).success).toBe(true);
	});

	it.each([0, -5, 12.5])('should_reject_%s_beds', (beds) => {
		expect(facilityCreateRequestSchema.safeParse({ ...facility, beds }).success).toBe(false);
	});

	it('should_reject_non_australian_time_zones', () => {
		expect(
			facilityCreateRequestSchema.safeParse({ ...facility, timezone: 'Pacific/Auckland' })
				.success,
		).toBe(false);
	});
});

describe('overview schema (PA-06)', () => {
	it('should_show_nurse_app_metrics_as_unavailable', () => {
		const overview = {
			facilityId: FACILITY_A,
			facilityName: 'Synthetic Banksia House',
			state: 'NSW',
			status: 'configuring',
			residentsInResidence: 0,
			residentsConsented: 0,
			consentCoverage: null,
			currentStaffCount: 4,
			appEnabledStaffCount: 2,
			credentialsDueWithin60Days: 1,
			recordTimeliness: { value: null, reason: 'nurse_app_not_live' },
			pendingReviewCount: { value: null, reason: 'nurse_app_not_live' },
			pendingAttributionRatio: { value: null, reason: 'nurse_app_not_live' },
		};
		expect(facilityOverviewSchema.safeParse(overview).success).toBe(true);
		expect(
			facilityOverviewSchema.safeParse({ ...overview, consentCoverage: 1.2 }).success,
		).toBe(false);
	});
});

describe('workflow settings (PA-04)', () => {
	const settings = {
		pcwRequiresRnReview: true,
		reviewRecordTypes: ['progress_note'],
		unreviewedReminderMinutes: 60,
		escalateTo: 'don',
		incidentNotifyRoles: ['don', 'facility_manager'],
		transferToFacilitySystemDays: 1,
		transferOwnerStaffId: null,
	};

	it('should_accept_valid_settings', () => {
		expect(workflowSettingsUpdateRequestSchema.safeParse(settings).success).toBe(true);
	});

	it('should_reject_no_app_as_an_incident_recipient_and_zero_minutes', () => {
		const noApp = { ...settings, incidentNotifyRoles: ['no_app'] };
		expect(workflowSettingsUpdateRequestSchema.safeParse(noApp).success).toBe(false);
		const zero = { ...settings, unreviewedReminderMinutes: 0 };
		expect(workflowSettingsUpdateRequestSchema.safeParse(zero).success).toBe(false);
	});
});

describe('staff schemas (PA-02)', () => {
	const staff = {
		givenName: 'Testy',
		familyName: 'Example',
		position: 'Kitchen hand',
		employmentType: 'casual',
		hasAppAccess: false,
		assignments: [{ facilityId: FACILITY_A, role: 'no_app' }],
	};

	it('should_allow_staff_without_app_or_email_and_default_org_admin_false', () => {
		const parsed = staffCreateRequestSchema.parse(staff);
		expect(parsed.isOrgAdmin).toBe(false);
	});

	it('should_require_email_when_app_access_is_on', () => {
		expect(staffCreateRequestSchema.safeParse({ ...staff, hasAppAccess: true }).success).toBe(
			false,
		);
		expect(
			staffCreateRequestSchema.safeParse({
				...staff,
				hasAppAccess: true,
				email: 'testy@example.test',
			}).success,
		).toBe(true);
		expect(
			staffUpdateRequestSchema.safeParse({ hasAppAccess: true, email: null }).success,
		).toBe(false);
	});

	it('should_reject_duplicate_facility_assignments', () => {
		const duplicate = {
			assignments: [
				{ facilityId: FACILITY_A, role: 'rn' },
				{ facilityId: FACILITY_A, role: 'don' },
			],
		};
		expect(staffAssignmentsUpdateRequestSchema.safeParse(duplicate).success).toBe(false);
		const multiSite = {
			assignments: [
				{ facilityId: FACILITY_A, role: 'rn' },
				{ facilityId: FACILITY_B, role: 'don' },
			],
		};
		expect(staffAssignmentsUpdateRequestSchema.safeParse(multiSite).success).toBe(true);
	});

	it('should_parse_csv_rows_with_yes_no_and_blank_email', () => {
		const row = staffCsvRowSchema.parse({
			given_name: 'Testy',
			family_name: 'Example',
			position: 'Cleaner',
			employment_type: 'part_time',
			role: 'no_app',
			has_app_access: 'no',
			email: '',
		});
		expect(row.has_app_access).toBe(false);
		expect(row.email).toBeNull();
	});

	it('should_reject_invalid_credential_dates', () => {
		expect(
			credentialCreateRequestSchema.safeParse({
				kind: 'police_check',
				expiresAt: '2026-02-30',
			}).success,
		).toBe(false);
		expect(
			credentialCreateRequestSchema.safeParse({ kind: 'carekind_training', expiresAt: null })
				.success,
		).toBe(true);
	});
});

describe('resident schemas (PA-03)', () => {
	it('should_parse_a_synthetic_resident_and_reject_unknown_status', () => {
		expect(residentSchema.safeParse(syntheticResident).success).toBe(true);
		expect(
			residentSchema.safeParse({ ...syntheticResident, status: 'discharged' }).success,
		).toBe(false);
	});

	it('should_only_create_residents_before_or_in_residence', () => {
		const base = { givenName: 'Fictional', familyName: 'Resident-Two' };
		expect(residentCreateRequestSchema.parse(base).status).toBe('pre_admission');
		expect(residentCreateRequestSchema.safeParse({ ...base, status: 'departed' }).success).toBe(
			false,
		);
	});

	it('should_require_a_destination_only_for_transfer_out', () => {
		const event = { type: 'transfer_out', occurredAt: NOW };
		expect(residentEventCreateRequestSchema.safeParse(event).success).toBe(false);
		expect(
			residentEventCreateRequestSchema.safeParse({ ...event, toFacilityId: FACILITY_B })
				.success,
		).toBe(true);
		expect(
			residentEventCreateRequestSchema.safeParse({
				type: 'admit',
				occurredAt: NOW,
				toFacilityId: FACILITY_B,
			}).success,
		).toBe(false);
	});

	it('should_default_imported_residents_to_in_residence', () => {
		const row = residentCsvRowSchema.parse({
			given_name: 'Fictional',
			preferred_name: '',
			family_name: 'Resident-Three',
			room: '',
			status: '',
		});
		expect(row).toEqual({
			given_name: 'Fictional',
			preferred_name: null,
			family_name: 'Resident-Three',
			room: null,
			status: 'in_residence',
		});
	});

	it('should_not_let_staff_record_unknown_consent', () => {
		const consent = { status: 'consented', source: 'self', jurisdiction: 'NSW' };
		expect(consentUpdateRequestSchema.safeParse(consent).success).toBe(true);
		expect(
			consentUpdateRequestSchema.safeParse({ ...consent, status: 'unknown' }).success,
		).toBe(false);
		expect(consentUpdateRequestSchema.safeParse({ status: 'withdrawn' }).success).toBe(false);
	});
});
