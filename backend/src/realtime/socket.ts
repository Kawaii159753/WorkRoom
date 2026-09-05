import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ROLES, WorkspaceRoleType } from '../constants/index.js';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { assertRoomAccess } from '../middleware/workspace.js';
import { logger } from '../utils/logger.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  workspaceRoles?: Map<string, WorkspaceRoleType>;
  cursorWindow?: { startedAt: number; count: number };
}

export function initSocketServer(httpServer: HttpServer) {
  const allowedOrigins = env.CLIENT_URL.split(',').map((value) => value.trim()).filter(Boolean);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    maxHttpBufferSize: 100_000,
  });

  // Authentication Handshake Middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'workroom-api',
        audience: 'workroom-web',
      }) as { userId: string; email: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, email: true } });
      if (!user || user.email !== decoded.email) return next(new Error('Authentication error: Invalid token'));
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      socket.workspaceRoles = new Map();
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected via WebSocket: ${socket.userId} (${socket.id})`);

    // Join Workspace Room with permission verification
    socket.on('workspace:join', async (data: { workspaceId: string }) => {
      try {
        const { workspaceId } = data;
        if (!workspaceId || !socket.userId) return;

        const member = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId,
              userId: socket.userId,
            },
          },
        });

        if (!member) {
          socket.emit('error', { message: 'Unauthorized workspace access' });
          return;
        }

        const roomKey = `workspace:${workspaceId}`;
        socket.workspaceRoles?.set(workspaceId, member.role as WorkspaceRoleType);
        socket.join(roomKey);
        logger.info(`User ${socket.userId} joined socket room: ${roomKey}`);

        // Broadcast presence
        socket.to(roomKey).emit('presence:user_joined', {
          userId: socket.userId,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Error joining workspace socket room:', error);
      }
    });

    // Leave Workspace Room
    socket.on('workspace:leave', (data: { workspaceId: string }) => {
      if (!data?.workspaceId || !socket.rooms.has(`workspace:${data.workspaceId}`)) return;
      const roomKey = `workspace:${data.workspaceId}`;
      socket.workspaceRoles?.delete(data.workspaceId);
      socket.leave(roomKey);
      socket.to(roomKey).emit('presence:user_left', {
        userId: socket.userId,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    // Join Specific Room Channel with access validation
    socket.on('room:join', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        if (!roomId || !socket.userId) return;

        await assertRoomAccess(socket.userId, roomId, 'view');
        const channelKey = `room:${roomId}`;
        socket.join(channelKey);
        logger.info(`User ${socket.userId} joined room channel: ${channelKey}`);

        socket.to(channelKey).emit('presence:room_user_joined', {
          roomId,
          userId: socket.userId,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        socket.emit('error', { message: 'Unauthorized room access' });
      }
    });

    // Leave Specific Room Channel
    socket.on('room:leave', (data: { roomId: string }) => {
      if (!data?.roomId) return;
      const channelKey = `room:${data.roomId}`;
      socket.leave(channelKey);
      socket.to(channelKey).emit('presence:room_user_left', {
        roomId: data.roomId,
        userId: socket.userId,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    // Realtime Cursor / Pointer Position Sync (Targets room channel if joined, otherwise workspace)
    socket.on('cursor:move', (data: { workspaceId: string; roomId?: string; pageId?: string; x: number; y: number }) => {
      if (!data?.workspaceId || !socket.rooms.has(`workspace:${data.workspaceId}`)) return;
      if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return;
      const now = Date.now();
      if (!socket.cursorWindow || now - socket.cursorWindow.startedAt >= 1000) {
        socket.cursorWindow = { startedAt: now, count: 0 };
      }
      socket.cursorWindow.count += 1;
      if (socket.cursorWindow.count > 60) return;

      const targetChannel = data.roomId && socket.rooms.has(`room:${data.roomId}`)
        ? `room:${data.roomId}`
        : `workspace:${data.workspaceId}`;

      socket.to(targetChannel).emit('cursor:updated', {
        userId: socket.userId,
        ...data,
      });
    });

    // Entity Live Updates (Page, Block, Workflow, Room Canvas)
    socket.on('entity:update', (data: { workspaceId: string; roomId?: string; entityType: string; entityId: string; patch: unknown; version: number }) => {
      if (!data?.workspaceId || !socket.rooms.has(`workspace:${data.workspaceId}`)) return;
      const role = socket.workspaceRoles?.get(data.workspaceId);
      if (role !== ROLES.OWNER && role !== ROLES.EDITOR) {
        socket.emit('error', { message: 'Read-only members cannot update workspace entities' });
        return;
      }
      if (typeof data.entityType !== 'string' || data.entityType.length > 50) return;
      if (typeof data.entityId !== 'string' || data.entityId.length > 200) return;
      if (!Number.isInteger(data.version) || data.version < 0) return;
      try {
        if (Buffer.byteLength(JSON.stringify(data.patch), 'utf8') > 50_000) return;
      } catch {
        return;
      }

      const targetChannel = data.roomId && socket.rooms.has(`room:${data.roomId}`)
        ? `room:${data.roomId}`
        : `workspace:${data.workspaceId}`;

      socket.to(targetChannel).emit('entity:changed', {
        actorId: socket.userId,
        ...data,
        occurredAt: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected from WebSocket: ${socket.userId} (${socket.id})`);
    });
  });

  return io;
}
