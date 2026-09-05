(function () {
    'use strict';
    var base = window.WORKROOM_API_URL || ((window.WORKROOM_CONFIG || {}).apiUrl);
    async function request(path, options) {
        if (!base) throw new Error('API_NOT_CONFIGURED');
        var response = await fetch(base + path, Object.assign({ credentials: 'include', headers: { 'Content-Type': 'application/json' } }, options || {}));
        var payload = await response.json().catch(function () { return {}; });
        if (!response.ok) {
            var error = new Error((payload.error && payload.error.message) || 'Cloud request failed');
            error.status = response.status; error.code = payload.error && payload.error.code; throw error;
        }
        return payload.data;
    }
    window.WorkRoomCloud = {
        listWorkspaces: function () { return request('/workspaces', { method: 'GET' }); },
        createWorkspace: function (name) { return request('/workspaces', { method: 'POST', body: JSON.stringify({ name: String(name || 'WorkRoom').slice(0, 100) }) }); },
        getState: function (id) { return request('/workspaces/' + encodeURIComponent(id) + '/state', { method: 'GET' }); },
        saveState: function (id, data, baseVersion, migrationId) { return request('/workspaces/' + encodeURIComponent(id) + '/state', { method: 'PUT', body: JSON.stringify({ data: data, baseVersion: baseVersion, migrationId: migrationId }) }); },
        getRoomState: function (roomId) { return request('/rooms/' + encodeURIComponent(roomId) + '/state', { method: 'GET' }); },
        saveRoomState: function (roomId, data, baseVersion) { return request('/rooms/' + encodeURIComponent(roomId) + '/state', { method: 'PUT', body: JSON.stringify({ data: data, baseVersion: baseVersion }) }); }
    };
}());
