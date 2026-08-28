import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

// List notifications for current user
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user!.id },
      include: {
        actor: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return sendSuccess(res, notifications);
  } catch (error) {
    next(error);
  }
});

// Mark as read
router.patch(
  '/:notificationId/read',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { notificationId } = req.params;

      const notification = await prisma.notification.update({
        where: { id: notificationId, recipientId: req.user!.id },
        data: { readAt: new Date() },
      });

      return sendSuccess(res, notification);
    } catch (error) {
      next(error);
    }
  }
);

// Mark all as read
router.post(
  '/mark-all-read',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await prisma.notification.updateMany({
        where: { recipientId: req.user!.id, readAt: null },
        data: { readAt: new Date() },
      });

      return sendSuccess(res, { message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
);

export const notificationRouter = router;
