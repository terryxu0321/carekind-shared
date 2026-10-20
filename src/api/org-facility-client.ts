// SPEC-011 overview, facilities, go-live, workflow settings and audit (staff sign-in).
import { z } from 'zod';
import { type AuditListResponse, auditListResponseSchema } from '../schemas/audit.js';
import type { Id } from '../schemas/common.js';
import type { GoLiveItemKey } from '../schemas/enums.js';
import {
	type Facility,
	type FacilityCreateRequest,
	type FacilityUpdateRequest,
	type GoLiveItemUpdateRequest,
	type GoLiveStatus,
	type OrgOverviewResponse,
	type WorkflowSettings,
	type WorkflowSettingsUpdateRequest,
	facilitySchema,
	goLiveStatusSchema,
	orgOverviewResponseSchema,
	workflowSettingsSchema,
} from '../schemas/org-facilities.js';
import type { Requester } from './http.js';
import { ROUTES, buildPath } from './paths.js';

export interface OrgFacilityClient {
	getOverview(): Promise<OrgOverviewResponse>;
	listFacilities(): Promise<Facility[]>;
	createFacility(body: FacilityCreateRequest): Promise<Facility>;
	getFacility(facilityId: Id): Promise<Facility>;
	updateFacility(facilityId: Id, body: FacilityUpdateRequest): Promise<Facility>;
	getGoLive(facilityId: Id): Promise<GoLiveStatus>;
	updateGoLiveItem(
		facilityId: Id,
		key: GoLiveItemKey,
		body: GoLiveItemUpdateRequest,
	): Promise<GoLiveStatus>;
	activateFacility(facilityId: Id): Promise<Facility>;
	getWorkflowSettings(facilityId: Id): Promise<WorkflowSettings>;
	updateWorkflowSettings(
		facilityId: Id,
		body: WorkflowSettingsUpdateRequest,
	): Promise<WorkflowSettings>;
	listAudit(): Promise<AuditListResponse>;
}

export function createOrgFacilityClient(requester: Requester): OrgFacilityClient {
	const routes = ROUTES.org;
	const facilityPath = (pattern: string, id: Id): string => buildPath(pattern, { id });

	return {
		getOverview: () =>
			requester.send({ method: 'GET', path: routes.overview }, orgOverviewResponseSchema),
		listFacilities: () =>
			requester.send({ method: 'GET', path: routes.facilities }, z.array(facilitySchema)),
		createFacility: (body) =>
			requester.send({ method: 'POST', path: routes.facilities, json: body }, facilitySchema),
		getFacility: (id) =>
			requester.send(
				{ method: 'GET', path: facilityPath(routes.facility, id) },
				facilitySchema,
			),
		updateFacility: (id, body) =>
			requester.send(
				{ method: 'PATCH', path: facilityPath(routes.facility, id), json: body },
				facilitySchema,
			),
		getGoLive: (id) =>
			requester.send(
				{ method: 'GET', path: facilityPath(routes.goLive, id) },
				goLiveStatusSchema,
			),
		updateGoLiveItem: (id, key, body) =>
			requester.send(
				{ method: 'PATCH', path: buildPath(routes.goLiveItem, { id, key }), json: body },
				goLiveStatusSchema,
			),
		activateFacility: (id) =>
			requester.send(
				{ method: 'POST', path: facilityPath(routes.goLiveActivate, id) },
				facilitySchema,
			),
		getWorkflowSettings: (id) =>
			requester.send(
				{ method: 'GET', path: facilityPath(routes.workflowSettings, id) },
				workflowSettingsSchema,
			),
		updateWorkflowSettings: (id, body) =>
			requester.send(
				{ method: 'PUT', path: facilityPath(routes.workflowSettings, id), json: body },
				workflowSettingsSchema,
			),
		listAudit: () =>
			requester.send({ method: 'GET', path: routes.audit }, auditListResponseSchema),
	};
}
