import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { ERROR_CODES } from '../../constants/index.js';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errorHandler.js';
import { validate } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

const createCommentSchema = z.object({
  body: z.object({
    workspaceId: z.string().uuid(),
    workflowId: z.string().uuid(),
    parentCommentId: z.string().uuid().optional(),
    content: z.string().min(1, 'Comment content cannot be empty'),
    mentionedUserIds: z.array(z.string().uuid()).default([]),
  }),
});

// List comments for a workflow
router.get(
  '/workflow/:workflowId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workflowId } = req.params;

      const comments = await prisma.comment.findMany({
        where: { workflowId, parentCommentId: null },
        include: {
          author: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
          resolvedBy: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
          replies: {
            include: {
              author: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return sendSuccess(res, comments);
    } catch (error) {
      next(error);
    }
  }
);

// Post comment / reply
router.post(
  '/',
  requireAuth,
  validate(createCommentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, workflowId, parentCommentId, content, mentionedUserIds } = req.body;

      const comment = await prisma.$transaction(async (tx) => {
        const newComment = await tx.comment.create({
          data: {
            workspaceId,
            workflowId,
            parentCommentId,
            content,
            authorId: req.user!.id,
          },
          include: {
            author: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
          },
        });

        // Trigger notifications for mentioned users
        if (mentionedUserIds.length > 0) {
          await tx.notification.createMany({
            data: mentionedUserIds
              .filter((uid: string) => uid !== req.user!.id)
              .map((uid: string) => ({
                recipientId: uid,
                actorId: req.user!.id,
                workspaceId,
                type: 'MENTION',
                entityType: 'COMMENT',
                entityId: newComment.id,
              })),
          });
        }

        return newComment;
      });

      return sendSuccess(res, comment, 201);
    } catch (error) {
      next(error);
    }
  }
);

// Resolve / Reopen comment
router.patch(
  '/:commentId/resolve',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const { isResolved } = req.body;

      const comment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          isResolved: Boolean(isResolved),
          resolvedAt: isResolved ? new Date() : null,
          resolvedById: isResolved ? req.user!.id : null,
        },
        include: {
          author: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
          resolvedBy: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
        },
      });

      return sendSuccess(res, comment);
    } catch (error) {
      next(error);
    }
  }
);

export const commentRouter = router;
