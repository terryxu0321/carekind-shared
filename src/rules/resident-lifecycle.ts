// SPEC-011 §3.1 resident lifecycle. The roster drives which residents the AI may attribute
// speech to, so a wrong status widens the wrong-resident hazard (H-03).
import type { ResidentEventType, ResidentStatus } from '../schemas/enums.js';
import { type RuleResult, ruleFailed, ruleOk } from './result.js';

// SPEC-011 PA-03: only in_residence enters attribution; temporary_leave, transferring,
// departed, deceased and archived drop out immediately.
export function isAttributionCandidate(status: ResidentStatus): boolean {
	return status === 'in_residence';
}

// The transitions drawn in SPEC-011 §3.1, plus depart/death from temporary_leave;
// anything else is rejected (fail safe).
export const RESIDENT_TRANSITIONS: Readonly<
	Record<ResidentStatus, Partial<Record<ResidentEventType, ResidentStatus>>>
> = {
	pre_admission: { admit: 'in_residence' },
	in_residence: {
		temporary_leave: 'temporary_leave',
		transfer_out: 'transferring',
		depart: 'departed',
		death: 'deceased',
	},
	// A resident on leave can die in hospital or never return (M0 follow-up, 2026-10-20).
	temporary_leave: { return: 'in_residence', depart: 'departed', death: 'deceased' },
	transferring: { transfer_accept: 'in_residence' },
	departed: { archive: 'archived' },
	deceased: { archive: 'archived' },
	// Archived records are read-only and never deleted (SPEC-011 §3.1).
	archived: {},
};

export function nextResidentStatus(
	current: ResidentStatus,
	eventType: ResidentEventType,
): RuleResult<ResidentStatus> {
	const next = RESIDENT_TRANSITIONS[current][eventType];
	if (next === undefined) {
		return ruleFailed(`Event "${eventType}" is not allowed when the resident is "${current}"`);
	}
	return ruleOk(next);
}

export function allowedResidentEvents(current: ResidentStatus): ResidentEventType[] {
	return Object.keys(RESIDENT_TRANSITIONS[current]) as ResidentEventType[];
}

// Tech design §3: the receiving facility accepts the transfer, and consent goes back to unknown.
export function eventResetsConsent(eventType: ResidentEventType): boolean {
	return eventType === 'transfer_accept';
}
