import { describe, expect, it } from 'vitest';
import {
	GOLIVE_ITEM_KEYS,
	type GoLiveItemState,
	canActivateFacility,
	checkGoLiveItemUpdate,
} from '../src/index.js';

const TODAY = '2026-10-20';
const DONE = '2026-10-01T09:00:00+10:00';

function allComplete(noticeSentOn: string | null): GoLiveItemState[] {
	return GOLIVE_ITEM_KEYS.map((key) => ({
		key,
		completedAt: DONE,
		noticeSentOn: key === 'staff_notice_sent' ? noticeSentOn : null,
	}));
}

describe('canActivateFacility (SPEC-011 PA-05)', () => {
	it('should_activate_when_all_items_done_and_nsw_notice_is_exactly_14_days_old', () => {
		expect(canActivateFacility(allComplete('2026-10-06'), 'NSW', TODAY)).toEqual({
			canActivate: true,
			blockers: [],
		});
	});

	it('should_block_nsw_when_notice_is_13_days_old', () => {
		const decision = canActivateFacility(allComplete('2026-10-07'), 'NSW', TODAY);
		expect(decision.canActivate).toBe(false);
		expect(decision.blockers).toEqual([
			{ kind: 'notice_period_not_met', earliestActivationDate: '2026-10-21' },
		]);
	});

	it('should_block_nsw_when_notice_date_is_in_the_future', () => {
		expect(canActivateFacility(allComplete('2026-10-25'), 'NSW', TODAY).canActivate).toBe(
			false,
		);
	});

	it('should_block_nsw_when_notice_item_has_no_date', () => {
		expect(canActivateFacility(allComplete(null), 'NSW', TODAY).blockers).toEqual([
			{ kind: 'notice_date_missing' },
		]);
	});

	it('should_not_apply_the_14_day_rule_outside_nsw', () => {
		expect(canActivateFacility(allComplete(TODAY), 'VIC', TODAY).canActivate).toBe(true);
		expect(canActivateFacility(allComplete(null), 'QLD', TODAY).canActivate).toBe(true);
	});

	it('should_list_every_incomplete_or_missing_item', () => {
		const items = allComplete('2026-01-01').map((item) =>
			item.key === 'consent_recorded' ? { ...item, completedAt: null } : item,
		);
		const withoutTraining = items.filter((item) => item.key !== 'training_completed');
		const decision = canActivateFacility(withoutTraining, 'NSW', TODAY);
		expect(decision.canActivate).toBe(false);
		expect(decision.blockers).toEqual([
			{ kind: 'item_incomplete', key: 'consent_recorded' },
			{ kind: 'item_incomplete', key: 'training_completed' },
		]);
	});

	it('should_block_when_there_are_no_items', () => {
		expect(canActivateFacility([], 'TAS', TODAY).blockers).toHaveLength(
			GOLIVE_ITEM_KEYS.length,
		);
	});
});

describe('checkGoLiveItemUpdate', () => {
	it('should_require_a_notice_date_to_complete_staff_notice_sent', () => {
		expect(checkGoLiveItemUpdate('staff_notice_sent', { completed: true }).ok).toBe(false);
		expect(
			checkGoLiveItemUpdate('staff_notice_sent', { completed: true, noticeSentOn: TODAY }).ok,
		).toBe(true);
	});

	it('should_allow_unticking_without_a_date', () => {
		expect(checkGoLiveItemUpdate('staff_notice_sent', { completed: false }).ok).toBe(true);
	});

	it('should_reject_a_notice_date_on_other_items', () => {
		expect(
			checkGoLiveItemUpdate('contract_signed', { completed: true, noticeSentOn: TODAY }).ok,
		).toBe(false);
		expect(checkGoLiveItemUpdate('contract_signed', { completed: true }).ok).toBe(true);
	});
});
