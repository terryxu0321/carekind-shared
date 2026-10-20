import { describe, expect, it } from 'vitest';
import {
	CONSENT_STATUSES,
	consentCoverage,
	isFacilityLimitReached,
	isRecordingConsented,
	workflowWithinLimits,
} from '../src/index.js';

describe('workflowWithinLimits (SA-02 / PA-04)', () => {
	it('should_accept_record_types_the_organisation_enabled', () => {
		expect(
			workflowWithinLimits(
				{ reviewRecordTypes: ['progress_note'] },
				{ enabledRecordTypes: ['progress_note', 'adl'] },
			),
		).toEqual([]);
		expect(
			workflowWithinLimits({ reviewRecordTypes: [] }, { enabledRecordTypes: ['adl'] }),
		).toEqual([]);
	});

	it('should_reject_record_types_outside_the_limit', () => {
		const violations = workflowWithinLimits(
			{ reviewRecordTypes: ['progress_note', 'adl'] },
			{ enabledRecordTypes: ['progress_note'] },
		);
		expect(violations).toHaveLength(1);
		expect(violations[0]?.field).toBe('reviewRecordTypes');
		expect(violations[0]?.message).toContain('adl');
	});
});

describe('isFacilityLimitReached', () => {
	it('should_block_at_and_above_the_limit', () => {
		expect(isFacilityLimitReached(2, 3)).toBe(false);
		expect(isFacilityLimitReached(3, 3)).toBe(true);
		expect(isFacilityLimitReached(4, 3)).toBe(true);
	});
});

describe('consent rules (SPEC-009 / PA-03a)', () => {
	it('should_treat_everything_except_consented_as_not_consented', () => {
		expect(CONSENT_STATUSES.filter(isRecordingConsented)).toEqual(['consented']);
		expect(isRecordingConsented(null)).toBe(false);
	});

	it('should_compute_coverage_and_return_null_with_no_residents', () => {
		expect(consentCoverage(3, 4)).toBe(0.75);
		expect(consentCoverage(0, 0)).toBeNull();
	});
});
