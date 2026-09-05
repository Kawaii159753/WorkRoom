/**
 * WorkRoom Team Collaboration, Workspaces & Roles
 */
            // ========== WORKSPACES & TEAM COLLABORATION ==========
            function normalizeEmail(value) {
                return String(value || '').trim().toLowerCase();
            }

            function escapeHtml(value) {
                return String(value == null ? '' : value)
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
            }

            // Keep only the tiny markup subset used by the editor. All event handlers,
            // styles, URLs and unknown elements are discarded before content reaches DOM.
            function sanitizeEditorHtml(value) {
                var template = document.createElement('template');
                template.innerHTML = String(value == null ? '' : value);
                var output = document.createElement('div');
                function copySafe(source, target) {
                    Array.from(source.childNodes).forEach(function (node) {
                        if (node.nodeType === Node.TEXT_NODE) {
                            target.appendChild(document.createTextNode(node.nodeValue || ''));
                            return;
                        }
                        if (node.nodeType !== Node.ELEMENT_NODE) return;
                        var tag = node.tagName.toUpperCase();
                        if (tag === 'BR') { target.appendChild(document.createElement('br')); return; }
                        if (tag === 'B' || tag === 'STRONG') {
                            var bold = document.createElement('b'); copySafe(node, bold); target.appendChild(bold); return;
                        }
                        if (tag === 'SPAN' && node.classList.contains('mention-chip')) {
                            var mention = document.createElement('span');
                            mention.className = 'mention-chip'; mention.contentEditable = 'false';
                            var title = String(node.getAttribute('title') || '').slice(0, 254);
                            if (title) mention.title = title;
                            mention.textContent = String(node.textContent || '').slice(0, 160);
                            target.appendChild(mention); return;
                        }
                        copySafe(node, target);
                    });
                }
                copySafe(template.content, output);
                return output.innerHTML;
            }

            function safeImageSource(value) {
                var source = String(value || '').trim();
                if (/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(source)) return source;
                if (!source.includes('..') && /^(?:\.\/)?assets\/images\/[a-z0-9_./-]+\.(?:png|jpe?g|gif|webp)(?:\?[a-z0-9_.=&-]+)?$/i.test(source)) return source;
                try {
                    var parsed = new URL(source, location.href);
                    return /^https?:$/.test(parsed.protocol) ? parsed.href : '';
                } catch (e) { return ''; }
            }

            function safeExternalUrl(value) {
                try {
                    var parsed = new URL(String(value || '').trim(), location.href);
                    return /^(?:https?):$/.test(parsed.protocol) ? parsed.href : '';
                } catch (e) { return ''; }
            }

            function isAllowedRasterImageFile(file) {
                return !!file && /^(image\/(?:png|jpeg|gif|webp))$/i.test(String(file.type || ''));
            }

            function collaborationKey(email) { return 'workroomCollab:' + normalizeEmail(email); }
            function mailboxKey(email) { return 'workroomMailbox:' + normalizeEmail(email); }
            function workspaceDataKey(id) { return 'workroomWorkspaceData:' + id; }
            function workspaceDirtyKey(id) { return 'workroomCloudDirty:' + id; }

            function readJson(key, fallback) {
                try {
                    var value = JSON.parse(localStorage.getItem(key) || 'null');
                    return value == null ? fallback : value;
                } catch (e) { return fallback; }
            }

            function writeJson(key, value) {
                try { localStorage.setItem(key, JSON.stringify(value)); return true; }
                catch (e) { return false; }
            }

            function getCurrentAccount() {
                var user = currentUser || (typeof getSavedUser === 'function' ? getSavedUser() : null) || {};
                return {
                    name: user.name || user.email || 'สมาชิก',
                    email: normalizeEmail(user.email),
                    picture: user.picture || null
                };
            }

            function workspaceInitial(name) {
                return (String(name || '?').trim().charAt(0) || '?').toUpperCase();
            }

            function announcePendingMentions() {
                if (!readSetting('settings-notifTag', true)) return;
                var pending = notifications.filter(function (item) {
                    return item.type === 'mention' && !item.popupShown;
                });
                if (!pending.length) return;
                var latest = pending[0];
                showToast((latest.fromName || 'สมาชิก') + ' แท็กคุณใน “' + (latest.roomName || 'ห้องทำงาน') + '”');
                playNotificationSound(false);
                pending.forEach(function (item) { item.popupShown = true; });
                var account = getCurrentAccount();
                if (account.email) writeJson(mailboxKey(account.email), notifications);
            }

            function loadMailbox(showMentionPopup) {
                var account = getCurrentAccount();
                notifications = account.email ? readJson(mailboxKey(account.email), []) : [];
                renderNotif();
                updateBellBadge();
                if (showMentionPopup) announcePendingMentions();
            }

            function saveMailbox() {
                var account = getCurrentAccount();
                if (account.email) writeJson(mailboxKey(account.email), notifications);
            }

            function initCollaboration(user) {
                var account = {
                    name: user.name || user.email || 'สมาชิก',
                    email: normalizeEmail(user.email),
                    picture: user.picture || null
                };
                if (!account.email) return;

                var state = readJson(collaborationKey(account.email), null);
                if (!state || !Array.isArray(state.workspaces) || state.workspaces.length === 0) {
                    var ownId = 'workspace-' + btoa(unescape(encodeURIComponent(account.email))).replace(/[^a-z0-9]/gi, '').slice(0, 18);
                    var ownWorkspace = {
                        id: ownId,
                        name: 'พื้นที่ของ ' + account.name,
                        ownerName: account.name,
                        ownerEmail: account.email,
                        icon: DEFAULT_WORKSPACE_ICON,
                        role: 'owner',
                        allowedRoomIds: Object.keys(initialRooms),
                        members: [{ name: account.name, email: account.email, picture: account.picture || null, role: 'owner', joinedAt: Date.now() }]
                    };
                    state = { activeWorkspaceId: ownId, workspaces: [ownWorkspace], outgoingInvites: [] };
                    writeJson(workspaceDataKey(ownId), {
                        rooms: initialRooms,
                        roomPages: initialRoomPages,
                        roomSections: initialRoomSections,
                        ideaPages: initialIdeaPages,
                        activeIdeaPageId: initialIdeaPages[0].id
                    });
                    writeJson(collaborationKey(account.email), state);
                }

                // Keep the first personal workspace consistent for existing users,
                // while preserving every profile image they have chosen themselves.
                var firstWorkspaceIcon = state.workspaces[0] && String(state.workspaces[0].icon || '');
                var usesLegacyDefault = firstWorkspaceIcon.indexOf('assets/images/workroom-default-workspace.png') === 0;
                if (state.workspaces[0] && (!safeImageSource(firstWorkspaceIcon) || usesLegacyDefault)) {
                    state.workspaces[0].icon = DEFAULT_WORKSPACE_ICON;
                    writeJson(collaborationKey(account.email), state);
                }

                collaborationState = state;
                activeWorkspace = state.workspaces.find(function (item) { return item.id === state.activeWorkspaceId; }) || state.workspaces[0];
                collaborationState.activeWorkspaceId = activeWorkspace.id;
                writeJson('workroomPresence:' + account.email, { at: Date.now(), workspaceId: activeWorkspace.id });
                loadMailbox(true);
                loadActiveWorkspaceData();
                renderWorkspaceMenu();
                renderTeamPanel();
                syncRegisteredUsers();
                bootstrapCloudWorkspace(account);
            }

            function workspaceSnapshot() {
                return {
                    rooms: JSON.parse(JSON.stringify(rooms)), roomPages: JSON.parse(JSON.stringify(roomPages)),
                    roomPageCollections: JSON.parse(JSON.stringify(roomPageCollections)), roomSections: JSON.parse(JSON.stringify(roomSections)),
                    roomOrder: roomOrder.slice(), ideaPages: JSON.parse(JSON.stringify(ideaPages)), activeIdeaPageId: activeIdeaPageId
                };
            }

            async function bootstrapCloudWorkspace(account) {
                if (!window.WorkRoomCloud || !activeWorkspace || !account.email || !currentUser || !currentUser.id) return;
                try {
                    var list = await window.WorkRoomCloud.listWorkspaces();
                    var map = readJson('workroomCloudWorkspaceMap', {});
                    var cloud = list.find(function (item) { return item.id === map[activeWorkspace.id]; });
                    if (!cloud) cloud = list.find(function (item) { return item.name === activeWorkspace.name; });
                    if (!cloud) cloud = await window.WorkRoomCloud.createWorkspace(activeWorkspace.name);
                    activeWorkspace.cloudId = cloud.id; map[activeWorkspace.id] = cloud.id;
                    if (cloud && cloud.userRole) {
                        activeWorkspace.role = String(cloud.userRole).toLowerCase();
                        activeWorkspace.userRole = cloud.userRole;
                    }
                    writeJson('workroomCloudWorkspaceMap', map); persistCollaborationState();
                    applyWorkspaceRole();
                    var remote = await window.WorkRoomCloud.getState(cloud.id);
                    var recovery = readJson(workspaceDataKey(activeWorkspace.id), null);
                    var dirty = readJson(workspaceDirtyKey(activeWorkspace.id), null);
                    if (dirty && recovery && remote && dirty.baseVersion === remote.version) {
                        var recovered = await window.WorkRoomCloud.saveState(cloud.id, recovery, remote.version);
                        cloudStateVersion = recovered.version;
                        writeJson(workspaceDataKey(activeWorkspace.id), recovery);
                        loadActiveWorkspaceData();
                    } else if (dirty && recovery && remote) {
                        cloudStateVersion = remote.version;
                        showToast(currentLang === 'en' ? 'A local recovery copy conflicts with newer cloud data. It was kept on this device.' : 'สำเนากู้คืนในเครื่องชนกับข้อมูลใหม่บนคลาวด์ ระบบยังเก็บสำเนาในเครื่องไว้');
                        cloudWorkspaceReady = false;
                        return;
                    } else if (remote && remote.data) {
                        cloudStateVersion = remote.version;
                        writeJson(workspaceDataKey(activeWorkspace.id), remote.data);
                        loadActiveWorkspaceData();
                    } else {
                        var saved = await window.WorkRoomCloud.saveState(cloud.id, workspaceSnapshot(), undefined, 'local-storage-' + activeWorkspace.id + '-v1');
                        cloudStateVersion = saved.version;
                    }
                    cloudWorkspaceReady = true;
                    localStorage.removeItem(workspaceDirtyKey(activeWorkspace.id));
                    localStorage.removeItem(workspaceDataKey(activeWorkspace.id));

                    // Connect realtime socket when cloud workspace is ready
                    if (window.WorkRoomApi && window.WorkRoomApi.initRealtimeSocket) {
                        window.WorkRoomApi.initRealtimeSocket({
                            onCursorMove: typeof handleRemoteCursorMove === 'function' ? handleRemoteCursorMove : undefined,
                            onEntityChange: typeof handleRemoteEntityChange === 'function' ? handleRemoteEntityChange : undefined,
                            onRoomUserJoined: typeof handleRemoteUserJoined === 'function' ? handleRemoteUserJoined : undefined,
                            onRoomUserLeft: typeof handleRemoteUserLeft === 'function' ? handleRemoteUserLeft : undefined,
                        });
                        window.WorkRoomApi.joinWorkspaceRoom(activeWorkspace.cloudId);
                        if (typeof currentRoomId !== 'undefined' && currentRoomId) {
                            window.WorkRoomApi.joinRoomChannel(currentRoomId);
                        }
                    }
                } catch (error) {
                    cloudWorkspaceReady = false;
                    console.warn('[WorkRoom] Cloud storage unavailable; local recovery copy retained.', error && error.message);
                }
            }

            function scheduleCloudSave(snapshot) {
                if (!cloudWorkspaceReady || !activeWorkspace || !activeWorkspace.cloudId || !window.WorkRoomCloud) return;
                if (activeWorkspace.role === 'viewer' || activeWorkspace.userRole === 'VIEWER') return;
                writeJson(workspaceDirtyKey(activeWorkspace.id), { baseVersion: cloudStateVersion, at: Date.now() });
                clearTimeout(cloudSaveTimer);
                cloudSaveTimer = setTimeout(async function () {
                    try {
                        var isOwner = activeWorkspace.role === 'owner' || activeWorkspace.userRole === 'OWNER';
                        if (isOwner) {
                            var saved = await window.WorkRoomCloud.saveState(activeWorkspace.cloudId, snapshot, cloudStateVersion);
                            cloudStateVersion = saved.version;
                        } else if (currentRoomId && window.WorkRoomCloud.saveRoomState) {
                            // Room-scoped save for editors (avoids 403 whole-workspace owner restriction)
                            var roomData = {
                                room: rooms[currentRoomId],
                                page: roomPages[currentRoomId],
                                collections: roomPageCollections[currentRoomId],
                                ideaPages: currentRoomId === 'room-1' ? ideaPages : undefined,
                                activeIdeaPageId: currentRoomId === 'room-1' ? activeIdeaPageId : undefined
                            };
                            await window.WorkRoomCloud.saveRoomState(currentRoomId, roomData);
                        }
                        localStorage.removeItem(workspaceDirtyKey(activeWorkspace.id));
                        localStorage.removeItem(workspaceDataKey(activeWorkspace.id));
                    } catch (error) {
                        cloudWorkspaceReady = false;
                        writeJson(workspaceDataKey(activeWorkspace.id), snapshot);
                        if (error && error.status === 409) showToast(currentLang === 'en' ? 'This workspace changed elsewhere. Reload before editing again.' : 'พื้นที่นี้ถูกแก้จากอุปกรณ์อื่น กรุณาโหลดหน้าใหม่ก่อนแก้ต่อ');
                    }
                }, 900);
            }

            function persistCollaborationState() {
                var account = getCurrentAccount();
                if (account.email && collaborationState) writeJson(collaborationKey(account.email), collaborationState);
            }

            function syncActiveIdeaPageRefs() {
                var page = ideaPages.find(function (item) { return item.id === activeIdeaPageId; }) || ideaPages[0];
                if (!page) {
                    ideaPages = JSON.parse(JSON.stringify(initialIdeaPages));
                    page = ideaPages[0];
                }
                activeIdeaPageId = page.id;
                if (!Array.isArray(page.blocks)) page.blocks = [{ type: 'text', content: '' }];
                if (!Array.isArray(page.strokes)) page.strokes = [];
                ideaDocBlocks = page.blocks;
                wbStrokes = page.strokes;
            }

            function loadActiveWorkspaceData() {
                if (!activeWorkspace) return;
                var stored = readJson(workspaceDataKey(activeWorkspace.id), { rooms: initialRooms, roomPages: initialRoomPages, roomSections: initialRoomSections });
                var allowed = Array.isArray(activeWorkspace.allowedRoomIds) ? activeWorkspace.allowedRoomIds : Object.keys(stored.rooms || {});
                var account = getCurrentAccount();
                rooms = {};
                roomPages = {};
                roomPageCollections = {};
                roomSections = Array.isArray(stored.roomSections) && stored.roomSections.length
                    ? JSON.parse(JSON.stringify(stored.roomSections))
                    : JSON.parse(JSON.stringify(initialRoomSections));
                ideaPages = Array.isArray(stored.ideaPages) && stored.ideaPages.length
                    ? JSON.parse(JSON.stringify(stored.ideaPages))
                    : JSON.parse(JSON.stringify(initialIdeaPages));
                roomOrder = Array.isArray(stored.roomOrder) ? stored.roomOrder.slice() : Object.keys(stored.rooms || {});
                activeIdeaPageId = stored.activeIdeaPageId || ideaPages[0].id;
                syncActiveIdeaPageRefs();
                allowed.forEach(function (id) {
                    if (!stored.rooms || !stored.rooms[id]) return;
                    var room = JSON.parse(JSON.stringify(stored.rooms[id]));
                    if (room.privacy === 'public') room.privacy = 'shared';
                    if (!room.sectionId) room.sectionId = room.privacy === 'private' ? 'section-private' : 'section-main';
                    if (room.privacy === 'private') {
                        room.createdBy = normalizeEmail(room.createdBy || activeWorkspace.ownerEmail);
                        if (room.createdBy !== account.email) return;
                    }
                    rooms[id] = room;
                    if (stored.roomPages && stored.roomPages[id]) roomPages[id] = JSON.parse(JSON.stringify(stored.roomPages[id]));
                    if (stored.roomPageCollections && stored.roomPageCollections[id]) {
                        roomPageCollections[id] = JSON.parse(JSON.stringify(stored.roomPageCollections[id]));
                    }
                });
                Object.keys(rooms).forEach(function (id) { ensureRoomPageCollection(id); });
                var ids = Object.keys(rooms);
                roomOrder = roomOrder.filter(function (id) { return ids.includes(id); });
                ids.forEach(function (id) { if (!roomOrder.includes(id)) roomOrder.push(id); });
                if (ids.length === 0) {
                    rooms['empty-room'] = { name: 'ยังไม่มีห้องที่ได้รับอนุญาต', emoji: '🔐', privacy: 'private', sectionId: 'section-main', createdBy: account.email };
                    roomPages['empty-room'] = { title: 'ยังไม่มีห้องที่เข้าถึงได้', blocks: [{ type: 'text', content: 'ติดต่อเจ้าของพื้นที่เพื่อขอสิทธิ์เข้าถึงห้อง' }] };
                    ids = ['empty-room'];
                }
                currentRoomId = ids.includes(currentRoomId) ? currentRoomId : ids[0];
                renderWorkspaceRooms();
                applyWorkspaceRole();
                renderEditor();
            }

            function saveActiveWorkspaceData() {
                if (!activeWorkspace || !['owner', 'editor'].includes(activeWorkspace.role)) return;
                var stored = readJson(workspaceDataKey(activeWorkspace.id), { rooms: {}, roomPages: {}, roomSections: [] });
                if (!stored.roomPageCollections) stored.roomPageCollections = {};
                Object.keys(rooms).forEach(function (id) {
                    if (id === 'empty-room') return;
                    stored.rooms[id] = rooms[id];
                    stored.roomPages[id] = roomPages[id];
                    if (roomPageCollections[id]) stored.roomPageCollections[id] = roomPageCollections[id];
                });
                stored.roomSections = roomSections;
                stored.roomOrder = roomOrder.filter(function (id) { return id !== 'empty-room' && rooms[id]; });
                stored.ideaPages = ideaPages;
                stored.activeIdeaPageId = activeIdeaPageId;
                writeJson(workspaceDataKey(activeWorkspace.id), stored);
                scheduleCloudSave(workspaceSnapshot());
            }

            function scheduleWorkspaceSave() {
                clearTimeout(collaborationSaveTimer);
                collaborationSaveTimer = setTimeout(function () {
                    collaborationSaveTimer = null;
                    if ('requestIdleCallback' in window) requestIdleCallback(saveActiveWorkspaceData, { timeout: 1200 });
                    else saveActiveWorkspaceData();
                }, 700);
            }

            window.addEventListener('pagehide', function () {
                if (collaborationSaveTimer) {
                    clearTimeout(collaborationSaveTimer);
                    collaborationSaveTimer = null;
                    saveActiveWorkspaceData();
                }
            });

            function renderWorkspaceRooms() {
                var container = document.getElementById('sidebarContent');
                if (!container) return;
                var canCreate = activeWorkspace && ['owner', 'editor'].includes(activeWorkspace.role);
                var createLabel = currentLang === 'en' ? 'Create new room' : 'สร้างห้องใหม่';
                var createButtonTitle = canCreate ? createLabel : (currentLang === 'en' ? 'View-only access' : 'คุณมีสิทธิ์ดูอย่างเดียว');
                var html = '<button class="create-room-btn" onclick="openCreateItemModal()"' + (canCreate ? '' : ' disabled') + ' title="' + createButtonTitle + '">' + createLabel + '</button>';
                html += '<div class="page-history-header"><span>' + (currentLang === 'en' ? 'All pages' : 'หน้าทั้งหมด') + '</span></div>';
                html += '<div id="pageHistoryList"></div>';
                container.innerHTML = html;
                renderPageHistory();
            }

            function applyWorkspaceRole() {
                var readonly = !activeWorkspace || activeWorkspace.role === 'viewer';
                document.getElementById('mainApp').toggleAttribute('data-workspace-readonly', readonly);
                document.querySelectorAll('#editorContainer [contenteditable]').forEach(function (el) { el.contentEditable = readonly ? 'false' : 'true'; });
                var title = document.getElementById('pageTitle');
                if (title) title.readOnly = readonly;
                var canvas = document.getElementById('ideaCanvas');
                if (canvas) canvas.style.pointerEvents = readonly ? 'none' : '';
                var toolbar = document.getElementById('ideaToolbar');
                if (readonly && toolbar) {
                    toolbar.style.display = 'none';
                    closeIdeaToolbar();
                }
            }

            function toggleWorkspaceMenu(event) {
                if (event) event.stopPropagation();
                var menu = document.getElementById('workspaceMenu');
                var button = document.getElementById('workspaceSwitcher');
                var open = !menu.classList.contains('show');
                menu.classList.toggle('show', open);
                button.setAttribute('aria-expanded', String(open));
                if (!open) workspaceProfileTargetId = null;
                renderWorkspaceMenu();
            }

            function renderWorkspaceMenu() {
                if (!collaborationState || !activeWorkspace) return;
                var activeName = workspaceDisplayName(activeWorkspace);
                document.getElementById('workspaceName').textContent = activeName;
                document.getElementById('workspaceMark').innerHTML = workspaceMarkHtml(activeWorkspace);
                var switcher = document.getElementById('workspaceSwitcher');
                if (switcher) {
                    switcher.title = uiText('wrWorkspacePrefix') + ': ' + activeName;
                    switcher.setAttribute('aria-label', uiText('wrCurrentWorkspace') + ' ' + activeName);
                }
                document.getElementById('teamPanelWorkspace').textContent = activeName;
                document.getElementById('workspaceList').innerHTML = collaborationState.workspaces.map(function (workspace) {
                    var role = workspace.role === 'owner' ? uiText('wrYourWorkspace') : (workspace.role === 'editor' ? uiText('wrCanEdit') : uiText('wrViewOnly'));
                    var editing = workspaceProfileTargetId === workspace.id;
                    var displayName = workspaceDisplayName(workspace);
                    return '<div class="workspace-option-row' + (editing ? ' editing' : '') + '"><button class="workspace-option' + (workspace.id === activeWorkspace.id ? ' active' : '') + '" onclick="switchWorkspace(\'' + escapeHtml(workspace.id) + '\')">'
                        + '<span class="workspace-option-mark">' + workspaceMarkHtml(workspace) + '</span><span class="workspace-option-copy">'
                        + '<span class="workspace-option-name">' + escapeHtml(displayName) + '</span><span class="workspace-option-role">' + role + '</span></span></button>'
                        + (workspace.role === 'owner' ? '<button class="workspace-edit-button" onclick="toggleWorkspaceProfileOptions(event,\'' + escapeHtml(workspace.id) + '\')" aria-expanded="' + String(editing) + '" title="' + escapeHtml(uiText('wrEditServer')) + '" aria-label="' + escapeHtml(uiText('wrEditServer') + ' ' + displayName) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>' : '')
                        + (editing ? '<div class="workspace-edit-panel"><button class="workspace-profile-action" onclick="chooseWorkspaceProfileImage(event,\'' + escapeHtml(workspace.id) + '\')">📷 ' + escapeHtml(uiText('wrChangeServerProfile')) + '</button></div>' : '')
                        + '</div>';
                }).join('');
            }

            function toggleWorkspaceProfileOptions(event, workspaceId) {
                event.preventDefault(); event.stopPropagation();
                var workspace = collaborationState && collaborationState.workspaces.find(function (item) { return item.id === workspaceId; });
                if (!workspace || workspace.role !== 'owner') return;
                workspaceProfileTargetId = workspaceProfileTargetId === workspaceId ? null : workspaceId;
                renderWorkspaceMenu();
            }

            function chooseWorkspaceProfileImage(event, workspaceId) {
                event.preventDefault(); event.stopPropagation();
                workspaceProfileTargetId = workspaceId;
                document.getElementById('workspaceProfileInput').click();
            }

            function workspaceMarkHtml(workspace) {
                var icon = workspace && safeImageSource(workspace.icon);
                var fallbackIcon = safeImageSource(DEFAULT_WORKSPACE_ICON);
                return icon
                    ? '<img src="' + escapeHtml(icon) + '" alt="" onerror="this.onerror=null;this.src=\'' + escapeHtml(fallbackIcon) + '\'">'
                    : escapeHtml(workspaceInitial(workspace ? workspace.name : 'W'));
            }

            function changeWorkspaceProfile(event) {
                var input = event.target;
                var file = input.files && input.files[0];
                input.value = '';
                var targetWorkspace = collaborationState && collaborationState.workspaces.find(function (item) { return item.id === workspaceProfileTargetId; });
                if (!targetWorkspace || targetWorkspace.role !== 'owner') return showToast('เฉพาะเจ้าของเซิร์ฟเวอร์เท่านั้น');
                if (!isAllowedRasterImageFile(file)) return showToast('รองรับเฉพาะรูป PNG, JPEG, GIF หรือ WebP');
                if (file.size > 5 * 1024 * 1024) return showToast('รูปภาพต้องมีขนาดไม่เกิน 5 MB');
                var reader = new FileReader();
                reader.onload = function (loadEvent) {
                    var image = new Image();
                    image.onload = function () {
                        var canvas = document.createElement('canvas');
                        canvas.width = 256; canvas.height = 256;
                        var ctx = canvas.getContext('2d');
                        var side = Math.min(image.naturalWidth, image.naturalHeight);
                        var sx = (image.naturalWidth - side) / 2, sy = (image.naturalHeight - side) / 2;
                        ctx.drawImage(image, sx, sy, side, side, 0, 0, 256, 256);
                        pendingWorkspaceProfile = {
                            workspaceId: targetWorkspace.id,
                            image: canvas.toDataURL('image/webp', .86)
                        };
                        var workspaceProfilePreview = document.getElementById('workspaceProfilePreview');
                        workspaceProfilePreview.src = pendingWorkspaceProfile.image;
                        workspaceProfilePreview.hidden = false;
                        document.getElementById('workspaceProfileConfirmName').textContent = targetWorkspace.name;
                        document.getElementById('workspaceMenu').classList.remove('show');
                        document.getElementById('workspaceSwitcher').setAttribute('aria-expanded', 'false');
                        openModal('workspaceProfileConfirmModal');
                    };
                    image.onerror = function () { showToast('ไม่สามารถอ่านไฟล์รูปภาพนี้ได้'); };
                    image.src = loadEvent.target.result;
                };
                reader.readAsDataURL(file);
            }

            function cancelWorkspaceProfileChange() {
                pendingWorkspaceProfile = null;
                workspaceProfileTargetId = null;
                var workspaceProfilePreview = document.getElementById('workspaceProfilePreview');
                workspaceProfilePreview.removeAttribute('src');
                workspaceProfilePreview.hidden = true;
                closeModal('workspaceProfileConfirmModal');
            }

            function confirmWorkspaceProfileChange() {
                if (!pendingWorkspaceProfile || !collaborationState) return cancelWorkspaceProfileChange();
                var targetWorkspace = collaborationState.workspaces.find(function (item) { return item.id === pendingWorkspaceProfile.workspaceId; });
                if (!targetWorkspace || targetWorkspace.role !== 'owner') return cancelWorkspaceProfileChange();
                targetWorkspace.icon = pendingWorkspaceProfile.image;
                if (activeWorkspace && activeWorkspace.id === targetWorkspace.id) activeWorkspace.icon = targetWorkspace.icon;
                persistCollaborationState();
                syncWorkspaceProfileToMembers(targetWorkspace, targetWorkspace.icon);
                pendingWorkspaceProfile = null;
                workspaceProfileTargetId = null;
                closeModal('workspaceProfileConfirmModal');
                renderWorkspaceMenu();
                showToast('บันทึกโปรไฟล์เซิร์ฟเวอร์แล้ว');
            }

            function syncWorkspaceProfileToMembers(sourceWorkspace, icon) {
                if (!sourceWorkspace || sourceWorkspace.role !== 'owner') return;
                (sourceWorkspace.members || []).forEach(function (member) {
                    var email = normalizeEmail(member.email);
                    if (!email || email === getCurrentAccount().email) return;
                    var state = readJson(collaborationKey(email), null);
                    if (!state || !Array.isArray(state.workspaces)) return;
                    var workspace = state.workspaces.find(function (item) { return item.id === sourceWorkspace.id; });
                    if (workspace) {
                        workspace.icon = icon;
                        writeJson(collaborationKey(email), state);
                    }
                });
            }

            function switchWorkspace(id) {
                if (!collaborationState) return;
                saveActiveWorkspaceData();
                var next = collaborationState.workspaces.find(function (item) { return item.id === id; });
                if (!next) return;
                activeWorkspace = next;
                cloudWorkspaceReady = false;
                cloudStateVersion = null;
                workspaceProfileTargetId = null;
                collaborationState.activeWorkspaceId = id;
                persistCollaborationState();
                document.getElementById('workspaceMenu').classList.remove('show');
                document.getElementById('workspaceSwitcher').setAttribute('aria-expanded', 'false');
                loadActiveWorkspaceData();
                renderWorkspaceMenu();
                renderTeamPanel();
                syncRegisteredUsers();
                bootstrapCloudWorkspace(getCurrentAccount());
                showToast('เปลี่ยนเป็น ' + next.name + ' แล้ว');
            }

            function isMemberOnline(member) {
                var account = getCurrentAccount();
                if (normalizeEmail(member.email) === account.email) return true;
                var presence = readJson('workroomPresence:' + normalizeEmail(member.email), null);
                return !!(presence && Date.now() - presence.at < 5 * 60 * 1000 && presence.workspaceId === activeWorkspace.id);
            }

            function renderTeamPanel() {
                if (!activeWorkspace) return;
                var members = Array.isArray(activeWorkspace.members) ? activeWorkspace.members : [];
                var online = members.filter(isMemberOnline);
                var offline = members.filter(function (member) { return !isMemberOnline(member); });
                var renderMember = function (member) {
                    var onlineNow = isMemberOnline(member);
                    var roleLabel = member.role === 'owner' ? uiText('wrOwner') : (member.role === 'editor' ? uiText('wrEditor') : uiText('wrViewer'));
                    return '<div class="team-member"><div class="team-member-avatar">' + escapeHtml(workspaceInitial(member.name || member.email))
                        + '<span class="presence-dot' + (onlineNow ? ' online' : '') + '"></span></div><div class="team-member-copy">'
                        + '<div class="team-member-name">' + escapeHtml(member.name || member.email) + '</div><div class="team-member-status">'
                        + (onlineNow ? uiText('wrOnline') : uiText('wrOffline')) + '</div></div><span class="team-role">' + roleLabel + '</span></div>';
                };
                var html = '<div class="team-section-label"><span>' + escapeHtml(uiText('wrOnline')) + '</span><span>' + online.length + '</span></div>' + online.map(renderMember).join('');
                if (offline.length) html += '<div class="team-section-label" style="margin-top:12px"><span>' + escapeHtml(uiText('wrOffline')) + '</span><span>' + offline.length + '</span></div>' + offline.map(renderMember).join('');
                document.getElementById('teamMemberList').innerHTML = html || '<div class="team-empty">' + escapeHtml(uiText('wrNoMembers')) + '</div>';
                document.getElementById('teamMemberCount').textContent = members.length + ' ' + uiText('wrMemberUnit');
                document.getElementById('teamPanelWorkspace').textContent = workspaceDisplayName(activeWorkspace);
                var inviteButton = document.getElementById('openInviteButton');
                inviteButton.style.display = activeWorkspace.role === 'owner' ? 'block' : 'none';
            }

            function toggleTeamPanel(event) {
                if (event) event.stopPropagation();
                var panel = document.getElementById('teamPanel');
                var button = document.getElementById('teamButton');
                var open = !panel.classList.contains('show');
                panel.classList.toggle('show', open);
                button.setAttribute('aria-expanded', String(open));
                if (open) renderTeamPanel();
            }

            function closeTeamPanel() {
                document.getElementById('teamPanel').classList.remove('show');
                document.getElementById('teamButton').setAttribute('aria-expanded', 'false');
            }

            function openInviteDialog() {
                if (!activeWorkspace || activeWorkspace.role !== 'owner') return;
                document.getElementById('inviteEmail').value = '';
                document.getElementById('inviteRoomList').innerHTML = Object.keys(rooms).filter(function (id) {
                    return id !== 'empty-room' && rooms[id].privacy !== 'private';
                }).map(function (id) {
                    return '<label class="room-permission-item"><input type="checkbox" value="' + escapeHtml(id) + '" checked><span>'
                        + escapeHtml((rooms[id].emoji || '📁') + ' ' + workroomRoomName(id)) + '</span></label>';
                }).join('');
                closeTeamPanel();
                openModal('inviteModal');
                setTimeout(function () { document.getElementById('inviteEmail').focus(); }, 50);
            }

            function sendTeamInvite() {
                var account = getCurrentAccount();
                var targetEmail = normalizeEmail(document.getElementById('inviteEmail').value);
                if (!/^\S+@\S+\.\S+$/.test(targetEmail)) return showToast('กรุณาใส่อีเมลให้ถูกต้อง');
                if (targetEmail === account.email) return showToast('ไม่สามารถเชิญอีเมลของตัวเองได้');
                var allowedRoomIds = Array.from(document.querySelectorAll('#inviteRoomList input:checked')).map(function (input) { return input.value; });
                if (allowedRoomIds.length === 0) return showToast('กรุณาเลือกอย่างน้อย 1 ห้อง');
                var existingMember = (activeWorkspace.members || []).some(function (member) { return normalizeEmail(member.email) === targetEmail; });
                if (existingMember) return showToast('อีเมลนี้เป็นสมาชิกอยู่แล้ว');

                saveActiveWorkspaceData();
                var invite = {
                    id: 'invite-' + Date.now(), type: 'team_invite', status: 'pending', read: false,
                    fromName: account.name, fromEmail: account.email, targetEmail: targetEmail,
                    workspaceId: activeWorkspace.id, workspaceName: activeWorkspace.name,
                    workspaceIcon: activeWorkspace.icon || '',
                    allowedRoomIds: allowedRoomIds, role: document.getElementById('inviteRole').value,
                    createdAt: Date.now(), time: 'เมื่อกี้'
                };
                var targetMailbox = readJson(mailboxKey(targetEmail), []);
                var duplicate = targetMailbox.some(function (item) { return item.type === 'team_invite' && item.workspaceId === invite.workspaceId && item.status === 'pending'; });
                if (duplicate) return showToast('มีคำเชิญที่รอการตอบรับสำหรับอีเมลนี้แล้ว');
                targetMailbox.unshift(invite);
                writeJson(mailboxKey(targetEmail), targetMailbox);
                collaborationState.outgoingInvites = collaborationState.outgoingInvites || [];
                collaborationState.outgoingInvites.push(invite);
                persistCollaborationState();
                closeModal('inviteModal');
                showToast('ส่งคำเชิญไปยัง ' + targetEmail + ' แล้ว');
            }

            function respondToInvite(id, accept) {
                var invite = notifications.find(function (item) { return item.id === id && item.type === 'team_invite'; });
                if (!invite || invite.status !== 'pending') return;
                var account = getCurrentAccount();
                invite.status = accept ? 'accepted' : 'declined';
                invite.read = true;

                if (accept) {
                    var exists = collaborationState.workspaces.some(function (workspace) { return workspace.id === invite.workspaceId; });
                    if (!exists) {
                        var ownerState = readJson(collaborationKey(invite.fromEmail), null);
                        var ownerWorkspace = ownerState && ownerState.workspaces.find(function (workspace) { return workspace.id === invite.workspaceId; });
                        var members = ownerWorkspace && Array.isArray(ownerWorkspace.members) ? ownerWorkspace.members.slice() : [
                            { name: invite.fromName, email: invite.fromEmail, role: 'owner', joinedAt: invite.createdAt }
                        ];
                        members = members.filter(function (member) { return normalizeEmail(member.email) !== account.email; });
                        members.push({ name: account.name, email: account.email, picture: account.picture || null, role: invite.role, joinedAt: Date.now() });
                        collaborationState.workspaces.push({
                            id: invite.workspaceId, name: invite.workspaceName, ownerName: invite.fromName,
                            ownerEmail: invite.fromEmail, role: invite.role, allowedRoomIds: invite.allowedRoomIds, members: members,
                            icon: (ownerWorkspace && ownerWorkspace.icon) || invite.workspaceIcon || ''
                        });

                        if (ownerWorkspace) {
                            ownerWorkspace.members = members;
                            writeJson(collaborationKey(invite.fromEmail), ownerState);
                        }
                    }
                    collaborationState.activeWorkspaceId = invite.workspaceId;
                    persistCollaborationState();
                    saveMailbox();
                    activeWorkspace = collaborationState.workspaces.find(function (workspace) { return workspace.id === invite.workspaceId; });
                    loadActiveWorkspaceData();
                    renderWorkspaceMenu();
                    renderTeamPanel();
                    syncRegisteredUsers();
                    showToast('เข้าร่วม ' + invite.workspaceName + ' แล้ว');
                } else {
                    saveMailbox();
                    showToast('ปฏิเสธคำเชิญแล้ว');
                }
                renderNotif();
                updateBellBadge();
            }

            function syncRegisteredUsers() {
                registeredUsers = activeWorkspace && Array.isArray(activeWorkspace.members)
                    ? activeWorkspace.members.map(function (member) { return { name: member.name || member.email, email: member.email, picture: member.picture || null }; })
                    : [];
            }
