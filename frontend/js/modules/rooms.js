/**
 * WorkRoom Rooms, Sections & Page Navigation
 */
            // ========== ROOMS ==========
            function resetRoomEditorViewport() {
                window.requestAnimationFrame(function () {
                    ['.idea-sheet', '#normalEditor', '#postitLibrary'].forEach(function (selector) {
                        var scroller = document.querySelector(selector);
                        if (scroller) scroller.scrollTop = 0;
                    });
                });
            }

            function switchRoom(roomId, el) {
                toggleMobileSidebar(false);
                setMobileRoomFocus(true);
                saveActiveWorkspaceData();
                currentRoomId = roomId;
                document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
                if (el) el.classList.add('active');
                let roomName = rooms[roomId] ? rooms[roomId].name : 'ไม่มีชื่อ';
                let breadcrumb = document.getElementById('headerBreadcrumb');
                if (breadcrumb) breadcrumb.innerHTML = escapeHtml(roomName) + ' <span>/</span> ' + escapeHtml(workroomSystemText('ไม่มีชื่อ'));
                renderEditor();
                resetRoomEditorViewport();
                renderPageHistory();
                applyWorkspaceRole();
            }

            function toggleMobileSidebar(forceOpen) {
                var app = document.getElementById('mainApp');
                if (!app) return;
                var shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !app.classList.contains('mobile-sidebar-open');
                app.classList.toggle('mobile-sidebar-open', shouldOpen);
                var toggle = app.querySelector('.mobile-sidebar-toggle');
                if (toggle) toggle.setAttribute('aria-expanded', String(shouldOpen));
            }

            function setMobileRoomFocus(isFocused) {
                var app = document.getElementById('mainApp');
                if (!app) return;
                var isMobile = window.matchMedia('(max-width: 720px), (max-height: 620px) and (max-width: 900px)').matches;
                app.classList.toggle('mobile-room-focus', isMobile && isFocused);
                var toggle = app.querySelector('.mobile-sidebar-toggle');
                if (!toggle) return;
                toggle.textContent = '☰';
                toggle.setAttribute('aria-label', 'เปิดเมนูห้อง');
            }

            window.addEventListener('resize', function () {
                if (!window.matchMedia('(max-width: 720px), (max-height: 620px) and (max-width: 900px)').matches) setMobileRoomFocus(false);
            });

            function openCreateItemModal() {
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                document.querySelector('input[name="createItemType"][value="room"]').checked = true;
                document.querySelector('input[name="newRoomPrivacy"][value="shared"]').checked = true;
                document.getElementById('newRoomName').value = '';
                setCreateItemType('room');
                renderCreateSectionOptions();
                openModal('roomModal');
                setTimeout(function () { document.getElementById('newRoomName').focus(); }, 50);
            }

            /* ===== Pages inside the Idea room ===== */
            function createIdeaPage() {
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                saveActiveWorkspaceData();
                var newPage = {
                    id: 'idea-page-' + Date.now(),
                    title: 'หน้ากระดาษใหม่',
                    blocks: [{ type: 'text', content: '' }],
                    strokes: [],
                    createdAt: Date.now()
                };
                ideaPages.push(newPage);
                activeIdeaPageId = newPage.id;
                syncActiveIdeaPageRefs();
                currentRoomId = 'room-1';
                saveActiveWorkspaceData();
                renderPageHistory();
                renderEditor();
                showToast('📄 สร้างกระดาษใหม่แล้ว');
                setTimeout(function () {
                    renderIdeaPageTabs();
                    focusIdeaBlock(0, true);
                    var activeTab = document.querySelector('.idea-page-tab.active');
                    if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                }, 140);
            }

            function toolbarNewPageAction() {
                if (currentRoomId === 'room-1') return createIdeaPage();
                if (isPostitRoomId(currentRoomId)) return showToast('ห้องโปสต์อิทไม่ใช้หน้ากระดาษสำหรับเขียน');
                createRoomPage();
            }

            function isPostitRoomId(roomId) {
                if (roomId === 'room-2' || roomId === 'room-3') return true;
                var name = rooms[roomId] ? String(rooms[roomId].name || '') : '';
                return name.includes('โปสต์') && (name.includes('ของฉัน') || name.includes('ทีม'));
            }

            function ensureRoomPageCollection(roomId) {
                if (!roomId || roomId === 'room-1' || isPostitRoomId(roomId)) return null;
                var collection = roomPageCollections[roomId];
                if (!collection || !Array.isArray(collection.pages) || !collection.pages.length) {
                    var source = roomPages[roomId] || { title: (rooms[roomId] && rooms[roomId].name) || 'หน้ากระดาษใหม่', blocks: [{ type: 'text', content: '' }] };
                    var firstId = 'room-page-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
                    collection = roomPageCollections[roomId] = {
                        activePageId: firstId,
                    pages: [{ id: firstId, title: source.title, blocks: source.blocks || [{ type: 'text', content: '' }], strokes: Array.isArray(source.strokes) ? source.strokes : [], createdAt: Date.now() }]
                    };
                }
                var active = collection.pages.find(function (page) { return page.id === collection.activePageId; }) || collection.pages[0];
                collection.activePageId = active.id;
                roomPages[roomId] = active;
                return collection;
            }

            function createRoomPage() {
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                var collection = ensureRoomPageCollection(currentRoomId);
                if (!collection) return;
                var page = { id: 'room-page-' + Date.now(), title: 'หน้ากระดาษใหม่', blocks: [{ type: 'text', content: '' }], strokes: [], createdAt: Date.now() };
                collection.pages.push(page);
                collection.activePageId = page.id;
                roomPages[currentRoomId] = page;
                saveActiveWorkspaceData();
                renderEditor();
                showToast('สร้างหน้ากระดาษใหม่แล้ว');
                setTimeout(function () { document.getElementById('pageTitle').focus(); }, 50);
            }

            function switchRoomPage(pageId) {
                var collection = ensureRoomPageCollection(currentRoomId);
                if (!collection || !collection.pages.some(function (page) { return page.id === pageId; })) return;
                collection.activePageId = pageId;
                roomPages[currentRoomId] = collection.pages.find(function (page) { return page.id === pageId; });
                saveActiveWorkspaceData();
                renderEditor();
                resetRoomEditorViewport();
            }

            function deleteRoomPage(event, pageId) {
                if (event) { event.preventDefault(); event.stopPropagation(); }
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                var collection = ensureRoomPageCollection(currentRoomId);
                if (!collection || collection.pages.length <= 1) return;
                var index = collection.pages.findIndex(function (page) { return page.id === pageId; });
                if (index === -1) return;
                collection.pages.splice(index, 1);
                if (collection.activePageId === pageId) {
                    collection.activePageId = collection.pages[Math.min(index, collection.pages.length - 1)].id;
                }
                roomPages[currentRoomId] = collection.pages.find(function (page) { return page.id === collection.activePageId; });
                saveActiveWorkspaceData();
                renderEditor();
                showToast('ลบหน้ากระดาษแล้ว');
            }

            function renderNormalPageTabs() {
                var container = document.getElementById('normalPageTabs');
                if (!container || currentRoomId === 'room-1' || isPostitRoomId(currentRoomId)) return;
                var collection = ensureRoomPageCollection(currentRoomId);
                if (!collection) return;
                var canDelete = collection.pages.length > 1 && (!activeWorkspace || activeWorkspace.role !== 'viewer');
                container.innerHTML = collection.pages.map(function (page) {
                    var active = page.id === collection.activePageId;
                    var displayTitle = workroomSystemText(page.title);
                    return '<div class="idea-page-tab-wrap"><button class="idea-page-tab' + (active ? ' active' : '') + '" role="tab" aria-selected="' + String(active) + '" title="' + escapeHtml(displayTitle) + '" onclick="switchRoomPage(\'' + escapeHtml(page.id) + '\')">' + escapeHtml(displayTitle) + '</button>'
                        + (canDelete ? '<button class="idea-page-tab-close" onclick="deleteRoomPage(event,\'' + escapeHtml(page.id) + '\')" title="'+(currentLang === 'en' ? 'Delete page' : 'ลบหน้ากระดาษ')+'" aria-label="'+(currentLang === 'en' ? 'Delete page ' : 'ลบหน้ากระดาษ ') + escapeHtml(displayTitle) + '">×</button>' : '') + '</div>';
                }).join('');
            }

            function switchIdeaPage(pageId) {
                if (!ideaPages.some(function (page) { return page.id === pageId; })) return;
                activeIdeaPageId = pageId;
                syncActiveIdeaPageRefs();
                renderIdeaPageTabs();
                renderIdeaBlocks();
                renderWhiteboard();
                resetRoomEditorViewport();
                saveActiveWorkspaceData();
            }

            function renderIdeaPageTabs() {
                var container = document.getElementById('ideaPageTabs');
                if (!container) return;
                container.innerHTML = ideaPages.map(function (page) {
                    var active = page.id === activeIdeaPageId;
                    var canDelete = ideaPages.length > 1 && (!activeWorkspace || activeWorkspace.role !== 'viewer');
                    var displayTitle = workroomSystemText(page.title);
                    return '<div class="idea-page-tab-wrap"><button class="idea-page-tab' + (active ? ' active' : '') + '" role="tab"'
                        + ' aria-selected="' + String(active) + '" title="' + escapeHtml(displayTitle) + '"'
                        + ' onclick="switchIdeaPage(\'' + escapeHtml(page.id) + '\')">'
                        + escapeHtml(displayTitle) + '</button>'
                        + (canDelete ? '<button class="idea-page-tab-close" onclick="deleteIdeaPage(event,\'' + escapeHtml(page.id) + '\')" title="' + (currentLang === 'en' ? 'Delete page' : 'ลบหน้ากระดาษ') + '" aria-label="' + (currentLang === 'en' ? 'Delete page ' : 'ลบหน้ากระดาษ ') + escapeHtml(displayTitle) + '">×</button>' : '')
                        + '</div>';
                }).join('');
            }

            function renderPageHistory() {
                var container = document.getElementById('pageHistoryList');
                if (!container) return;

                var allIds = Object.keys(rooms).filter(function (id) { return id !== 'empty-room'; });
                allIds.sort(function (a, b) {
                    var ai = roomOrder.indexOf(a), bi = roomOrder.indexOf(b);
                    if (ai === -1 && bi === -1) return (rooms[a].createdAt || 0) - (rooms[b].createdAt || 0);
                    if (ai === -1) return 1;
                    if (bi === -1) return -1;
                    return ai - bi;
                });

                if (allIds.length === 0) {
                    container.innerHTML = '<div style="padding:8px 10px;color:#555;font-size:12px;">ยังไม่มีหน้า</div>';
                    return;
                }

                function roomItemHtml(id) {
                    var room = rooms[id];
                    var isActive = id === currentRoomId;
                    var canReorder = !activeWorkspace || ['owner', 'editor'].includes(activeWorkspace.role);
                    var displayName = workroomRoomName(id);
                    return '<div class="page-history-item' + (isActive ? ' active' : '') + '" draggable="' + String(canReorder) + '" data-room="' + escapeHtml(id) + '" role="button" tabindex="0" title="' + (canReorder ? (currentLang === 'en' ? 'Drag to reorder rooms' : 'ลากเพื่อจัดลำดับห้อง') : escapeHtml(displayName)) + '" onclick="switchPage(\'' + escapeHtml(id) + '\',this)" onkeydown="handleKeyboardClick(event,this)">'
                        + '<div class="page-history-icon">' + escapeHtml(room.emoji || '📄') + '</div>'
                        + '<div class="page-history-copy"><div class="page-history-name">' + escapeHtml(displayName) + '</div></div>'
                        + '<button class="page-history-edit" onclick="openRoomEdit(event,\'' + escapeHtml(id) + '\')" title="' + (currentLang === 'en' ? 'Edit room' : 'แก้ไขห้อง') + '" aria-label="' + (currentLang === 'en' ? 'Edit room ' : 'แก้ไขห้อง ') + escapeHtml(displayName) + '">'
                        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'
                        + '</div>';
                }

                var html = '<div class="page-history-list">';
                var renderedIds = [];
                roomSections.forEach(function (section) {
                    var sectionIds = allIds.filter(function (id) { return rooms[id].sectionId === section.id; });
                    renderedIds = renderedIds.concat(sectionIds);
                    html += '<section class="page-history-group" data-section="' + escapeHtml(section.id) + '">'
                        + '<div class="page-history-group-title" oncontextmenu="openSectionContext(event,\'' + escapeHtml(section.id) + '\')" title="' + (currentLang === 'en' ? 'Right-click to manage section' : 'คลิกขวาเพื่อจัดการหัวข้อ') + '">' + escapeHtml(workroomSystemText(section.name)) + '</div>'
                        + (sectionIds.length ? sectionIds.map(roomItemHtml).join('') : '<div class="page-history-group-empty">' + (currentLang === 'en' ? 'Drag rooms here' : 'ลากห้องมาวางที่นี่ได้') + '</div>')
                        + '</section>';
                });
                var ungroupedIds = allIds.filter(function (id) { return !renderedIds.includes(id); });
                if (ungroupedIds.length) {
                    html += '<section class="page-history-group" data-section="">'
                        + '<div class="page-history-group-title">ห้องอื่น ๆ</div>' + ungroupedIds.map(roomItemHtml).join('') + '</section>';
                }
                html += '</div>';
                container.innerHTML = html;
            }

            function switchPage(pageId, el) {
                if (Date.now() < suppressRoomClickUntil) return;
                toggleMobileSidebar(false);
                setMobileRoomFocus(true);
                saveActiveWorkspaceData();
                currentRoomId = pageId;
                document.querySelectorAll('.page-history-item').forEach(function (item) { item.classList.remove('active'); });
                if (el) el.classList.add('active');
                renderEditor();
                applyWorkspaceRole();
            }

            function deletePage(pageId) {
                if (!rooms[pageId]) return;
                var deletedName = rooms[pageId].name;
                removeRoomAccessForAll(pageId);

                if (activeWorkspace) {
                    var stored = readJson(workspaceDataKey(activeWorkspace.id), { rooms: {}, roomPages: {}, roomSections: [] });
                    if (stored.rooms) delete stored.rooms[pageId];
                    if (stored.roomPages) delete stored.roomPages[pageId];
                    if (stored.roomPageCollections) delete stored.roomPageCollections[pageId];
                    writeJson(workspaceDataKey(activeWorkspace.id), stored);
                }
                delete rooms[pageId];
                delete roomPages[pageId];
                delete roomPageCollections[pageId];
                roomOrder = roomOrder.filter(function (id) { return id !== pageId; });
                if (currentRoomId === pageId) {
                    var remaining = Object.keys(rooms).filter(function (id) { return id !== 'empty-room'; });
                    currentRoomId = remaining.length ? remaining[0] : 'empty-room';
                }
                if (Object.keys(rooms).filter(function (id) { return id !== 'empty-room'; }).length === 0) {
                    var account = getCurrentAccount();
                    rooms['empty-room'] = { name: 'ยังไม่มีห้อง', emoji: '🔐', privacy: 'private', sectionId: 'section-main', createdBy: account.email };
                    roomPages['empty-room'] = { title: 'ยังไม่มีห้อง', blocks: [{ type: 'text', content: 'สร้างห้องใหม่เพื่อเริ่มทำงาน' }] };
                    currentRoomId = 'empty-room';
                }
                persistCollaborationState();
                saveActiveWorkspaceData();
                renderWorkspaceRooms();
                renderEditor();
                applyWorkspaceRole();
                showToast('🗑️ ลบห้อง "' + deletedName + '" แล้ว');
            }

            function setCreateItemType(type) {
                var roomMode = type === 'room';
                document.getElementById('createRoomOptions').hidden = !roomMode;
                document.getElementById('newItemNameLabel').textContent = roomMode ? (currentLang==='en'?'Room name':'ชื่อห้องทำงาน') : (currentLang==='en'?'Section name':'ชื่อหัวข้อห้อง');
                document.getElementById('newRoomName').placeholder = roomMode ? (currentLang==='en'?'e.g. Project plan':'เช่น แผนงานโปรเจกต์') : (currentLang==='en'?'e.g. Design team':'เช่น งานฝ่ายออกแบบ');
                if (!roomMode) closeCreateSectionMenu();
            }

            function renderCreateSectionOptions() {
                var input = document.getElementById('newRoomSection');
                var selected = roomSections.find(function (section) { return section.id === input.value; }) || roomSections[0];
                if (!selected) {
                    input.value = '';
                    document.getElementById('createSectionText').textContent = currentLang==='en'?'No sections yet':'ยังไม่มีหัวข้อ';
                    document.getElementById('createSectionMenu').innerHTML = '';
                    return;
                }
                input.value = selected.id;
                document.getElementById('createSectionText').textContent = workroomSystemText(selected.name);
                document.getElementById('createSectionMenu').innerHTML = roomSections.map(function (section) {
                    return '<button type="button" class="create-select-option" role="option" data-value="' + escapeHtml(section.id)
                        + '" aria-selected="' + (section.id === selected.id ? 'true' : 'false')
                        + '" onclick="selectCreateSection(this.dataset.value,true)" onkeydown="handleCreateSectionOptionKeydown(event)">'
                        + escapeHtml(workroomSystemText(section.name)) + '</button>';
                }).join('');
            }

            function toggleCreateSectionMenu(event) {
                if (event) event.stopPropagation();
                var menu = document.getElementById('createSectionMenu');
                var trigger = document.getElementById('createSectionTrigger');
                var open = !menu.classList.contains('show');
                menu.classList.toggle('show', open);
                trigger.setAttribute('aria-expanded', String(open));
            }

            function closeCreateSectionMenu() {
                var menu = document.getElementById('createSectionMenu');
                var trigger = document.getElementById('createSectionTrigger');
                if (menu) menu.classList.remove('show');
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
            }

            function selectCreateSection(value, focusTrigger) {
                var selected = roomSections.find(function (section) { return section.id === value; });
                if (!selected) return;
                document.getElementById('newRoomSection').value = selected.id;
                document.getElementById('createSectionText').textContent = selected.name;
                renderCreateSectionOptions();
                closeCreateSectionMenu();
                if (focusTrigger) document.getElementById('createSectionTrigger').focus();
            }

            function focusCreateSectionOption(direction) {
                var options = Array.from(document.querySelectorAll('#createSectionMenu .create-select-option'));
                if (!options.length) return;
                var current = document.activeElement;
                var index = options.indexOf(current);
                if (index === -1) {
                    index = options.findIndex(function (option) { return option.getAttribute('aria-selected') === 'true'; });
                }
                index = direction === 'last' ? options.length - 1 : direction === 'first' ? 0
                    : (index + direction + options.length) % options.length;
                options[index].focus();
            }

            function handleCreateSectionKeydown(event) {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    var menu = document.getElementById('createSectionMenu');
                    menu.classList.add('show');
                    document.getElementById('createSectionTrigger').setAttribute('aria-expanded', 'true');
                    setTimeout(function () { focusCreateSectionOption(event.key === 'ArrowDown' ? 1 : -1); }, 0);
                } else if (event.key === 'Escape') {
                    closeCreateSectionMenu();
                }
            }

            function handleCreateSectionOptionKeydown(event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectCreateSection(event.currentTarget.dataset.value, true);
                } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    focusCreateSectionOption(event.key === 'ArrowDown' ? 1 : -1);
                } else if (event.key === 'Home' || event.key === 'End') {
                    event.preventDefault();
                    focusCreateSectionOption(event.key === 'Home' ? 'first' : 'last');
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    closeCreateSectionMenu();
                    document.getElementById('createSectionTrigger').focus();
                }
            }

            function propagateSharedRoomAccess(roomId) {
                if (!activeWorkspace || !Array.isArray(activeWorkspace.members)) return;
                activeWorkspace.members.forEach(function (member) {
                    var memberEmail = normalizeEmail(member.email);
                    var memberState = readJson(collaborationKey(memberEmail), null);
                    if (!memberState || !Array.isArray(memberState.workspaces)) return;
                    var workspace = memberState.workspaces.find(function (item) { return item.id === activeWorkspace.id; });
                    if (!workspace) return;
                    workspace.allowedRoomIds = Array.isArray(workspace.allowedRoomIds) ? workspace.allowedRoomIds : [];
                    if (!workspace.allowedRoomIds.includes(roomId)) workspace.allowedRoomIds.push(roomId);
                    writeJson(collaborationKey(memberEmail), memberState);
                    if (memberEmail === getCurrentAccount().email) collaborationState = memberState;
                });
            }

            function updateRoomVisibilityAccess(roomId, privacy) {
                if (!activeWorkspace || !Array.isArray(activeWorkspace.members)) return;
                var account = getCurrentAccount();
                activeWorkspace.allowedRoomIds = Array.isArray(activeWorkspace.allowedRoomIds) ? activeWorkspace.allowedRoomIds : [];
                if (!activeWorkspace.allowedRoomIds.includes(roomId)) activeWorkspace.allowedRoomIds.push(roomId);

                activeWorkspace.members.forEach(function (member) {
                    var memberEmail = normalizeEmail(member.email);
                    if (!memberEmail || memberEmail === account.email) return;
                    var memberState = readJson(collaborationKey(memberEmail), null);
                    if (!memberState || !Array.isArray(memberState.workspaces)) return;
                    var workspace = memberState.workspaces.find(function (item) { return item.id === activeWorkspace.id; });
                    if (!workspace) return;
                    workspace.allowedRoomIds = Array.isArray(workspace.allowedRoomIds) ? workspace.allowedRoomIds : [];
                    if (privacy === 'shared') {
                        if (!workspace.allowedRoomIds.includes(roomId)) workspace.allowedRoomIds.push(roomId);
                    } else {
                        workspace.allowedRoomIds = workspace.allowedRoomIds.filter(function (id) { return id !== roomId; });
                    }
                    writeJson(collaborationKey(memberEmail), memberState);
                });
                persistCollaborationState();
            }

            function removeRoomAccessForAll(roomId) {
                if (!activeWorkspace) return;
                activeWorkspace.allowedRoomIds = Array.isArray(activeWorkspace.allowedRoomIds)
                    ? activeWorkspace.allowedRoomIds.filter(function (id) { return id !== roomId; })
                    : [];
                (activeWorkspace.members || []).forEach(function (member) {
                    var memberEmail = normalizeEmail(member.email);
                    if (!memberEmail || memberEmail === getCurrentAccount().email) return;
                    var memberState = readJson(collaborationKey(memberEmail), null);
                    if (!memberState || !Array.isArray(memberState.workspaces)) return;
                    var workspace = memberState.workspaces.find(function (item) { return item.id === activeWorkspace.id; });
                    if (!workspace) return;
                    workspace.allowedRoomIds = Array.isArray(workspace.allowedRoomIds)
                        ? workspace.allowedRoomIds.filter(function (id) { return id !== roomId; })
                        : [];
                    writeJson(collaborationKey(memberEmail), memberState);
                });
            }

            function createRoom() {
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                var typeInput = document.querySelector('input[name="createItemType"]:checked');
                var itemType = typeInput ? typeInput.value : 'room';
                var name = document.getElementById('newRoomName').value.trim();
                if (!name) return showToast(itemType === 'section' ? 'กรุณาใส่ชื่อหัวข้อ' : 'กรุณาใส่ชื่อห้อง');

                if (itemType === 'section') {
                    roomSections.push({ id: 'section-' + Date.now(), name: name });
                    closeModal('roomModal');
                    scheduleWorkspaceSave();
                    renderWorkspaceRooms();
                    showToast('สร้างหัวข้อห้องแล้ว');
                    return;
                }

                var privacyInput = document.querySelector('input[name="newRoomPrivacy"]:checked');
                var privacy = privacyInput ? privacyInput.value : 'shared';
                var sectionId = document.getElementById('newRoomSection').value || (roomSections[0] && roomSections[0].id);
                var account = getCurrentAccount();
                var newId = 'room-' + Date.now();
                rooms[newId] = {
                    name: name,
                    emoji: privacy === 'private' ? '🔒' : '📁',
                    privacy: privacy,
                    sectionId: sectionId,
                    createdBy: account.email
                };
                roomOrder.push(newId);
                roomPages[newId] = { title: name, blocks: [{ type: 'text', content: '' }] };
                ensureRoomPageCollection(newId);
                if (activeWorkspace && Array.isArray(activeWorkspace.allowedRoomIds) && !activeWorkspace.allowedRoomIds.includes(newId)) {
                    activeWorkspace.allowedRoomIds.push(newId);
                }
                if (privacy === 'shared') propagateSharedRoomAccess(newId);
                persistCollaborationState();
                saveActiveWorkspaceData();
                closeModal('roomModal');
                currentRoomId = newId;
                renderWorkspaceRooms();
                renderEditor();
                showToast(privacy === 'private' ? 'สร้างห้องส่วนตัวแล้ว' : 'สร้างห้องที่ใช้ร่วมกันแล้ว');
            }

            function openRoomEdit(e, roomId) {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                if (!rooms[roomId] || roomId === 'empty-room') return;
                contextRoomId = roomId;
                document.getElementById('renameInput').value = rooms[roomId].name;
                var privacy = rooms[roomId].privacy === 'private' ? 'private' : 'shared';
                var privacyInput = document.querySelector('input[name="editRoomPrivacy"][value="' + privacy + '"]');
                if (privacyInput) privacyInput.checked = true;
                openModal('renameModal');
                setTimeout(function () {
                    var input = document.getElementById('renameInput');
                    input.focus();
                    input.select();
                }, 50);
            }

            function selectEditRoomPrivacy(value) {
                var input = document.querySelector('input[name="editRoomPrivacy"][value="' + value + '"]');
                if (input) input.checked = true;
            }

            function deleteRoomFromEdit() {
                if (!contextRoomId) return;
                var roomId = contextRoomId;
                deletePage(roomId);
                if (!rooms[roomId]) {
                    closeModal('renameModal');
                    contextRoomId = null;
                }
            }

            function confirmRename() {
                let newName = document.getElementById('renameInput').value.trim();
                if (!newName) return showToast('กรุณาใส่ชื่อห้อง');
                if (!contextRoomId || !rooms[contextRoomId]) return;
                var room = rooms[contextRoomId];
                var oldPrivacy = room.privacy === 'private' ? 'private' : 'shared';
                var privacyInput = document.querySelector('input[name="editRoomPrivacy"]:checked');
                var newPrivacy = privacyInput ? privacyInput.value : oldPrivacy;
                room.name = newName;

                if (newPrivacy !== oldPrivacy) {
                    if (newPrivacy === 'private') {
                        room.sharedEmoji = room.emoji === '🔒' ? (room.sharedEmoji || '📁') : room.emoji;
                        room.emoji = '🔒';
                        room.createdBy = getCurrentAccount().email;
                        room.sectionId = 'section-private';
                    } else {
                        room.emoji = room.sharedEmoji || '📁';
                        if (room.sectionId === 'section-private') room.sectionId = 'section-main';
                    }
                    room.privacy = newPrivacy;
                    updateRoomVisibilityAccess(contextRoomId, newPrivacy);
                }

                saveActiveWorkspaceData();
                renderWorkspaceRooms();
                renderEditor();
                if (currentRoomId === contextRoomId) {
                    var breadcrumb = document.getElementById('headerBreadcrumb');
                    if (breadcrumb) breadcrumb.innerHTML = escapeHtml(newName) + ' <span>/</span> ไม่มีชื่อ';
                }
                closeModal('renameModal');
                showToast(newPrivacy === 'private' ? 'บันทึกแล้ว · ห้องนี้เป็นส่วนตัว' : 'บันทึกแล้ว · สมาชิกที่มีสิทธิ์สามารถเห็นห้องนี้');
                contextRoomId = null;
            }

            function confirmEmoji() {
                let newEmoji = document.getElementById('emojiInput').value.trim();
                if (!newEmoji) return showToast('กรุณาใส่อิโมจิ');
                if (!contextRoomId) return;
                rooms[contextRoomId].emoji = newEmoji;
                let item = document.querySelector('[data-room="' + contextRoomId + '"]');
                if (item) item.querySelector('.room-emoji').textContent = newEmoji;
                closeModal('emojiModal');
                showToast('เปลี่ยนอิโมจิสำเร็จ');
                contextRoomId = null;
            }

            // ========== DRAG & DROP ROOMS ==========
            function initDragAndDrop() {
                let sidebar = document.getElementById('sidebarContent');
                sidebar.addEventListener('dragstart', e => {
                    let item = e.target.closest('.page-history-item, .sidebar-item');
                    if (!item) return;
                    if (e.target.closest('button')) { e.preventDefault(); return; }
                    if (activeWorkspace && activeWorkspace.role === 'viewer') { e.preventDefault(); return; }
                    draggedRoomId = item.dataset.room;
                    item.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', draggedRoomId);
                });
                sidebar.addEventListener('dragend', e => {
                    let item = e.target.closest('.page-history-item, .sidebar-item');
                    if (item) item.classList.remove('dragging');
                    sidebar.querySelectorAll('.drop-before,.drop-after').forEach(function (el) { el.classList.remove('drop-before', 'drop-after'); });
                    sidebar.querySelectorAll('.page-history-group.drag-target').forEach(function (el) { el.classList.remove('drag-target'); });
                    suppressRoomClickUntil = Date.now() + 250;
                    draggedRoomId = null;
                });
                sidebar.addEventListener('dragover', e => {
                    if (!draggedRoomId) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    var targetGroup = e.target.closest('.page-history-group');
                    sidebar.querySelectorAll('.page-history-group.drag-target').forEach(function (el) { el.classList.remove('drag-target'); });
                    if (targetGroup) targetGroup.classList.add('drag-target');
                    let targetItem = e.target.closest('.page-history-item, .sidebar-item');
                    if (targetItem && targetItem.dataset.room !== draggedRoomId) {
                        let rect = targetItem.getBoundingClientRect();
                        let midpoint = rect.top + rect.height / 2;
                        let draggedEl = document.querySelector('[data-room="' + draggedRoomId + '"]');
                        if (!draggedEl) return;
                        sidebar.querySelectorAll('.drop-before,.drop-after').forEach(function (el) { el.classList.remove('drop-before', 'drop-after'); });
                        if (e.clientY < midpoint) {
                            targetItem.classList.add('drop-before');
                            targetItem.parentNode.insertBefore(draggedEl, targetItem);
                        } else {
                            targetItem.classList.add('drop-after');
                            targetItem.parentNode.insertBefore(draggedEl, targetItem.nextSibling);
                        }
                    }
                });
                sidebar.addEventListener('drop', e => {
                    e.preventDefault();
                    if (!draggedRoomId || !rooms[draggedRoomId]) return;
                    var historyItems = Array.from(sidebar.querySelectorAll('.page-history-item[data-room]'));
                    if (historyItems.length) {
                        var dropGroup = e.target.closest('.page-history-group');
                        if (dropGroup && rooms[draggedRoomId]) rooms[draggedRoomId].sectionId = dropGroup.dataset.section || rooms[draggedRoomId].sectionId;
                        roomOrder = historyItems.map(function (item) { return item.dataset.room; });
                        saveActiveWorkspaceData();
                        renderPageHistory();
                        showToast('บันทึกลำดับห้องแล้ว');
                        return;
                    }
                    var section = e.target.closest('.sidebar-section');
                    if (section && section.dataset.section) {
                        rooms[draggedRoomId].sectionId = section.dataset.section;
                        scheduleWorkspaceSave();
                        renderWorkspaceRooms();
                    }
                });
            }
