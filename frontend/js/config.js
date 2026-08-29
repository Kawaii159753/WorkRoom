(function () {
    'use strict';
    var local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    window.WORKROOM_CONFIG = Object.assign({
        apiUrl: local ? 'http://localhost:4000/api/v1' : location.origin + '/api/v1',
        socketUrl: local ? 'http://localhost:4000' : location.origin,
        googleClientId: '', facebookAppId: '',
        // Publish only real, signed installer URLs. Empty values keep the UI
        // from serving placeholder text files as executable downloads.
        downloads: { windows: '', mac: '' }
    }, window.WORKROOM_CONFIG || {});
    window.WORKROOM_API_URL = window.WORKROOM_CONFIG.apiUrl;
    window.WORKROOM_SOCKET_URL = window.WORKROOM_CONFIG.socketUrl;
}());
