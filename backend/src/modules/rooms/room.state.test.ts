import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => {
  const mockTx = {
    roomState: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  };
  return {
    roomState: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
    _mockTx: mockTx,
  };
});

vi.mock('../../config/prisma.js', () => ({ prisma: prismaMock }));

import { RoomService } from './room.service.js';

describe('RoomService State Management & Concurrency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRoomState', () => {
    it('returns empty default state if room state does not exist', async () => {
      prismaMock.roomState.findUnique.mockResolvedValue(null);

      const res = await RoomService.getRoomState('room-123');
      expect(res).toEqual({
        roomId: 'room-123',
        data: {},
        version: 1,
        updatedAt: null,
      });
    });

    it('returns existing room state', async () => {
      const existing = {
        roomId: 'room-123',
        data: { blocks: ['b1', 'b2'] },
        version: 3,
        updatedAt: new Date('2026-09-01T12:00:00Z'),
        updatedById: 'user-1',
      };
      prismaMock.roomState.findUnique.mockResolvedValue(existing);

      const res = await RoomService.getRoomState('room-123');
      expect(res).toEqual(existing);
    });
  });

  describe('saveRoomState with Optimistic Concurrency Control', () => {
    it('creates new room state when no state exists yet', async () => {
      prismaMock._mockTx.roomState.findUnique.mockResolvedValue(null);
      const created = {
        roomId: 'room-123',
        updatedById: 'user-1',
        data: { canvas: 'test' },
        version: 1,
      };
      prismaMock._mockTx.roomState.create.mockResolvedValue(created);

      const result = await RoomService.saveRoomState('room-123', 'user-1', { canvas: 'test' });
      expect(prismaMock._mockTx.roomState.create).toHaveBeenCalledWith({
        data: {
          roomId: 'room-123',
          updatedById: 'user-1',
          data: { canvas: 'test' },
          version: 1,
        },
      });
      expect(result).toEqual(created);
    });

    it('rejects update with 409 Conflict if baseVersion does not match current version', async () => {
      prismaMock._mockTx.roomState.findUnique.mockResolvedValue({
        roomId: 'room-123',
        version: 5,
        data: {},
      });

      await expect(
        RoomService.saveRoomState('room-123', 'user-1', { canvas: 'stale' }, 4)
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'CONFLICT',
      });
    });

    it('updates state and increments version when baseVersion matches', async () => {
      prismaMock._mockTx.roomState.findUnique.mockResolvedValue({
        roomId: 'room-123',
        version: 5,
        data: {},
      });
      prismaMock._mockTx.roomState.updateMany.mockResolvedValue({ count: 1 });
      const updated = {
        roomId: 'room-123',
        version: 6,
        data: { canvas: 'fresh' },
        updatedById: 'user-1',
      };
      prismaMock._mockTx.roomState.findUniqueOrThrow.mockResolvedValue(updated);

      const result = await RoomService.saveRoomState(
        'room-123',
        'user-1',
        { canvas: 'fresh' },
        5
      );

      expect(prismaMock._mockTx.roomState.updateMany).toHaveBeenCalledWith({
        where: { roomId: 'room-123', version: 5 },
        data: {
          data: { canvas: 'fresh' },
          updatedById: 'user-1',
          version: { increment: 1 },
        },
      });
      expect(result).toEqual(updated);
    });
  });
});
