import { Router } from 'express';
import { ROLES } from '../../constants/index.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { requireWorkspaceRole } from '../../middleware/workspace.js';
import { WorkspaceController } from './workspace.controller.js';
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  updateWorkspaceSchema,
} from './workspace.schemas.js';

const router = Router();

// Workspace collection routes
router.get('/', requireAuth, WorkspaceController.list);
router.post('/', requireAuth, validate(createWorkspaceSchema), WorkspaceController.create);

// Workspace specific routes
router.get(
  '/:workspaceId',
  requireAuth,
  requireWorkspaceRole([ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]),
  WorkspaceController.getById
);

router.patch(
  '/:workspaceId',
  requireAuth,
  requireWorkspaceRole([ROLES.OWNER]),
  validate(updateWorkspaceSchema),
  WorkspaceController.update
);

// Member management routes
router.post(
  '/:workspaceId/invites',
  requireAuth,
  requireWorkspaceRole([ROLES.OWNER]),
  validate(inviteMemberSchema),
  WorkspaceController.invite
);

router.patch(
  '/:workspaceId/members/:userId',
  requireAuth,
  requireWorkspaceRole([ROLES.OWNER]),
  validate(updateMemberRoleSchema),
  WorkspaceController.updateMember
);

router.delete(
  '/:workspaceId/members/:userId',
  requireAuth,
  requireWorkspaceRole([ROLES.OWNER]),
  WorkspaceController.removeMember
);

export const workspaceRouter = router;
