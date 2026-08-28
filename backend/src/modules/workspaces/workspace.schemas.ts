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
