// SPEC-010 Super Admin endpoints (platform_admin only).
import { z } from 'zod';
import { type AuditListResponse, auditListResponseSchema } from '../schemas/audit.js';
import type { Id } from '../schemas/common.js';
import {
	type AdminInviteRequest,
	type FacilitySummary,
	type InviteLinkResponse,
	type Organisation,
	type OrganisationCreateRequest,
	type OrganisationLimits,
	type OrganisationUpdateRequest,
	type OrgAdminSummary,
	type PlatformDefaults,
	type UsageResponse,
	facilitySummarySchema,
	inviteLinkResponseSchema,
	orgAdminSummarySchema,
	organisationSchema,
	platformDefaultsSchema,
	usageResponseSchema,
} from '../schemas/platform.js';
import type { Requester } from './http.js';
import { ROUTES, buildPath } from './paths.js';

export interface PlatformClient {
	listOrganisations(): Promise<Organisation[]>;
	createOrganisation(body: OrganisationCreateRequest): Promise<Organisation>;
	getOrganisation(organisationId: Id): Promise<Organisation>;
	updateOrganisation(organisationId: Id, body: OrganisationUpdateRequest): Promise<Organisation>;
	suspendOrganisation(organisationId: Id): Promise<Organisation>;
	reactivateOrganisation(organisationId: Id): Promise<Organisation>;
	updateOrganisationLimits(organisationId: Id, body: OrganisationLimits): Promise<Organisation>;
	listOrganisationFacilities(organisationId: Id): Promise<FacilitySummary[]>;
	listOrganisationAdmins(organisationId: Id): Promise<OrgAdminSummary[]>;
	inviteOrganisationAdmin(
		organisationId: Id,
		body: AdminInviteRequest,
	): Promise<InviteLinkResponse>;
	deactivateOrganisationAdmin(staffId: Id): Promise<OrgAdminSummary>;
	getDefaults(): Promise<PlatformDefaults>;
	updateDefaults(body: PlatformDefaults): Promise<PlatformDefaults>;
	getUsage(): Promise<UsageResponse>;
	listAudit(): Promise<AuditListResponse>;
}

export function createPlatformClient(requester: Requester): PlatformClient {
	const routes = ROUTES.platform;
	const orgPath = (pattern: string, id: Id): string => buildPath(pattern, { id });

	return {
		listOrganisations: () =>
			requester.send(
				{ method: 'GET', path: routes.organisations },
				z.array(organisationSchema),
			),
		createOrganisation: (body) =>
			requester.send(
				{ method: 'POST', path: routes.organisations, json: body },
				organisationSchema,
			),
		getOrganisation: (id) =>
			requester.send(
				{ method: 'GET', path: orgPath(routes.organisation, id) },
				organisationSchema,
			),
		updateOrganisation: (id, body) =>
			requester.send(
				{ method: 'PATCH', path: orgPath(routes.organisation, id), json: body },
				organisationSchema,
			),
		suspendOrganisation: (id) =>
			requester.send(
				{ method: 'POST', path: orgPath(routes.organisationSuspend, id) },
				organisationSchema,
			),
		reactivateOrganisation: (id) =>
			requester.send(
				{ method: 'POST', path: orgPath(routes.organisationReactivate, id) },
				organisationSchema,
			),
		updateOrganisationLimits: (id, body) =>
			requester.send(
				{
					method: 'PUT',
					path: orgPath(routes.organisationLimits, id),
					json: body,
				},
				organisationSchema,
			),
		listOrganisationFacilities: (id) =>
			requester.send(
				{ method: 'GET', path: orgPath(routes.organisationFacilities, id) },
				z.array(facilitySummarySchema),
			),
		listOrganisationAdmins: (id) =>
			requester.send(
				{ method: 'GET', path: orgPath(routes.organisationAdmins, id) },
				z.array(orgAdminSummarySchema),
			),
		inviteOrganisationAdmin: (id, body) =>
			requester.send(
				{ method: 'POST', path: orgPath(routes.organisationAdminInvites, id), json: body },
				inviteLinkResponseSchema,
			),
		deactivateOrganisationAdmin: (staffId) =>
			requester.send(
				{ method: 'POST', path: buildPath(routes.adminDeactivate, { staffId }) },
				orgAdminSummarySchema,
			),
		getDefaults: () =>
			requester.send({ method: 'GET', path: routes.defaults }, platformDefaultsSchema),
		updateDefaults: (body) =>
			requester.send(
				{ method: 'PUT', path: routes.defaults, json: body },
				platformDefaultsSchema,
			),
		getUsage: () => requester.send({ method: 'GET', path: routes.usage }, usageResponseSchema),
		listAudit: () =>
			requester.send({ method: 'GET', path: routes.audit }, auditListResponseSchema),
	};
}
