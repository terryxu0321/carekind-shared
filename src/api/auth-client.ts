import {
	type AcceptInviteRequest,
	type LoginRequest,
	type LoginResponse,
	type MeResponse,
	loginResponseSchema,
	meResponseSchema,
} from '../schemas/auth.js';
import type { Requester } from './http.js';
import { ROUTES } from './paths.js';

export interface AuthClient {
	login(body: LoginRequest): Promise<LoginResponse>;
	acceptInvite(body: AcceptInviteRequest): Promise<LoginResponse>;
	me(): Promise<MeResponse>;
}

export function createAuthClient(requester: Requester): AuthClient {
	return {
		login: (body) =>
			requester.send(
				{ method: 'POST', path: ROUTES.auth.login, json: body },
				loginResponseSchema,
			),
		acceptInvite: (body) =>
			requester.send(
				{ method: 'POST', path: ROUTES.auth.acceptInvite, json: body },
				loginResponseSchema,
			),
		me: () => requester.send({ method: 'GET', path: ROUTES.auth.me }, meResponseSchema),
	};
}
