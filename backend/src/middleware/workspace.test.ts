import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  workspaceMember: { findUnique: vi.fn() },
  room: { findUnique: vi.fn() },
  roomPermission: { findUnique: vi.fn() },
}));

vi.mock('../config/prisma.js', () => ({ prisma: prismaMock }));

import { assertRoomAccess, assertWorkspaceAccess } from './workspace.js';

describe('workspace authorization', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects users who are not workspace members', async () => {
    prismaMock.workspaceMember.findUnique.mockResolvedValue(null);
    await expect(assertWorkspaceAccess('user-a', 'workspace-b')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects private rooms without explicit access', async () => {
    prismaMock.room.findUnique.mockResolvedValue({ id: 'room-b', workspaceId: 'workspace-b', isPrivate: true });
    prismaMock.workspaceMember.findUnique.mockResolvedValue({
      workspaceId: 'workspace-b', userId: 'user-a', role: 'VIEWER', allowedRoomIds: [],
    });
    prismaMock.roomPermission.findUnique.mockResolvedValue(null);

    await expect(assertRoomAccess('user-a', 'room-b')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows public rooms for workspace members', async () => {
    const room = { id: 'room-a', workspaceId: 'workspace-a', isPrivate: false };
    prismaMock.room.findUnique.mockResolvedValue(room);
    prismaMock.workspaceMember.findUnique.mockResolvedValue({
      workspaceId: 'workspace-a', userId: 'user-a', role: 'VIEWER', allowedRoomIds: [],
    });

    await expect(assertRoomAccess('user-a', 'room-a', 'view')).resolves.toEqual(room);
  });

  it('rejects viewers trying to edit public rooms', async () => {
    const room = { id: 'room-a', workspaceId: 'workspace-a', isPrivate: false };
    prismaMock.room.findUnique.mockResolvedValue(room);
    prismaMock.workspaceMember.findUnique.mockResolvedValue({
      workspaceId: 'workspace-a', userId: 'user-a', role: 'VIEWER', allowedRoomIds: [],
    });

    await expect(assertRoomAccess('user-a', 'room-a', 'edit')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows editors to edit public rooms', async () => {
    const room = { id: 'room-a', workspaceId: 'workspace-a', isPrivate: false };
    prismaMock.room.findUnique.mockResolvedValue(room);
    prismaMock.workspaceMember.findUnique.mockResolvedValue({
      workspaceId: 'workspace-a', userId: 'user-editor', role: 'EDITOR', allowedRoomIds: [],
    });

    await expect(assertRoomAccess('user-editor', 'room-a', 'edit')).resolves.toEqual(room);
  });

  it('rejects users trying to edit private rooms if only canView is granted', async () => {
    const room = { id: 'room-priv', workspaceId: 'workspace-a', isPrivate: true };
    prismaMock.room.findUnique.mockResolvedValue(room);
    prismaMock.workspaceMember.findUnique.mockResolvedValue({
      workspaceId: 'workspace-a', userId: 'user-editor', role: 'EDITOR', allowedRoomIds: [],
    });
    prismaMock.roomPermission.findUnique.mockResolvedValue({
      roomId: 'room-priv', userId: 'user-editor', canView: true, canEdit: false,
    });

    await expect(assertRoomAccess('user-editor', 'room-priv', 'view')).resolves.toEqual(room);
    await expect(assertRoomAccess('user-editor', 'room-priv', 'edit')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows users with canEdit to edit private rooms', async () => {
    const room = { id: 'room-priv', workspaceId: 'workspace-a', isPrivate: true };
    prismaMock.room.findUnique.mockResolvedValue(room);
    prismaMock.workspaceMember.findUnique.mockResolvedValue({
      workspaceId: 'workspace-a', userId: 'user-editor', role: 'EDITOR', allowedRoomIds: [],
    });
    prismaMock.roomPermission.findUnique.mockResolvedValue({
      roomId: 'room-priv', userId: 'user-editor', canView: true, canEdit: true,
    });

    await expect(assertRoomAccess('user-editor', 'room-priv', 'edit')).resolves.toEqual(room);
  });
});
