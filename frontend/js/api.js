/**
 * WorkRoom API Client & Realtime Connector
 * Provides unified HTTP REST client and Socket.IO real-time collaboration bindings.
 */

const API_BASE_URL = window.WORKROOM_API_URL || `${window.location.origin}/api/v1`;
const SOCKET_BASE_URL = window.WORKROOM_SOCKET_URL || window.location.origin;

class ApiError extends Error {
  constructor(code, message, status, fieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Core fetch wrapper with credentials and standard error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Include HttpOnly session cookies
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = data.error || {};
      throw new ApiError(
        err.code || 'UNKNOWN_ERROR',
        err.message || `Request failed with status ${res.status}`,
        res.status,
        err.fieldErrors || {}
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or connection error
    throw new ApiError(
      'NETWORK_ERROR',
      'Cannot connect to WorkRoom server. Please check if the backend is running.',
      0
    );
  }
}

// ==========================================
// 1. AUTH API MODULE
// ==========================================
export const authApi = {
  async register({ email, password, displayName, avatarUrl }) {
    return request('/auth/register', {
      method: 'POST',
      body: { email, password, displayName, avatarUrl },
    });
  },

  async login({ email, password }) {
    return request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  async logout() {
    return request('/auth/logout', {
      method: 'POST',
    });
  },

  async getMe() {
    return request('/auth/me', {
      method: 'GET',
    });
  },
};

// ==========================================
// 2. WORKSPACES API MODULE
// ==========================================
export const workspaceApi = {
  async list() {
    const res = await request('/workspaces', { method: 'GET' });
    return res.data;
  },

  async create({ name, description }) {
    const res = await request('/workspaces', {
      method: 'POST',
      body: { name, description },
    });
    return res.data;
  },

  async get(workspaceId) {
    const res = await request(`/workspaces/${workspaceId}`, { method: 'GET' });
    return res.data;
  },

  async update(workspaceId, data) {
    const res = await request(`/workspaces/${workspaceId}`, {
      method: 'PATCH',
      body: data,
    });
    return res.data;
  },

  async inviteMember(workspaceId, { email, role, allowedRoomIds = [] }) {
    const res = await request(`/workspaces/${workspaceId}/invites`, {
      method: 'POST',
      body: { email, role, allowedRoomIds },
    });
    return res.data;
  },

  async updateMemberRole(workspaceId, userId, { role, allowedRoomIds }) {
    const res = await request(`/workspaces/${workspaceId}/members/${userId}`, {
      method: 'PATCH',
      body: { role, allowedRoomIds },
    });
    return res.data;
  },

  async removeMember(workspaceId, userId) {
    const res = await request(`/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    });
    return res.data;
  },
};

// ==========================================
// 3. ROOMS & SECTIONS API MODULE
// ==========================================
export const roomApi = {
  async create({ workspaceId, sectionId, name, icon, isPrivate }) {
    const res = await request('/rooms', {
      method: 'POST',
      body: { workspaceId, sectionId, name, icon, isPrivate },
    });
    return res.data;
  },

  async get(roomId) {
    const res = await request(`/rooms/${roomId}`, { method: 'GET' });
    return res.data;
  },
};

// ==========================================
// 4. WORKFLOWS & TASKS API MODULE
// ==========================================
export const workflowApi = {
  async list({ workspaceId, assignee, status }) {
    const params = new URLSearchParams({ workspaceId });
    if (assignee) params.append('assignee', assignee);
    if (status) params.append('status', status);

    const res = await request(`/workflows?${params.toString()}`, { method: 'GET' });
    return res.data;
  },

  async create({ workspaceId, artifactType, artifactId, title, status, dueDate, assigneeIds }) {
    const res = await request('/workflows', {
      method: 'POST',
      body: { workspaceId, artifactType, artifactId, title, status, dueDate, assigneeIds },
    });
    return res.data;
  },

  async update(workflowId, data) {
    const res = await request(`/workflows/${workflowId}`, {
      method: 'PATCH',
      body: data,
    });
    return res.data;
  },
};

// ==========================================
// 5. COMMENTS & MENTIONS API MODULE
// ==========================================
export const commentApi = {
  async listByWorkflow(workflowId) {
    const res = await request(`/comments/workflow/${workflowId}`, { method: 'GET' });
    return res.data;
  },

  async create({ workspaceId, workflowId, parentCommentId, content, mentionedUserIds }) {
    const res = await request('/comments', {
      method: 'POST',
      body: { workspaceId, workflowId, parentCommentId, content, mentionedUserIds },
    });
    return res.data;
  },

  async resolve(commentId, isResolved = true) {
    const res = await request(`/comments/${commentId}/resolve`, {
      method: 'PATCH',
      body: { isResolved },
    });
    return res.data;
  },
};

// ==========================================
// 6. NOTIFICATIONS API MODULE
// ==========================================
export const notificationApi = {
  async list() {
    const res = await request('/notifications', { method: 'GET' });
    return res.data;
  },

  async markRead(notificationId) {
    const res = await request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    return res.data;
  },

  async markAllRead() {
    const res = await request('/notifications/mark-all-read', {
      method: 'POST',
    });
    return res.data;
  },
};

// ==========================================
// 7. REALTIME SOCKET.IO CLIENT HELPER
// ==========================================
let socketInstance = null;

export function initRealtimeSocket({ onCursorMove, onEntityChange, onUserJoined, onUserLeft } = {}) {
  if (typeof io === 'undefined') {
    console.warn('[Socket.IO] io client script not loaded in page');
    return null;
  }

  if (socketInstance) {
    return socketInstance;
  }

  socketInstance = io(SOCKET_BASE_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });

  socketInstance.on('connect', () => {
    console.log('⚡ Connected to WorkRoom Realtime Server');
  });

  if (onCursorMove) {
    socketInstance.on('cursor:updated', onCursorMove);
  }

  if (onEntityChange) {
    socketInstance.on('entity:changed', onEntityChange);
  }

  if (onUserJoined) {
    socketInstance.on('presence:user_joined', onUserJoined);
  }

  if (onUserLeft) {
    socketInstance.on('presence:user_left', onUserLeft);
  }

  return socketInstance;
}

export function joinWorkspaceRoom(workspaceId) {
  if (socketInstance && workspaceId) {
    socketInstance.emit('workspace:join', { workspaceId });
  }
}

export function leaveWorkspaceRoom(workspaceId) {
  if (socketInstance && workspaceId) {
    socketInstance.emit('workspace:leave', { workspaceId });
  }
}

export function broadcastCursor(workspaceId, x, y) {
  if (socketInstance && workspaceId) {
    socketInstance.emit('cursor:move', { workspaceId, x, y });
  }
}

export function broadcastEntityUpdate(workspaceId, entityType, entityId, patch, version) {
  if (socketInstance && workspaceId) {
    socketInstance.emit('entity:update', { workspaceId, entityType, entityId, patch, version });
  }
}
