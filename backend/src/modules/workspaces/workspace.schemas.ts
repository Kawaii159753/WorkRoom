import { z } from 'zod';
import { ROLES } from '../../constants/index.js';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Workspace name must be at least 2 characters'),
    description: z.string().optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  params: z.object({
    workspaceId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
});

export const inviteMemberSchema = z.object({
  params: z.object({
    workspaceId: z.string().uuid(),
  }),
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum([ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]).default(ROLES.VIEWER),
    allowedRoomIds: z.array(z.string().uuid()).default([]),
  }),
});

export const updateMemberRoleSchema = z.object({
  params: z.object({
    workspaceId: z.string().uuid(),
    userId: z.string().uuid(),
  }),
  body: z.object({
    role: z.enum([ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]),
    allowedRoomIds: z.array(z.string().uuid()).optional(),
  }),
});
