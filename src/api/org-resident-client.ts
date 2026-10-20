// SPEC-011 PA-03 resident register / lifecycle and SPEC-009 consent endpoints.
import { z } from 'zod';
import type { Id } from '../schemas/common.js';
import {
	type Consent,
	type ConsentUpdateRequest,
	type Resident,
	type ResidentCreateRequest,
	type ResidentDetail,
	type ResidentEventCreateRequest,
	type ResidentEventResult,
	type ResidentUpdateRequest,
	consentSchema,
	residentDetailSchema,
	residentEventResultSchema,
	residentSchema,
} from '../schemas/org-residents.js';
import { type CsvImportResult, csvImportResultSchema } from '../schemas/org-staff.js';
import type { Requester } from './http.js';
import { ROUTES, buildPath } from './paths.js';

export interface OrgResidentClient {
	listResidents(facilityId: Id): Promise<Resident[]>;
	createResident(facilityId: Id, body: ResidentCreateRequest): Promise<Resident>;
	importResidents(facilityId: Id, csv: string): Promise<CsvImportResult>;
	getResident(residentId: Id): Promise<ResidentDetail>;
	updateResident(residentId: Id, body: ResidentUpdateRequest): Promise<Resident>;
	recordResidentEvent(
		residentId: Id,
		body: ResidentEventCreateRequest,
	): Promise<ResidentEventResult>;
	getConsent(residentId: Id): Promise<Consent>;
	updateConsent(residentId: Id, body: ConsentUpdateRequest): Promise<Consent>;
}

export function createOrgResidentClient(requester: Requester): OrgResidentClient {
	const routes = ROUTES.org;
	const pathFor = (pattern: string, id: Id): string => buildPath(pattern, { id });

	return {
		listResidents: (facilityId) =>
			requester.send(
				{ method: 'GET', path: pathFor(routes.facilityResidents, facilityId) },
				z.array(residentSchema),
			),
		createResident: (facilityId, body) =>
			requester.send(
				{ method: 'POST', path: pathFor(routes.facilityResidents, facilityId), json: body },
				residentSchema,
			),
		importResidents: (facilityId, csv) =>
			requester.send(
				{ method: 'POST', path: pathFor(routes.facilityResidentsImport, facilityId), csv },
				csvImportResultSchema,
			),
		getResident: (id) =>
			requester.send(
				{ method: 'GET', path: pathFor(routes.resident, id) },
				residentDetailSchema,
			),
		updateResident: (id, body) =>
			requester.send(
				{ method: 'PATCH', path: pathFor(routes.resident, id), json: body },
				residentSchema,
			),
		recordResidentEvent: (id, body) =>
			requester.send(
				{ method: 'POST', path: pathFor(routes.residentEvents, id), json: body },
				residentEventResultSchema,
			),
		getConsent: (id) =>
			requester.send(
				{ method: 'GET', path: pathFor(routes.residentConsent, id) },
				consentSchema,
			),
		updateConsent: (id, body) =>
			requester.send(
				{ method: 'PUT', path: pathFor(routes.residentConsent, id), json: body },
				consentSchema,
			),
	};
}
