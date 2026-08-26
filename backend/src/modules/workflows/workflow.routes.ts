import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { ERROR_CODES, ROLES, WORKFLOW_STATUS } from '../../constants/index.js';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errorHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireWorkspaceRole } from '../../middleware/workspace.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

const createWorkflowSchema = z.object({
  body: z.object({
    workspaceId: z.string().uuid(),
    artifactType: z.enum(['POSTIT_BLOCK', 'IDEA', 'FILE', 'CUSTOM_TASK']),
    artifactId: z.string(),
    title: z.string().min(1),
    status: z.enum([WORKFLOW_STATUS.REVIEW, WORKFLOW_STATUS.REVISION, WORKFLOW_STATUS.APPROVED]).default(WORKFLOW_STATUS.REVIEW),
    dueDate: z.string().optional().transform((d) => (d ? new Date(d) : undefined)),
    assigneeIds: z.array(z.string().uuid()).default([]),
  }),
});

const updateWorkflowSchema = z.object({
  params: z.object({
    workflowId: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    status: z.enum([WORKFLOW_STATUS.REVIEW, WORKFLOW_STATUS.REVISION, WORKFLOW_STATUS.APPROVED]).optional(),
    dueDate: z.string().nullable().optional().transform((d) => (d ? new Date(d) : d === null ? null : undefined)),
    assigneeIds: z.array(z.string().uuid()).optional(),
  }),
});

// List workflows in workspace / filter by assignee
router.get(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, assignee, status } = req.query;

      if (!workspaceId || typeof workspaceId !== 'string') {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'workspaceId query param is required', 400);
      }

      const whereClause: Record<string, unknown> = {
        workspaceId,
      };

      if (status && typeof status === 'string') {
        whereClause.status = status;
      }

      if (assignee === 'me') {
        whereClause.assignees = {
          some: {
            userId: req.user!.id,
          },
        };
      }

      const workflows = await prisma.workflow.findMany({
        where: whereClause,
        include: {
          createdBy: {
            select: { id: true, displayName: true, email: true, avatarUrl: true },
          },
          assignees: {
            include: {
              user: {
                select: { id: true, displayName: true, email: true, avatarUrl: true },
              },
            },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return sendSuccess(res, workflows);
    } catch (error) {
      next(error);
    }
  }
);

// Create workflow
router.post(
  '/',
  requireAuth,
  validate(createWorkflowSchema),
  requireWorkspaceRole([ROLES.OWNER, ROLES.EDITOR]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, artifactType, artifactId, title, status, dueDate, assigneeIds } = req.body;

      const workflow = await prisma.workflow.create({
        data: {
          workspaceId,
          artifactType,
          artifactId,
          title,
          status,
          dueDate,
          createdById: req.user!.id,
          assignees: {
            create: assigneeIds.map((userId: string) => ({ userId })),
          },
        },
        include: {
          assignees: {
            include: { user: { select: { id: true, displayName: true, email: true, avatarUrl: true } } },
          },
        },
      });

      return sendSuccess(res, workflow, 201);
    } catch (error) {
      next(error);
    }
  }
);

// Update workflow (Status change, Title, DueDate, Assignees)
router.patch(
  '/:workflowId',
  requireAuth,
  validate(updateWorkflowSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workflowId } = req.params;
      const { title, status, dueDate, assigneeIds } = req.body;

      const existing = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!existing) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Workflow not found', 404);
      }

      // If updating status, log activity
      const updated = await prisma.$transaction(async (tx) => {
        if (assigneeIds) {
          await tx.workflowAssignee.deleteMany({ where: { workflowId } });
          await tx.workflowAssignee.createMany({
            data: assigneeIds.map((userId: string) => ({ workflowId, userId })),
          });
        }

        const resWorkflow = await tx.workflow.update({
          where: { id: workflowId },
          data: {
            ...(title ? { title } : {}),
            ...(status ? { status, version: { increment: 1 } } : {}),
            ...(dueDate !== undefined ? { dueDate } : {}),
          },
          include: {
            assignees: {
              include: { user: { select: { id: true, displayName: true, email: true, avatarUrl: true } } },
            },
          },
        });

        if (status && status !== existing.status) {
          await tx.activityLog.create({
            data: {
              workspaceId: existing.workspaceId,
              actorId: req.user!.id,
              action: `STATUS_CHANGED_TO_${status}`,
              entityType: 'WORKFLOW',
              entityId: workflowId,
              metadata: {
                previousStatus: existing.status,
                newStatus: status,
              },
            },
          });
        }

        return resWorkflow;
      });

      return sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }
);

export const workflowRouter = router;
