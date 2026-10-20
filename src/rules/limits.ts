// SPEC-010 SA-02 / SPEC-011 PA-04: facilities configure within the organisation's limits.
import type { RecordType } from '../schemas/enums.js';
import type { OrganisationLimits } from '../schemas/platform.js';
import type { WorkflowSettingsBody } from '../schemas/org-facilities.js';

export interface LimitViolation {
	field: keyof WorkflowSettingsBody;
	message: string;
}

// pcwRequiresRnReview is a default, not a ceiling (SA-02), so only record types are bounded here.
export function workflowWithinLimits(
	settings: Pick<WorkflowSettingsBody, 'reviewRecordTypes'>,
	limits: Pick<OrganisationLimits, 'enabledRecordTypes'>,
): LimitViolation[] {
	const enabled = new Set<RecordType>(limits.enabledRecordTypes);
	const notEnabled = settings.reviewRecordTypes.filter((type) => !enabled.has(type));
	if (notEnabled.length === 0) {
		return [];
	}
	return [
		{
			field: 'reviewRecordTypes',
			message: `Record types not enabled for this organisation: ${notEnabled.join(', ')}`,
		},
	];
}

// SA-02: the platform caps how many facilities an organisation may create.
export function isFacilityLimitReached(
	currentFacilityCount: number,
	facilityLimit: number,
): boolean {
	return currentFacilityCount >= facilityLimit;
}
