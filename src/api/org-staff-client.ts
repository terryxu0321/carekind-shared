// SPEC-011 PA-02 staff register, credentials and lifecycle endpoints.
import { z } from 'zod';
import type { Id } from '../schemas/common.js';
import type { InviteLinkResponse } from '../schemas/platform.js';
import { inviteLinkResponseSchema } from '../schemas/platform.js';
import {
	type Credential,
	type CredentialCreateRequest,
	type CredentialUpdateRequest,
	type CsvImportResult,
	type Staff,
	type StaffAssignmentsUpdateRequest,
	type StaffCreateRequest,
	type StaffListQuery,
	type StaffUpdateRequest,
	credentialSchema,
	csvImportResultSchema,
	staffSchema,
} from '../schemas/org-staff.js';
import type { Requester } from './http.js';
import { ROUTES, buildPath } from './paths.js';

export interface OrgStaffClient {
	listStaff(query?: StaffListQuery): Promise<Staff[]>;
	createStaff(body: StaffCreateRequest): Promise<Staff>;
	importStaff(facilityId: Id, csv: string): Promise<CsvImportResult>;
	getStaff(staffId: Id): Promise<Staff>;
	updateStaff(staffId: Id, body: StaffUpdateRequest): Promise<Staff>;
	updateStaffAssignments(staffId: Id, body: StaffAssignmentsUpdateRequest): Promise<Staff>;
	inviteStaff(staffId: Id): Promise<InviteLinkResponse>;
	completeStaffTraining(staffId: Id): Promise<Staff>;
	deactivateStaff(staffId: Id): Promise<Staff>;
	listCredentials(staffId: Id): Promise<Credential[]>;
	createCredential(staffId: Id, body: CredentialCreateRequest): Promise<Credential>;
	updateCredential(
		staffId: Id,
		credentialId: Id,
		body: CredentialUpdateRequest,
	): Promise<Credential>;
	deleteCredential(staffId: Id, credentialId: Id): Promise<void>;
}

export function createOrgStaffClient(requester: Requester): OrgStaffClient {
	const routes = ROUTES.org;
	const staffPath = (pattern: string, id: Id): string => buildPath(pattern, { id });
	const credentialPath = (id: Id, credentialId: Id): string =>
		buildPath(routes.staffCredential, { id, credentialId });

	return {
		listStaff: (query) =>
			requester.send(
				{ method: 'GET', path: routes.staffList, query: { facilityId: query?.facilityId } },
				z.array(staffSchema),
			),
		createStaff: (body) =>
			requester.send({ method: 'POST', path: routes.staffList, json: body }, staffSchema),
		importStaff: (facilityId, csv) =>
			requester.send(
				{ method: 'POST', path: routes.staffImport, query: { facilityId }, csv },
				csvImportResultSchema,
			),
		getStaff: (id) =>
			requester.send({ method: 'GET', path: staffPath(routes.staff, id) }, staffSchema),
		updateStaff: (id, body) =>
			requester.send(
				{ method: 'PATCH', path: staffPath(routes.staff, id), json: body },
				staffSchema,
			),
		updateStaffAssignments: (id, body) =>
			requester.send(
				{ method: 'PUT', path: staffPath(routes.staffAssignments, id), json: body },
				staffSchema,
			),
		inviteStaff: (id) =>
			requester.send(
				{ method: 'POST', path: staffPath(routes.staffInvite, id) },
				inviteLinkResponseSchema,
			),
		completeStaffTraining: (id) =>
			requester.send(
				{ method: 'POST', path: staffPath(routes.staffTrainingComplete, id) },
				staffSchema,
			),
		deactivateStaff: (id) =>
			requester.send(
				{ method: 'POST', path: staffPath(routes.staffDeactivate, id) },
				staffSchema,
			),
		listCredentials: (id) =>
			requester.send(
				{ method: 'GET', path: staffPath(routes.staffCredentials, id) },
				z.array(credentialSchema),
			),
		createCredential: (id, body) =>
			requester.send(
				{ method: 'POST', path: staffPath(routes.staffCredentials, id), json: body },
				credentialSchema,
			),
		updateCredential: (id, credentialId, body) =>
			requester.send(
				{ method: 'PATCH', path: credentialPath(id, credentialId), json: body },
				credentialSchema,
			),
		deleteCredential: (id, credentialId) =>
			requester.sendWithoutContent({
				method: 'DELETE',
				path: credentialPath(id, credentialId),
			}),
	};
}
