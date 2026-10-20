// SPEC-011 §3.2 staff lifecycle.
import type { StaffLifecycle } from '../schemas/enums.js';
import { type RuleResult, ruleFailed, ruleOk } from './result.js';

export const STAFF_EVENTS = ['invite', 'accept_invite', 'complete_training', 'deactivate'] as const;
export type StaffEvent = (typeof STAFF_EVENTS)[number];

// SPEC-011 §3.2 plus two choices the diagram leaves open:
// - invite from "invited" re-issues the link (SA-03 "重发邀请");
// - deactivate is allowed from every non-deactivated state, because leaving staff must
//   always be removable at once (secure by default, CORE-08).
export const STAFF_TRANSITIONS: Readonly<
	Record<StaffLifecycle, Partial<Record<StaffEvent, StaffLifecycle>>>
> = {
	recorded: { invite: 'invited', deactivate: 'deactivated' },
	invited: { invite: 'invited', accept_invite: 'pending_training', deactivate: 'deactivated' },
	pending_training: { complete_training: 'active', deactivate: 'deactivated' },
	active: { deactivate: 'deactivated' },
	deactivated: {},
};

export function nextStaffLifecycle(
	current: StaffLifecycle,
	event: StaffEvent,
): RuleResult<StaffLifecycle> {
	const next = STAFF_TRANSITIONS[current][event];
	if (next === undefined) {
		return ruleFailed(
			`Staff event "${event}" is not allowed when the staff member is "${current}"`,
		);
	}
	return ruleOk(next);
}

// Admin console sign-in needs a password (accepted invite) and a live account. Training gates
// recording in the nurse app only (tech design §3), not admin work.
export function canSignInToAdminConsole(lifecycle: StaffLifecycle): boolean {
	return lifecycle === 'pending_training' || lifecycle === 'active';
}

// PRD D1: untrained staff may not record; the nurse app is not built in M0, this is the rule it will use.
export function canUseNurseApp(lifecycle: StaffLifecycle, hasAppAccess: boolean): boolean {
	return hasAppAccess && lifecycle === 'active';
}
