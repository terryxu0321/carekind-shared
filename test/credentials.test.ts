import { describe, expect, it } from 'vitest';
import {
	addDays,
	credentialReminder,
	daysBetween,
	isCredentialDueWithin60Days,
} from '../src/index.js';

const TODAY = '2026-10-20';

describe('credentialReminder (SPEC-011 PA-02a)', () => {
	it('should_return_none_when_there_is_no_expiry', () => {
		expect(credentialReminder(null, TODAY)).toBe('none');
	});

	it.each([
		[61, 'none'],
		[60, 'due_60'],
		[31, 'due_60'],
		[30, 'due_30'],
		[1, 'due_30'],
		[0, 'due_30'],
		[-1, 'expired'],
	] as const)('should_return_reminder_for_%i_days_left', (daysLeft, expected) => {
		expect(credentialReminder(addDays(TODAY, daysLeft), TODAY)).toBe(expected);
	});

	it('should_count_across_a_daylight_saving_change', () => {
		// NSW daylight saving starts on the first Sunday of October; dates must stay whole days.
		expect(daysBetween('2026-09-30', '2026-10-30')).toBe(30);
		expect(credentialReminder('2026-10-30', '2026-09-30')).toBe('due_30');
	});

	it('should_count_expired_as_due_within_60_days_for_the_overview', () => {
		expect(isCredentialDueWithin60Days('2026-10-01', TODAY)).toBe(true);
		expect(isCredentialDueWithin60Days('2027-10-01', TODAY)).toBe(false);
		expect(isCredentialDueWithin60Days(null, TODAY)).toBe(false);
	});
});

describe('date helpers', () => {
	it('should_add_days_across_month_and_leap_year_boundaries', () => {
		expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
		expect(addDays('2026-10-20', -20)).toBe('2026-09-30');
	});
});
