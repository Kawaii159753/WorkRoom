import { describe, expect, it } from 'vitest';
import { filterWorkspaceStateForViewer } from './workspace-state-security.js';

const state = {
  rooms: {
    'room-1': { name: 'Ideas', privacy: 'shared' },
    publicRoom: { name: 'Team', privacy: 'public' },
    ownPrivate: { name: 'Mine', privacy: 'private', createdBy: 'viewer@example.com' },
    permittedPrivate: { name: 'Allowed', privacy: 'private', createdBy: 'owner@example.com' },
    hiddenPrivate: { name: 'Secret', privacy: 'private', createdBy: 'owner@example.com' },
  },
  roomPages: {
    'room-1': { blocks: ['ideas'] },
    publicRoom: { blocks: ['shared'] },
    ownPrivate: { blocks: ['mine'] },
    permittedPrivate: { blocks: ['allowed'] },
    hiddenPrivate: { blocks: ['secret'] },
  },
  roomPageCollections: {
    hiddenPrivate: { pages: ['secret'] },
    publicRoom: { pages: ['shared'] },
  },
  roomOrder: ['room-1', 'hiddenPrivate', 'publicRoom', 'ownPrivate', 'permittedPrivate'],
  ideaPages: [{ id: 'idea-1' }],
};

describe('filterWorkspaceStateForViewer', () => {
  it('removes unauthorized private room content for non-owners', () => {
    const result = filterWorkspaceStateForViewer(state, {
      email: 'viewer@example.com',
      role: 'VIEWER',
      allowedRoomIds: ['permittedPrivate'],
    }) as typeof state;

    expect(Object.keys(result.rooms)).toEqual(['room-1', 'publicRoom', 'ownPrivate', 'permittedPrivate']);
    expect(result.roomPages.hiddenPrivate).toBeUndefined();
    expect(result.roomPageCollections.hiddenPrivate).toBeUndefined();
    expect(result.roomOrder).not.toContain('hiddenPrivate');
  });

  it('does not filter owners', () => {
    expect(filterWorkspaceStateForViewer(state, {
      email: 'owner@example.com',
      role: 'OWNER',
      allowedRoomIds: [],
    })).toBe(state);
  });
});
