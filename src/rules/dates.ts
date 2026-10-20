// Calendar-date arithmetic on YYYY-MM-DD strings. UTC midnight avoids daylight-saving shifts.
import type { IsoDate } from '../schemas/common.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcMs(date: IsoDate): number {
	const [year, month, day] = date.split('-').map(Number);
	if (year === undefined || month === undefined || day === undefined) {
		throw new Error(`Invalid date "${date}", expected YYYY-MM-DD`);
	}
	return Date.UTC(year, month - 1, day);
}

// Whole days from `from` to `to` (negative when `to` is earlier).
export function daysBetween(from: IsoDate, to: IsoDate): number {
	return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

export function addDays(date: IsoDate, days: number): IsoDate {
	return new Date(toUtcMs(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}
