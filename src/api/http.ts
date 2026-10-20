// One request path for every client method: auth header, JSON/CSV body, and zod parsing of
// every response (TY-3: external data is parsed before use).
import type { z } from 'zod';
import { type ApiErrorCode, errorResponseSchema } from '../schemas/errors.js';
import { API_PREFIX } from './paths.js';

// Client-side failures that never come from the server's error body.
export type ClientErrorCode = 'network_error' | 'unexpected_response';

export class ApiError extends Error {
	readonly code: ApiErrorCode | ClientErrorCode;
	readonly status: number;

	constructor(code: ApiErrorCode | ClientErrorCode, message: string, status: number) {
		super(message);
		this.name = 'ApiError';
		this.code = code;
		this.status = status;
	}
}

export interface ApiClientOptions {
	baseUrl: string;
	getToken: () => string | null | Promise<string | null>;
	// Defaults to the global fetch; injectable for tests.
	fetchImpl?: typeof fetch;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestSpec {
	method: HttpMethod;
	path: string;
	query?: Readonly<Record<string, string | undefined>>;
	json?: unknown;
	csv?: string;
}

export interface Requester {
	send<Schema extends z.ZodType>(spec: RequestSpec, schema: Schema): Promise<z.output<Schema>>;
	sendWithoutContent(spec: RequestSpec): Promise<void>;
}

function buildUrl(baseUrl: string, spec: RequestSpec): string {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(spec.query ?? {})) {
		if (value !== undefined) {
			search.set(key, value);
		}
	}
	const queryString = search.toString();
	const base = baseUrl.replace(/\/+$/, '');
	return `${base}${API_PREFIX}${spec.path}${queryString ? `?${queryString}` : ''}`;
}

function buildBody(spec: RequestSpec): { body?: string; contentType?: string } {
	if (spec.csv !== undefined) {
		return { body: spec.csv, contentType: 'text/csv' };
	}
	if (spec.json !== undefined) {
		return { body: JSON.stringify(spec.json), contentType: 'application/json' };
	}
	return {};
}

async function readJson(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch (cause) {
		throw new ApiError(
			'unexpected_response',
			`Response was not JSON (${String(cause)})`,
			response.status,
		);
	}
}

async function errorFrom(response: Response): Promise<ApiError> {
	// A non-JSON error body (e.g. a proxy page) is reported below as unexpected_response.
	const body = await readJson(response).catch(() => null);
	const parsed = errorResponseSchema.safeParse(body);
	if (parsed.success) {
		return new ApiError(parsed.data.error.code, parsed.data.error.message, response.status);
	}
	return new ApiError(
		'unexpected_response',
		`Request failed with HTTP ${response.status}`,
		response.status,
	);
}

export function createRequester(options: ApiClientOptions): Requester {
	const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);

	async function execute(spec: RequestSpec): Promise<Response> {
		const token = await options.getToken();
		const { body, contentType } = buildBody(spec);
		const headers: Record<string, string> = { Accept: 'application/json' };
		if (contentType) {
			headers['Content-Type'] = contentType;
		}
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}
		let response: Response;
		try {
			response = await fetchImpl(buildUrl(options.baseUrl, spec), {
				method: spec.method,
				headers,
				body,
			});
		} catch (cause) {
			throw new ApiError('network_error', `Could not reach the API (${String(cause)})`, 0);
		}
		if (!response.ok) {
			throw await errorFrom(response);
		}
		return response;
	}

	return {
		async send<Schema extends z.ZodType>(
			spec: RequestSpec,
			schema: Schema,
		): Promise<z.output<Schema>> {
			const response = await execute(spec);
			const parsed = schema.safeParse(await readJson(response));
			if (!parsed.success) {
				throw new ApiError(
					'unexpected_response',
					`Response for ${spec.method} ${spec.path} did not match the contract`,
					response.status,
				);
			}
			return parsed.data;
		},
		async sendWithoutContent(spec: RequestSpec): Promise<void> {
			await execute(spec);
		},
	};
}
