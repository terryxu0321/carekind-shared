// Rules return a result instead of throwing so the API can map failures to error codes
// and the UI can show the reason without try/catch.
export type RuleResult<T> = { ok: true; value: T } | { ok: false; reason: string };

export function ruleOk<T>(value: T): RuleResult<T> {
	return { ok: true, value };
}

export function ruleFailed<T>(reason: string): RuleResult<T> {
	return { ok: false, reason };
}
