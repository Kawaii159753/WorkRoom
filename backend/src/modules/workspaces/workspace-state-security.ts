import { ROLES, WorkspaceRoleType } from '../../constants/index.js';

export type WorkspaceStateViewer = {
  email: string;
  role: WorkspaceRoleType;
  allowedRoomIds: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Filter the legacy whole-workspace JSON document at the authorization boundary. */
export function filterWorkspaceStateForViewer(data: unknown, viewer: WorkspaceStateViewer): unknown {
  if (viewer.role === ROLES.OWNER || !isRecord(data)) return data;

  const rooms = isRecord(data.rooms) ? data.rooms : {};
  const explicitlyAllowed = new Set(viewer.allowedRoomIds);
  const email = viewer.email.trim().toLowerCase();
  const allowedRoomIds = Object.keys(rooms).filter((roomId) => {
    const room = rooms[roomId];
    if (!isRecord(room)) return false;
    const privacy = String(room.privacy ?? 'shared').toLowerCase();
    const createdBy = String(room.createdBy ?? '').trim().toLowerCase();
    return privacy !== 'private' || explicitlyAllowed.has(roomId) || (createdBy !== '' && createdBy === email);
  });
  const allowed = new Set(allowedRoomIds);
  const pickAllowed = (value: unknown) => {
    if (!isRecord(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([roomId]) => allowed.has(roomId)));
  };

  const filtered: Record<string, unknown> = {
    ...data,
    rooms: pickAllowed(rooms),
    roomPages: pickAllowed(data.roomPages),
    roomPageCollections: pickAllowed(data.roomPageCollections),
    roomOrder: Array.isArray(data.roomOrder)
      ? data.roomOrder.filter((roomId): roomId is string => typeof roomId === 'string' && allowed.has(roomId))
      : [],
  };

  if (!allowed.has('room-1')) {
    filtered.ideaPages = [];
    delete filtered.activeIdeaPageId;
  }

  return filtered;
}
