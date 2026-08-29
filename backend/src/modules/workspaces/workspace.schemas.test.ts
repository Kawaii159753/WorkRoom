import { describe, expect, it } from 'vitest';
import { saveWorkspaceStateSchema } from './workspace.schemas.js';

describe('saveWorkspaceStateSchema', () => {
  const workspaceId = '00000000-0000-4000-8000-000000000001';

  it('accepts a bounded JSON workspace snapshot', () => {
    const result = saveWorkspaceStateSchema.safeParse({
      params: { workspaceId }, body: { data: { rooms: {}, ideaPages: [] }, baseVersion: 2 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-JSON values and oversized snapshots', () => {
    expect(saveWorkspaceStateSchema.safeParse({ params: { workspaceId }, body: { data: { value: undefined } } }).success).toBe(false);
    const oversized = 'x'.repeat(5 * 1024 * 1024 + 1);
    expect(saveWorkspaceStateSchema.safeParse({ params: { workspaceId }, body: { data: { oversized } } }).success).toBe(false);
  });
});
