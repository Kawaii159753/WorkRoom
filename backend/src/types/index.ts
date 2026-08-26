import { Request } from 'express';
import { WorkspaceRoleType } from '../constants/index.js';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  workspaceMembership?: {
    workspaceId: string;
    role: WorkspaceRoleType;
    allowedRoomIds: string[];
  };
}
