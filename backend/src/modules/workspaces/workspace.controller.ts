import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/index.js';
import { sendSuccess } from '../../utils/response.js';
import { WorkspaceService } from './workspace.service.js';

export class WorkspaceController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaces = await WorkspaceService.listUserWorkspaces(req.user!.id);
      return sendSuccess(res, workspaces);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspace = await WorkspaceService.createWorkspace(req.user!.id, req.body);
      return sendSuccess(res, workspace, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const membership = req.workspaceMembership!;
      const workspace = await WorkspaceService.getWorkspaceDetails(req.params.workspaceId, {
        userId: req.user!.id,
        role: membership.role,
        allowedRoomIds: membership.allowedRoomIds,
      });
      return sendSuccess(res, workspace);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspace = await WorkspaceService.updateWorkspace(req.params.workspaceId, req.body);
      return sendSuccess(res, workspace);
    } catch (error) {
      next(error);
    }
  }

  static async getState(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const membership = req.workspaceMembership!;
      return sendSuccess(res, await WorkspaceService.getWorkspaceState(req.params.workspaceId, {
        email: req.user!.email,
        role: membership.role,
        allowedRoomIds: membership.allowedRoomIds,
      }));
    } catch (error) { next(error); }
  }

  static async saveState(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, await WorkspaceService.saveWorkspaceState(
        req.params.workspaceId, req.user!.id, req.body.data, req.body.baseVersion, req.body.migrationId
      ));
    } catch (error) { next(error); }
  }

  static async invite(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email, role, allowedRoomIds } = req.body;
      const member = await WorkspaceService.inviteMember(
        req.params.workspaceId,
        email,
        role,
        allowedRoomIds
      );
      return sendSuccess(res, member, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { role, allowedRoomIds } = req.body;
      const member = await WorkspaceService.updateMemberRole(
        req.params.workspaceId,
        req.params.userId,
        role,
        allowedRoomIds
      );
      return sendSuccess(res, member);
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await WorkspaceService.removeMember(req.params.workspaceId, req.params.userId);
      return sendSuccess(res, { message: 'Member removed successfully' });
    } catch (error) {
      next(error);
    }
  }
}
