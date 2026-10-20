// Tech design §4 route table, defined once. The API registers these patterns (NestJS ":param"
// syntax); the client fills them with buildPath(). All live under API_PREFIX.
export const API_PREFIX = '/api/v1';

export const ROUTES = {
	auth: {
		login: '/auth/login',
		acceptInvite: '/auth/accept-invite',
		me: '/auth/me',
	},
	platform: {
		organisations: '/platform/organisations',
		organisation: '/platform/organisations/:id',
		organisationSuspend: '/platform/organisations/:id/suspend',
		organisationReactivate: '/platform/organisations/:id/reactivate',
		organisationLimits: '/platform/organisations/:id/limits',
		organisationFacilities: '/platform/organisations/:id/facilities',
		organisationAdmins: '/platform/organisations/:id/admins',
		organisationAdminInvites: '/platform/organisations/:id/admin-invites',
		adminDeactivate: '/platform/admins/:staffId/deactivate',
		defaults: '/platform/defaults',
		usage: '/platform/usage',
		audit: '/platform/audit',
	},
	org: {
		overview: '/org/overview',
		facilities: '/org/facilities',
		facility: '/org/facilities/:id',
		goLive: '/org/facilities/:id/go-live',
		goLiveItem: '/org/facilities/:id/go-live/items/:key',
		goLiveActivate: '/org/facilities/:id/go-live/activate',
		workflowSettings: '/org/facilities/:id/workflow-settings',
		staffList: '/org/staff',
		staffImport: '/org/staff/import',
		staff: '/org/staff/:id',
		staffAssignments: '/org/staff/:id/assignments',
		staffInvite: '/org/staff/:id/invite',
		staffTrainingComplete: '/org/staff/:id/training-complete',
		staffDeactivate: '/org/staff/:id/deactivate',
		staffCredentials: '/org/staff/:id/credentials',
		staffCredential: '/org/staff/:id/credentials/:credentialId',
		facilityResidents: '/org/facilities/:id/residents',
		facilityResidentsImport: '/org/facilities/:id/residents/import',
		resident: '/org/residents/:id',
		residentEvents: '/org/residents/:id/events',
		residentConsent: '/org/residents/:id/consent',
		audit: '/org/audit',
	},
} as const;

const PARAM = /:([A-Za-z]+)/g;

// Fills ":name" segments; a missing parameter is a programming error, so it throws.
export function buildPath(pattern: string, params: Readonly<Record<string, string>> = {}): string {
	return pattern.replace(PARAM, (_segment: string, name: string) => {
		const value = params[name];
		if (value === undefined || value === '') {
			throw new Error(`Missing path parameter "${name}" for ${pattern}`);
		}
		return encodeURIComponent(value);
	});
}
