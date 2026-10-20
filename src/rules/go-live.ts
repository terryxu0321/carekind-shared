// SPEC-011 PA-05 go-live gate: a facility may enable recording only when every checklist
// item is done, and in NSW written staff notice was given at least 14 days before
// (workplace surveillance notice, tech design §3). Other states only record the date.
import type { IsoDate } from '../schemas/common.js';
import { type AustralianState, GOLIVE_ITEM_KEYS, type GoLiveItemKey } from '../schemas/enums.js';
import type {
	GoLiveBlocker,
	GoLiveItem,
	GoLiveItemUpdateRequest,
} from '../schemas/org-facilities.js';
import { addDays, daysBetween } from './dates.js';
import { type RuleResult, ruleFailed, ruleOk } from './result.js';

export const NSW_STAFF_NOTICE_DAYS = 14;

// Notice periods by state; only NSW has one in the current legal research.
const STAFF_NOTICE_DAYS_BY_STATE: Partial<Record<AustralianState, number>> = {
	NSW: NSW_STAFF_NOTICE_DAYS,
};

export type GoLiveItemState = Pick<GoLiveItem, 'key' | 'completedAt' | 'noticeSentOn'>;

export interface GoLiveDecision {
	canActivate: boolean;
	blockers: GoLiveBlocker[];
}

function noticeBlockers(
	notice: GoLiveItemState | undefined,
	state: AustralianState,
	today: IsoDate,
): GoLiveBlocker[] {
	const requiredDays = STAFF_NOTICE_DAYS_BY_STATE[state];
	if (requiredDays === undefined || notice === undefined || notice.completedAt === null) {
		return [];
	}
	if (notice.noticeSentOn === null) {
		return [{ kind: 'notice_date_missing' }];
	}
	if (daysBetween(notice.noticeSentOn, today) >= requiredDays) {
		return [];
	}
	return [
		{
			kind: 'notice_period_not_met',
			earliestActivationDate: addDays(notice.noticeSentOn, requiredDays),
		},
	];
}

export function canActivateFacility(
	items: readonly GoLiveItemState[],
	state: AustralianState,
	today: IsoDate,
): GoLiveDecision {
	const completedKeys = new Set(
		items.filter((item) => item.completedAt !== null).map((item) => item.key),
	);
	const blockers: GoLiveBlocker[] = GOLIVE_ITEM_KEYS.filter((key) => !completedKeys.has(key)).map(
		(key) => ({ kind: 'item_incomplete', key }),
	);
	const notice = items.find((item) => item.key === 'staff_notice_sent');
	blockers.push(...noticeBlockers(notice, state, today));
	return { canActivate: blockers.length === 0, blockers };
}

// staff_notice_sent needs the date notice was given; other items must not carry one.
export function checkGoLiveItemUpdate(
	key: GoLiveItemKey,
	update: GoLiveItemUpdateRequest,
): RuleResult<GoLiveItemUpdateRequest> {
	const hasNoticeDate = update.noticeSentOn !== undefined && update.noticeSentOn !== null;
	if (key !== 'staff_notice_sent') {
		return hasNoticeDate
			? ruleFailed('noticeSentOn is only used for staff_notice_sent')
			: ruleOk(update);
	}
	if (update.completed && !hasNoticeDate) {
		return ruleFailed('Record the date written notice was given to staff');
	}
	return ruleOk(update);
}
