import { describe, expect, it } from 'vitest';
import {
	ACTIONS,
	type Action,
	accessibleFacilityIds,
	can,
	canInFacility,
	permissionsFor,
} from '../src/index.js';
import { FACILITY_A, FACILITY_B } from './synthetic.js';

// Tech design §2 table, written out independently so a change to the rule shows up here.
const TABLE: Record<'org_admin' | 'facility_manager' | 'don' | 'admin_officer', Action[]> = {
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
};

describe('permissionsFor / can (tech design §2)', () => {
	it.each(Object.entries(TABLE))('should_match_the_table_for_%s', (role, expected) => {
		for (const action of ACTIONS) {
			expect(can(role as keyof typeof TABLE, action)).toBe(expected.includes(action));
		}
	});

	it.each(['rn', 'en', 'pcw', 'no_app'] as const)('should_deny_admin_actions_to_%s', (role) => {
		expect(permissionsFor(role)).toEqual([]);
	});

	it('should_keep_platform_admin_away_from_tenant_data (SA-05)', () => {
		expect(permissionsFor('platform_admin')).toEqual(['manage_platform']);
		expect(can('platform_admin', 'manage_residents')).toBe(false);
		expect(can('org_admin', 'manage_platform')).toBe(false);
	});
});

describe('canInFacility (PA-01a)', () => {
	const managerOfA = {
		isOrgAdmin: false,
		assignments: [
			{ facilityId: FACILITY_A, role: 'facility_manager' as const },
			{ facilityId: FACILITY_B, role: 'rn' as const },
		],
	};

	it('should_use_the_role_held_at_that_facility', () => {
		expect(canInFacility(managerOfA, FACILITY_A, 'manage_go_live')).toBe(true);
		expect(canInFacility(managerOfA, FACILITY_B, 'manage_go_live')).toBe(false);
	});

	it('should_deny_unassigned_facilities', () => {
		const unassigned = '0f000000-0000-4000-8000-0000000000cc';
		expect(canInFacility(managerOfA, unassigned, 'view_overview')).toBe(false);
	});

	it('should_let_org_admin_act_everywhere_but_not_on_platform', () => {
		const orgAdmin = { isOrgAdmin: true, assignments: [] };
		expect(canInFacility(orgAdmin, FACILITY_B, 'create_facility')).toBe(true);
		expect(canInFacility(orgAdmin, FACILITY_B, 'manage_platform')).toBe(false);
	});

	it('should_list_only_facilities_with_an_admin_role', () => {
		expect(accessibleFacilityIds(managerOfA)).toEqual([FACILITY_A]);
		expect(accessibleFacilityIds({ isOrgAdmin: true, assignments: [] })).toBeNull();
	});
});
