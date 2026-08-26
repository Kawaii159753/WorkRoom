import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { ERROR_CODES, WorkspaceRoleType } from '../constants/index.js';
import { AuthenticatedRequest } from '../types/index.js';
import { AppError } from './errorHandler.js';

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

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.user.id,
          },
        },
      });

      if (!membership) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          'You are not a member of this workspace',
          403
        );
      }

      if (!allowedRoles.includes(membership.role as WorkspaceRoleType)) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          `Forbidden: Action requires one of the following roles: ${allowedRoles.join(', ')}`,
          403
        );
      }

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
