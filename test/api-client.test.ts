import { describe, expect, it, vi } from 'vitest';
import { ApiError, ROUTES, buildPath, createApiClient } from '../src/index.js';
import { CREDENTIAL_ID, FACILITY_A, ORG_ID, STAFF_ID, syntheticOrganisation } from './synthetic.js';

interface RecordedCall {
	url: string;
	init: RequestInit;
}

function fakeFetch(status: number, body: unknown, calls: RecordedCall[] = []): typeof fetch {
	return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		calls.push({ url: String(input), init: init ?? {} });
		const text = typeof body === 'string' ? body : JSON.stringify(body);
		return new Response(status === 204 ? null : text, { status });
	}) as unknown as typeof fetch;
}

function client(fetchImpl: typeof fetch, token: string | null = 'synthetic-jwt') {
	return createApiClient({ baseUrl: 'http://localhost:3000/', getToken: () => token, fetchImpl });
}

describe('buildPath', () => {
	it('should_fill_and_encode_parameters', () => {
		expect(buildPath(ROUTES.org.goLiveItem, { id: 'a b', key: 'contract_signed' })).toBe(
			'/org/facilities/a%20b/go-live/items/contract_signed',
		);
	});

	it('should_throw_on_missing_parameters', () => {
		expect(() => buildPath(ROUTES.org.staffCredential, { id: STAFF_ID })).toThrow(
			/credentialId/,
		);
	});
});

describe('createApiClient', () => {
	it('should_send_bearer_token_to_the_prefixed_url_and_parse_the_response', async () => {
		const calls: RecordedCall[] = [];
		const api = client(fakeFetch(200, syntheticOrganisation, calls));
		const organisation = await api.platform.getOrganisation(ORG_ID);
		expect(organisation.id).toBe(ORG_ID);
		expect(calls[0]?.url).toBe(`http://localhost:3000/api/v1/platform/organisations/${ORG_ID}`);
		expect(new Headers(calls[0]?.init.headers).get('Authorization')).toBe(
			'Bearer synthetic-jwt',
		);
	});

	it('should_omit_authorization_without_a_token_and_send_json', async () => {
		const calls: RecordedCall[] = [];
		const api = client(fakeFetch(201, syntheticOrganisation, calls), null);
		const body = {
			name: 'Synthetic Wattle Homes',
			abn: '00000000000',
			contactName: 'Testy Example',
			contactEmail: 'owner@example.test',
		};
		await api.platform.createOrganisation(body);
		const headers = new Headers(calls[0]?.init.headers);
		expect(headers.has('Authorization')).toBe(false);
		expect(headers.get('Content-Type')).toBe('application/json');
		expect(calls[0]?.init.method).toBe('POST');
		expect(JSON.parse(String(calls[0]?.init.body))).toEqual(body);
	});

	it('should_send_csv_imports_with_query_and_text_csv', async () => {
		const calls: RecordedCall[] = [];
		const api = client(fakeFetch(200, { importedCount: 1, rejectedRows: [] }, calls));
		await api.org.importStaff(FACILITY_A, 'given_name,family_name\n');
		expect(calls[0]?.url).toBe(
			`http://localhost:3000/api/v1/org/staff/import?facilityId=${FACILITY_A}`,
		);
		expect(new Headers(calls[0]?.init.headers).get('Content-Type')).toBe('text/csv');
	});

	it('should_skip_undefined_query_values', async () => {
		const calls: RecordedCall[] = [];
		await client(fakeFetch(200, [], calls)).org.listStaff();
		expect(calls[0]?.url).toBe('http://localhost:3000/api/v1/org/staff');
	});

	it('should_accept_no_content_on_delete', async () => {
		const calls: RecordedCall[] = [];
		await client(fakeFetch(204, null, calls)).org.deleteCredential(STAFF_ID, CREDENTIAL_ID);
		expect(calls[0]?.init.method).toBe('DELETE');
	});

	it('should_throw_typed_api_error_from_the_error_body', async () => {
		const api = client(
			fakeFetch(403, { error: { code: 'forbidden', message: 'Not allowed' } }),
		);
		const failure = api.org.getFacility(FACILITY_A);
		await expect(failure).rejects.toBeInstanceOf(ApiError);
		await expect(failure).rejects.toMatchObject({ code: 'forbidden', status: 403 });
	});

	it('should_report_unexpected_response_for_non_contract_bodies', async () => {
		await expect(client(fakeFetch(500, '<html>')).org.getOverview()).rejects.toMatchObject({
			code: 'unexpected_response',
			status: 500,
		});
		await expect(
			client(fakeFetch(200, { id: 'nope' })).org.getFacility(FACILITY_A),
		).rejects.toMatchObject({ code: 'unexpected_response' });
	});

	it('should_wrap_network_failures', async () => {
		const failing = vi.fn(async () => {
			throw new TypeError('fetch failed');
		}) as unknown as typeof fetch;
		await expect(client(failing).auth.me()).rejects.toMatchObject({
			code: 'network_error',
			status: 0,
		});
	});
});
