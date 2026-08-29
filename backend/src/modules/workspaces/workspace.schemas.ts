import { z } from 'zod';
import { ROLES } from '../../constants/index.js';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Workspace name must be at least 2 characters').max(100),
    description: z.string().trim().max(2000).optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  params: z.object({
    workspaceId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(2000).optional(),
  }),
});

export const inviteMemberSchema = z.object({
  params: z.object({
    workspaceId: z.string().uuid(),
  }),
  body: z.object({
    email: z.string().trim().email('Invalid email address').max(254),
    role: z.enum([ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]).default(ROLES.VIEWER),
    allowedRoomIds: z.array(z.string().uuid()).max(500).default([]),
  }),
});

export const updateMemberRoleSchema = z.object({
  params: z.object({
    workspaceId: z.string().uuid(),
    userId: z.string().uuid(),
  }),
  body: z.object({
    role: z.enum([ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]),
    allowedRoomIds: z.array(z.string().uuid()).max(500).optional(),
  }),
});

export const workspaceParamsSchema = z.object({
  params: z.object({ workspaceId: z.string().uuid() }),
});

export const memberParamsSchema = z.object({
  params: z.object({ workspaceId: z.string().uuid(), userId: z.string().uuid() }),
});

const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number().finite(), z.boolean(), z.null(), z.array(jsonValue), z.record(jsonValue)])
);

export const saveWorkspaceStateSchema = z.object({
  params: z.object({ workspaceId: z.string().uuid() }),
  body: z.object({
    data: jsonValue,
    baseVersion: z.number().int().nonnegative().optional(),
    migrationId: z.string().trim().min(8).max(120).optional(),
  }).superRefine((value, context) => {
    const bytes = Buffer.byteLength(JSON.stringify(value.data), 'utf8');
    if (bytes > 5 * 1024 * 1024) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['data'], message: 'Workspace state must not exceed 5 MB' });
    }
  }),
});
