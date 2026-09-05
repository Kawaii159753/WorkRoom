import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma.js';
import { ERROR_CODES, ROLES } from '../../constants/index.js';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errorHandler.js';
import { validate } from '../../middleware/validate.js';
import { assertRoomAccess, requireWorkspaceRole } from '../../middleware/workspace.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { sendSuccess } from '../../utils/response.js';
import {
  createRoomSchema,
  roomParamsSchema,
  saveRoomStateSchema,
} from './room.schemas.js';
import { RoomService } from './room.service.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  validate(createRoomSchema),
  requireWorkspaceRole([ROLES.OWNER, ROLES.EDITOR]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, sectionId, name, icon, isPrivate } = req.body;

      if (sectionId) {
        const section = await prisma.section.findFirst({ where: { id: sectionId, workspaceId } });
        if (!section) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Section does not belong to this workspace', 400);
        }
      }

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
  validate(roomParamsSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await assertRoomAccess(req.user!.id, req.params.roomId, 'view');
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

router.get(
  '/:roomId/state',
  requireAuth,
  validate(roomParamsSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await assertRoomAccess(req.user!.id, req.params.roomId, 'view');
      const state = await RoomService.getRoomState(req.params.roomId);
      return sendSuccess(res, state);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:roomId/state',
  requireAuth,
  validate(saveRoomStateSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await assertRoomAccess(req.user!.id, req.params.roomId, 'edit');
      const state = await RoomService.saveRoomState(
        req.params.roomId,
        req.user!.id,
        req.body.data,
        req.body.baseVersion
      );
      return sendSuccess(res, state);
    } catch (error) {
      next(error);
    }
  }
);

export const roomRouter: Router = router;

