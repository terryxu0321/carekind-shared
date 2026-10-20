import { describe, expect, it } from 'vitest';
import {
	RESIDENT_EVENT_TYPES,
	RESIDENT_STATUSES,
	type ResidentEventType,
	type ResidentStatus,
	allowedResidentEvents,
	eventResetsConsent,
	isAttributionCandidate,
	nextResidentStatus,
} from '../src/index.js';

describe('isAttributionCandidate (SPEC-011 PA-03)', () => {
	it('should_include_only_in_residence', () => {
		const candidates = RESIDENT_STATUSES.filter(isAttributionCandidate);
		expect(candidates).toEqual(['in_residence']);
	});

	it.each(['temporary_leave', 'transferring', 'departed', 'deceased', 'archived'] as const)(
		'should_exclude_%s',
		(status) => {
			expect(isAttributionCandidate(status)).toBe(false);
		},
	);
});

describe('nextResidentStatus (SPEC-011 §3.1)', () => {
	const allowed: [ResidentStatus, ResidentEventType, ResidentStatus][] = [
		['pre_admission', 'admit', 'in_residence'],
		['in_residence', 'temporary_leave', 'temporary_leave'],
		['temporary_leave', 'return', 'in_residence'],
		['in_residence', 'transfer_out', 'transferring'],
		['transferring', 'transfer_accept', 'in_residence'],
		['in_residence', 'depart', 'departed'],
		['in_residence', 'death', 'deceased'],
		['departed', 'archive', 'archived'],
		['deceased', 'archive', 'archived'],
	];

	it.each(allowed)('should_move_%s_on_%s_to_%s', (current, event, expected) => {
		expect(nextResidentStatus(current, event)).toEqual({ ok: true, value: expected });
	});

	it('should_reject_every_transition_not_in_the_diagram', () => {
		const allowedPairs = new Set(allowed.map(([current, event]) => `${current}:${event}`));
		for (const current of RESIDENT_STATUSES) {
			for (const event of RESIDENT_EVENT_TYPES) {
				if (allowedPairs.has(`${current}:${event}`)) {
					continue;
				}
				expect(nextResidentStatus(current, event).ok).toBe(false);
			}
		}
	});

	it('should_keep_archived_read_only', () => {
		expect(allowedResidentEvents('archived')).toEqual([]);
	});

	it('should_not_archive_a_resident_still_in_residence', () => {
		const result = nextResidentStatus('in_residence', 'archive');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toContain('archive');
		}
	});
});

describe('eventResetsConsent', () => {
	it('should_reset_consent_only_when_transfer_is_accepted', () => {
		expect(RESIDENT_EVENT_TYPES.filter(eventResetsConsent)).toEqual(['transfer_accept']);
	});
});
