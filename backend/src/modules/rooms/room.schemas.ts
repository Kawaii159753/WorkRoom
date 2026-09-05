import { z } from 'zod';

export const createRoomSchema = z.object({
  body: z.object({
    workspaceId: z.string().uuid(),
    sectionId: z.string().uuid().optional(),
    name: z.string().trim().min(1, 'Room name is required').max(100),
    icon: z.string().trim().max(32).optional(),
    isPrivate: z.boolean().default(false),
  }),
});

export const roomParamsSchema = z.object({
  params: z.object({
    roomId: z.string().uuid('Invalid roomId format'),
  }),
});

export const saveRoomStateSchema = z.object({
  params: z.object({
    roomId: z.string().uuid('Invalid roomId format'),
  }),
  body: z.object({
    data: z.union([z.record(z.unknown()), z.array(z.unknown())]),
    baseVersion: z.number().int().positive().optional(),
  }),
});
