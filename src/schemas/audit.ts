// SA-04a / PA-07: append-only audit log. summary must never contain health information or resident names.
import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from './common.js';
import { auditActorTypeSchema } from './enums.js';

export const auditEntrySchema = z.object({
	id: idSchema,
	// Null for platform-level actions that belong to no organisation.
	organisationId: idSchema.nullable(),
	actorType: auditActorTypeSchema,
	actorId: idSchema,
	action: z.string().min(1).max(100),
	entity: z.string().min(1).max(100),
	entityId: idSchema.nullable(),
	occurredAt: isoDateTimeSchema,
	summary: z.string().max(500),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

export const auditListResponseSchema = z.array(auditEntrySchema);
export type AuditListResponse = z.infer<typeof auditListResponseSchema>;
