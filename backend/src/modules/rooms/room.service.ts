import { prisma } from '../../config/prisma.js';
import { ERROR_CODES } from '../../constants/index.js';
import { AppError } from '../../middleware/errorHandler.js';

export class RoomService {
  static async getRoomState(roomId: string) {
    const state = await prisma.roomState.findUnique({
      where: { roomId },
      select: {
        roomId: true,
        data: true,
        version: true,
        updatedAt: true,
        updatedById: true,
      },
    });

    if (!state) {
      return {
        roomId,
        data: {},
        version: 1,
        updatedAt: null,
      };
    }

    return state;
  }

  static async saveRoomState(
    roomId: string,
    userId: string,
    data: unknown,
    baseVersion?: number
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.roomState.findUnique({ where: { roomId } });

      if (current && typeof baseVersion === 'number' && current.version !== baseVersion) {
        throw new AppError(
          ERROR_CODES.CONFLICT,
          'Room content changed on another device. Reload before saving.',
          409
        );
      }

      const payload = data as object;

      if (!current) {
        return tx.roomState.create({
          data: {
            roomId,
            updatedById: userId,
            data: payload,
            version: 1,
          },
        });
      }

      if (typeof baseVersion === 'number') {
        const result = await tx.roomState.updateMany({
          where: { roomId, version: baseVersion },
          data: {
            data: payload,
            updatedById: userId,
            version: { increment: 1 },
          },
        });

        if (result.count !== 1) {
          throw new AppError(
            ERROR_CODES.CONFLICT,
            'Room content changed on another device. Reload before saving.',
            409
          );
        }

        return tx.roomState.findUniqueOrThrow({ where: { roomId } });
      }

      return tx.roomState.update({
        where: { roomId },
        data: {
          data: payload,
          updatedById: userId,
          version: { increment: 1 },
        },
      });
    });
  }
}
