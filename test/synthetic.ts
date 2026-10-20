// Synthetic data only — for development and tests (code-rules CORE-09 / P-3). No real people.
export const ORG_ID = '0a000000-0000-4000-8000-000000000001';
export const FACILITY_A = '0f000000-0000-4000-8000-00000000000a';
export const FACILITY_B = '0f000000-0000-4000-8000-00000000000b';
export const STAFF_ID = '05000000-0000-4000-8000-000000000001';
export const RESIDENT_ID = '0e000000-0000-4000-8000-000000000001';
export const CREDENTIAL_ID = '0c000000-0000-4000-8000-000000000001';
export const NOW = '2026-10-20T09:00:00+11:00';

export const syntheticOrganisation = {
	id: ORG_ID,
	name: 'Synthetic Gum Tree Care Group',
	abn: '00000000000',
	contactName: 'Testy Example',
	contactEmail: 'owner@example.test',
	status: 'active',
	limits: {
		enabledRecordTypes: ['progress_note', 'adl'],
		pcwRequiresRnReview: true,
		audioRetentionDaysMax: 7,
		aiProcessingEnabled: true,
		facilityLimit: 3,
	},
	createdAt: NOW,
	updatedAt: NOW,
};

export const syntheticResident = {
	id: RESIDENT_ID,
	organisationId: ORG_ID,
	facilityId: FACILITY_A,
	givenName: 'Fictional',
	preferredName: null,
	familyName: 'Resident-One',
	room: '12A',
	status: 'in_residence',
	createdAt: NOW,
	updatedAt: NOW,
};
