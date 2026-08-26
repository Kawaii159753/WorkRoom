import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { ERROR_CODES, ROLES } from '../../constants/index.js';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errorHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireWorkspaceRole } from '../../middleware/workspace.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

const createRoomSchema = z.object({
  body: z.object({
    workspaceId: z.string().uuid(),
    sectionId: z.string().uuid().optional(),
    name: z.string().min(1, 'Room name is required'),
    icon: z.string().optional(),
    isPrivate: z.boolean().default(false),
  }),
});

router.post(
  '/',
  requireAuth,
  validate(createRoomSchema),
  requireWorkspaceRole([ROLES.OWNER, ROLES.EDITOR]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, sectionId, name, icon, isPrivate } = req.body;

      const room = await prisma.room.create({
        data: {
          workspaceId,
          sectionId,
          name,
          icon,
          isPrivate,
        },
      });

      return sendSuccess(res, room, 201);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:roomId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const room = await prisma.room.findUnique({
        where: { id: req.params.roomId },
        include: {
          pages: {
            orderBy: { position: 'asc' },
          },
          postits: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!room) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Room not found', 404);
      }

      return sendSuccess(res, room);
    } catch (error) {
      next(error);
    }
  }
);

export const roomRouter = router;
