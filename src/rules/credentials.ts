// SPEC-011 PA-02a: remind 60 and 30 days before expiry. Reminder only — never deactivates
// staff or judges whether they may work; that is the facility's decision.
import type { IsoDate } from '../schemas/common.js';
import type { CredentialReminder } from '../schemas/org-staff.js';
import { daysBetween } from './dates.js';

export const CREDENTIAL_REMINDER_DAYS_FIRST = 60;
export const CREDENTIAL_REMINDER_DAYS_SECOND = 30;

// A credential is still valid on its expiry date and expired from the next day.
export function credentialReminder(expiresAt: IsoDate | null, today: IsoDate): CredentialReminder {
	if (expiresAt === null) {
		return 'none';
	}
	const daysLeft = daysBetween(today, expiresAt);
	if (daysLeft < 0) {
		return 'expired';
	}
	if (daysLeft <= CREDENTIAL_REMINDER_DAYS_SECOND) {
		return 'due_30';
	}
	if (daysLeft <= CREDENTIAL_REMINDER_DAYS_FIRST) {
		return 'due_60';
	}
	return 'none';
}

// Overview "60 天内到期资质数" counts anything needing attention, including already expired.
export function isCredentialDueWithin60Days(expiresAt: IsoDate | null, today: IsoDate): boolean {
	return credentialReminder(expiresAt, today) !== 'none';
}
