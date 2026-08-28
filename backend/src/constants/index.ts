export const ROLES = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;

export type WorkspaceRoleType = (typeof ROLES)[keyof typeof ROLES];

export const WORKFLOW_STATUS = {
  REVIEW: 'REVIEW',
  REVISION: 'REVISION',
  APPROVED: 'APPROVED',
} as const;

export type WorkflowStatusType = (typeof WORKFLOW_STATUS)[keyof typeof WORKFLOW_STATUS];

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
