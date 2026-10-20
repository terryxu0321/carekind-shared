// Typed client for every tech design §4 endpoint, grouped by audience.
import { type AuthClient, createAuthClient } from './auth-client.js';
import { type ApiClientOptions, createRequester } from './http.js';
import { type OrgFacilityClient, createOrgFacilityClient } from './org-facility-client.js';
import { type OrgResidentClient, createOrgResidentClient } from './org-resident-client.js';
import { type OrgStaffClient, createOrgStaffClient } from './org-staff-client.js';
import { type PlatformClient, createPlatformClient } from './platform-client.js';

export type OrgClient = OrgFacilityClient & OrgStaffClient & OrgResidentClient;

export interface ApiClient {
	auth: AuthClient;
	platform: PlatformClient;
	org: OrgClient;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
	const requester = createRequester(options);
	return {
		auth: createAuthClient(requester),
		platform: createPlatformClient(requester),
		org: {
			...createOrgFacilityClient(requester),
			...createOrgStaffClient(requester),
			...createOrgResidentClient(requester),
		},
	};
}
