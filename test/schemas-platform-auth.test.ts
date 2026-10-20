import { describe, expect, it } from 'vitest';
import {
	PASSWORD_MIN_LENGTH,
	acceptInviteRequestSchema,
	errorResponseSchema,
	facilitySummarySchema,
	loginRequestSchema,
	meResponseSchema,
	organisationCreateRequestSchema,
	organisationLimitsSchema,
	organisationSchema,
	organisationUpdateRequestSchema,
	organisationUsageSchema,
} from '../src/index.js';
import { FACILITY_A, ORG_ID, STAFF_ID, syntheticOrganisation } from './synthetic.js';

const syntheticPassphrase = 'x'.repeat(PASSWORD_MIN_LENGTH);

describe('auth schemas', () => {
	it('should_accept_both_audiences_and_reject_others', () => {
		const login = {
			audience: 'org',
			email: 'nurse@example.test',
			password: syntheticPassphrase,
		};
		expect(loginRequestSchema.safeParse(login).success).toBe(true);
		expect(loginRequestSchema.safeParse({ ...login, audience: 'nurse' }).success).toBe(false);
		expect(loginRequestSchema.safeParse({ ...login, email: 'not-an-email' }).success).toBe(
			false,
		);
	});

	it('should_require_a_long_passphrase_on_accept_invite', () => {
		const short = {
			token: 'tok-1',
			newPassword: 'x'.repeat(PASSWORD_MIN_LENGTH - 1),
		};
		expect(acceptInviteRequestSchema.safeParse(short).success).toBe(false);
		expect(
			acceptInviteRequestSchema.safeParse({ ...short, newPassword: syntheticPassphrase })
				.success,
		).toBe(true);
	});

	it('should_discriminate_me_by_audience', () => {
		const me = meResponseSchema.parse({
			audience: 'org',
			staffId: STAFF_ID,
			organisationId: ORG_ID,
			organisationName: 'Synthetic Gum Tree Care Group',
			givenName: 'Testy',
			familyName: 'Example',
			email: 'testy@example.test',
			isOrgAdmin: false,
			assignments: [{ facilityId: FACILITY_A, role: 'don' }],
		});
		expect(me.audience).toBe('org');
		expect(meResponseSchema.safeParse({ audience: 'org', id: STAFF_ID }).success).toBe(false);
	});
});

describe('organisation schemas (SPEC-010)', () => {
	it('should_parse_a_synthetic_organisation', () => {
		expect(organisationSchema.parse(syntheticOrganisation).limits.facilityLimit).toBe(3);
	});

	it('should_normalise_abn_spaces_and_reject_wrong_length', () => {
		const body = {
			name: 'Synthetic Wattle Homes',
			abn: '00 000 000 000',
			contactName: 'Testy Example',
			contactEmail: 'owner@example.test',
		};
		expect(organisationCreateRequestSchema.parse(body).abn).toBe('00000000000');
		expect(organisationCreateRequestSchema.safeParse({ ...body, abn: '1234' }).success).toBe(
			false,
		);
	});

	it('should_reject_blank_names', () => {
		const result = organisationUpdateRequestSchema.safeParse({ name: '   ' });
		expect(result.success).toBe(false);
	});

	it('should_reject_an_empty_patch', () => {
		expect(organisationUpdateRequestSchema.safeParse({}).success).toBe(false);
	});

	it('should_cap_audio_retention_at_7_days (SA-02)', () => {
		const limits = syntheticOrganisation.limits;
		expect(
			organisationLimitsSchema.safeParse({ ...limits, audioRetentionDaysMax: 8 }).success,
		).toBe(false);
		expect(
			organisationLimitsSchema.safeParse({ ...limits, audioRetentionDaysMax: 7 }).success,
		).toBe(true);
		expect(
			organisationLimitsSchema.safeParse({ ...limits, audioRetentionDaysMax: 2.5 }).success,
		).toBe(false);
	});

	it('should_reject_duplicate_or_unknown_record_types_and_zero_facility_limit', () => {
		const limits = syntheticOrganisation.limits;
		const bad = [
			{ ...limits, enabledRecordTypes: ['adl', 'adl'] },
			{ ...limits, enabledRecordTypes: ['incident_report'] },
			{ ...limits, enabledRecordTypes: [] },
			{ ...limits, facilityLimit: 0 },
		];
		for (const candidate of bad) {
			expect(organisationLimitsSchema.safeParse(candidate).success).toBe(false);
		}
	});

	it('should_only_accept_the_eight_australian_states', () => {
		const summary = { id: FACILITY_A, name: 'Synthetic House', state: 'NSW', status: 'live' };
		expect(facilitySummarySchema.safeParse(summary).success).toBe(true);
		expect(facilitySummarySchema.safeParse({ ...summary, state: 'NZ' }).success).toBe(false);
	});

	it('should_strip_fields_the_platform_must_not_see (SA-05)', () => {
		const leaked = {
			id: FACILITY_A,
			name: 'Synthetic House',
			state: 'VIC',
			status: 'live',
			residents: [],
		};
		expect(facilitySummarySchema.parse(leaked)).not.toHaveProperty('residents');
	});

	it('should_require_unavailable_metrics_to_be_null_with_a_reason', () => {
		const usage = {
			organisationId: ORG_ID,
			organisationName: 'Synthetic Gum Tree Care Group',
			facilityCount: 0,
			facilities: [],
			appEnabledStaffCount: 0,
			staffLoggedInLast7Days: 0,
			segmentCount: { value: null, reason: 'nurse_app_not_live' },
			signedRecordCount: { value: null, reason: 'nurse_app_not_live' },
		};
		expect(organisationUsageSchema.safeParse(usage).success).toBe(true);
		const invented = { ...usage, segmentCount: { value: 12, reason: 'nurse_app_not_live' } };
		expect(organisationUsageSchema.safeParse(invented).success).toBe(false);
	});
});

describe('errorResponseSchema', () => {
	it('should_accept_known_codes_only', () => {
		expect(
			errorResponseSchema.safeParse({ error: { code: 'forbidden', message: 'Not allowed' } })
				.success,
		).toBe(true);
		expect(
			errorResponseSchema.safeParse({ error: { code: 'teapot', message: 'Short and stout' } })
				.success,
		).toBe(false);
	});
});
