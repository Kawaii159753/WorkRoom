import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { ERROR_CODES, WorkspaceRoleType } from '../constants/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { AppError } from './errorHandler.js';

export async function assertWorkspaceAccess(
  userId: string,
  workspaceId: string,
  allowedRoles?: WorkspaceRoleType[]
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });

  if (!membership) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'You are not a member of this workspace', 403);
  }

  if (allowedRoles && !allowedRoles.includes(membership.role as WorkspaceRoleType)) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'You do not have permission for this action', 403);
  }

  return membership;
}

export async function assertRoomAccess(userId: string, roomId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new AppError(ERROR_CODES.NOT_FOUND, 'Room not found', 404);

  const membership = await assertWorkspaceAccess(userId, room.workspaceId);
  if (!room.isPrivate || membership.role === 'OWNER') return room;

  const explicitPermission = await prisma.roomPermission.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!membership.allowedRoomIds.includes(roomId) && !explicitPermission?.canView) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'You do not have access to this private room', 403);
  }

  return room;
}

export function requireWorkspaceRole(allowedRoles: WorkspaceRoleType[]) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      const workspaceId =
        req.params.workspaceId ||
        req.body?.workspaceId ||
        (req.query?.workspaceId as string);

      if (!workspaceId) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'workspaceId is required for this operation',
          400
        );
      }

      if (!req.user) {
        throw new AppError(
          ERROR_CODES.UNAUTHORIZED,
          'Authentication required',
          401
        );
      }

      const membership = await assertWorkspaceAccess(req.user.id, workspaceId, allowedRoles);

      req.workspaceMembership = {
        workspaceId: membership.workspaceId,
        role: membership.role as WorkspaceRoleType,
        allowedRoomIds: membership.allowedRoomIds,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
