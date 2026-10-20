import { describe, expect, it } from 'vitest';
import {
	STAFF_LIFECYCLES,
	canSignInToAdminConsole,
	canUseNurseApp,
	nextStaffLifecycle,
} from '../src/index.js';

describe('nextStaffLifecycle (SPEC-011 §3.2)', () => {
	it('should_follow_the_happy_path_recorded_to_active', () => {
		expect(nextStaffLifecycle('recorded', 'invite')).toEqual({ ok: true, value: 'invited' });
		expect(nextStaffLifecycle('invited', 'accept_invite')).toEqual({
			ok: true,
			value: 'pending_training',
		});
		expect(nextStaffLifecycle('pending_training', 'complete_training')).toEqual({
			ok: true,
			value: 'active',
		});
	});

	it('should_allow_resending_an_invite', () => {
		expect(nextStaffLifecycle('invited', 'invite')).toEqual({ ok: true, value: 'invited' });
	});

	it.each(['recorded', 'invited', 'pending_training', 'active'] as const)(
		'should_allow_deactivating_%s_staff',
		(lifecycle) => {
			expect(nextStaffLifecycle(lifecycle, 'deactivate')).toEqual({
				ok: true,
				value: 'deactivated',
			});
		},
	);

	it('should_not_reactivate_or_change_deactivated_staff', () => {
		for (const event of [
			'invite',
			'accept_invite',
			'complete_training',
			'deactivate',
		] as const) {
			expect(nextStaffLifecycle('deactivated', event).ok).toBe(false);
		}
	});

	it('should_not_skip_training', () => {
		expect(nextStaffLifecycle('invited', 'complete_training').ok).toBe(false);
		expect(nextStaffLifecycle('recorded', 'accept_invite').ok).toBe(false);
	});
});

describe('sign-in rules', () => {
	it('should_allow_admin_console_only_after_accepting_invite_and_before_deactivation', () => {
		const allowed = STAFF_LIFECYCLES.filter(canSignInToAdminConsole);
		expect(allowed).toEqual(['pending_training', 'active']);
	});

	it('should_block_nurse_app_until_training_is_complete', () => {
		expect(canUseNurseApp('pending_training', true)).toBe(false);
		expect(canUseNurseApp('active', true)).toBe(true);
		expect(canUseNurseApp('active', false)).toBe(false);
	});
});
