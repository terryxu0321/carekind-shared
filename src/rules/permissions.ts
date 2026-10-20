// Tech design §2 permission table, defined once for the API (enforcement, P-6) and the UIs (display).
// Default deny: a role or action not listed here gets nothing (CORE-08).
import type { StaffAssignment } from '../schemas/auth.js';
import type { Id } from '../schemas/common.js';
import type { Role } from '../schemas/enums.js';

export const ACTIONS = [
	'manage_platform',
	'view_overview',
	'create_facility',
	'edit_facility',
	'manage_staff',
	'manage_residents',
	'manage_consent',
	'configure_workflow',
	'manage_go_live',
	'view_audit',
] as const;
export type Action = (typeof ACTIONS)[number];

const PERMISSIONS: Readonly<Partial<Record<Role, readonly Action[]>>> = {
	// SA-05: the platform manages tenants only, never residents or staff detail.
	platform_admin: ['manage_platform'],
	org_admin: [
		'view_overview',
		'create_facility',
		'edit_facility',
		'manage_staff',
		'manage_residents',
		'manage_consent',
		'configure_workflow',
		'manage_go_live',
		'view_audit',
	],
	facility_manager: [
		'view_overview',
		'edit_facility',
		'manage_staff',
		'manage_residents',
		'manage_consent',
		'configure_workflow',
		'manage_go_live',
		'view_audit',
	],
	don: ['view_overview', 'manage_residents', 'manage_consent', 'configure_workflow'],
	admin_officer: ['view_overview', 'manage_staff', 'manage_residents', 'manage_consent'],
	// rn / en / pcw / no_app use the nurse app or no app; they have no admin-console permissions.
};

export function permissionsFor(role: Role): readonly Action[] {
	return PERMISSIONS[role] ?? [];
}

export function can(role: Role, action: Action): boolean {
	return permissionsFor(role).includes(action);
}

export interface StaffAccess {
	isOrgAdmin: boolean;
	assignments: readonly StaffAssignment[];
}

// PA-01a: org admins act on every facility; facility roles only where they are assigned,
// and only with that facility's role (a person can hold different roles per facility).
export function canInFacility(staff: StaffAccess, facilityId: Id, action: Action): boolean {
	if (staff.isOrgAdmin && can('org_admin', action)) {
		return true;
	}
	const assignment = staff.assignments.find((item) => item.facilityId === facilityId);
	return assignment !== undefined && can(assignment.role, action);
}

// Facilities whose data this person may see in the admin console; null means all facilities.
export function accessibleFacilityIds(staff: StaffAccess): Id[] | null {
	if (staff.isOrgAdmin) {
		return null;
	}
	return staff.assignments
		.filter((item) => permissionsFor(item.role).length > 0)
		.map((item) => item.facilityId);
}
