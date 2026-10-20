// SPEC-009 / PA-03a: only an explicit "consented" counts; unknown, withdrawn and missing
// records are all treated as not consented (fail safe).
import type { ConsentStatus } from '../schemas/enums.js';

export function isRecordingConsented(status: ConsentStatus | null): boolean {
	return status === 'consented';
}

// PA-06 overview: consented / in_residence. Null when nobody is in residence, so the UI
// shows "no residents" instead of a misleading 0% or 100%.
export function consentCoverage(consentedCount: number, inResidenceCount: number): number | null {
	if (inResidenceCount === 0) {
		return null;
	}
	return consentedCount / inResidenceCount;
}
