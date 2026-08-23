let currentRoomId = 'room-1', contextRoomId = null, contextSectionId = null, contextPostitId = null, draggedRoomId = null, suppressRoomClickUntil = 0, slashMenuTarget = null, slashMenuIndex = 0, blockCtxIndex = null;

            const workroomDefaultEnglish = {
                'ไอเดีย': 'Ideas', 'โปสต์ของฉัน': 'My Post-its', 'โปสต์แบบทีม': 'Team Post-its',
                'โปรเจ็กลับ': 'Private Project', 'ฝ่ายคอนเทนต์': 'Content Team', 'ฝ่ายพัฒนาเว็ป': 'Web Development',
                'ห้องทั่วไป': 'General', 'ห้องส่วนตัว': 'Private rooms', 'ห้องแผนก': 'Departments',
                'ไอเดียสำหรับโปรเจกต์ใหม่': 'Ideas for a new project', 'วิธีการใช้งาน': 'How to use',
                'ยินดีต้อนรับสู่ห้องไอเดีย! ที่นี่คุณสามารถจดบันทึกความคิดสร้างสรรค์ทั้งหมดของคุณได้': 'Welcome to the Ideas room! Save all your creative thoughts here.',
                'คุณสามารถ ใส่รูปภาพประกอบ หรือ วาดเขียนไอเดียได้อย่างอิสระ': 'Add images or freely sketch your ideas.',
                'แนวคิดหลัก': 'Main ideas', 'พัฒนาแอปจัดการงานแบบใหม่': 'Build a new task management app',
                'เพิ่มระบบ AI ช่วยเขียนเนื้อหา': 'Add AI-assisted writing', 'สิ่งที่ต้องทำ': 'To do',
                'วิจัยตลาดเป้าหมาย': 'Research the target market', 'ออกแบบ Wireframe': 'Design wireframes',
                'สร้าง MVP': 'Build the MVP', 'พิมพ์ <b>/</b> เพื่อเข้าถึงฟังก์ชันต่างๆ ในการออกแบบไอเดีย': 'Type <b>/</b> to access idea design tools',
                'เนื้อหาส่วนตัวของคุณ...': 'Your private content...', 'เนื้อหาร่วมกับทีม...': 'Shared team content...',
                'เอกสารลับ...': 'Private documents...', 'แผนคอนเทนต์...': 'Content plan...', 'เอกสารทางเทคนิค...': 'Technical documents...',
                'หน้าใหม่': 'New page', 'หน้ากระดาษใหม่': 'New page', 'ไม่มีชื่อ': 'Untitled'
            };
            function workroomSystemText(value) {
                if (currentLang !== 'en') return value;
                if (workroomDefaultEnglish[value]) return workroomDefaultEnglish[value];
                var plain = String(value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
                if (/^พิมพ์\s*\/\s*เพื่อเข้าถึงฟังก์ชันต่างๆ/.test(plain)) {
                    return 'Type <b>/</b> to access the design tools';
                }
                return value;
            }
            function uiText(key, fallback) {
                var table = typeof translations !== 'undefined' && translations[currentLang];
                return table && table[key] != null ? table[key] : (fallback || key);
            }
            function workroomRoomName(id) {
                var room = rooms[id];
                if (!room) return workroomSystemText('ไม่มีชื่อ');
                return /^room-[1-6]$/.test(id) ? workroomSystemText(room.name) : room.name;
            }
            function workspaceDisplayName(workspace) {
                var name = String(workspace && workspace.name || '').trim();
                if (/^พื้นที่ของ\s+/i.test(name)) return currentLang === 'en' ? name.replace(/^พื้นที่ของ\s+/i, 'Workspace of ') : name;
                if (/^Workspace of\s+/i.test(name)) return currentLang === 'th' ? name.replace(/^Workspace of\s+/i, 'พื้นที่ของ ') : name;
                return name;
            }
            function refreshWorkroomLanguage() {
                if (!document.getElementById('mainApp')) return;
                refreshLoginLanguage();
                if (typeof renderWorkspaceRooms === 'function' && activeWorkspace) renderWorkspaceRooms();
                if (typeof renderWorkspaceMenu === 'function' && activeWorkspace) renderWorkspaceMenu();
                if (typeof renderTeamPanel === 'function' && activeWorkspace) renderTeamPanel();
                if (typeof renderNotif === 'function') renderNotif();
                var accountModal = document.getElementById('accountModal');
                if (accountModal && accountModal.classList.contains('active') && typeof openAccountPage === 'function') openAccountPage(false);
                var toolbarToggle = document.getElementById('ideaToolbarToggle');
                var toolbar = document.getElementById('ideaToolbar');
                if (toolbarToggle) {
                    var expanded = !!(toolbar && toolbar.classList.contains('expanded'));
                    toolbarToggle.setAttribute('aria-label', uiText(expanded ? 'wrToolbarClose' : 'wrToolbarOpen'));
                    toolbarToggle.title = uiText(expanded ? 'wrToolbarClose' : 'wrToolbarOpen');
                }
                var teamButton = document.getElementById('teamButton');
                if (teamButton) teamButton.title = uiText('wrTeamMembers');
                var teamPanel = document.getElementById('teamPanel');
                if (teamPanel) teamPanel.setAttribute('aria-label', uiText('wrTeamMembers'));
                var teamClose = document.querySelector('#teamPanel .team-close');
                if (teamClose) teamClose.setAttribute('aria-label', uiText('wrClose'));
                if (typeof renderEditor === 'function' && workroomInitialized) renderEditor();
                if (typeof initTypewriter === 'function' && workroomInitialized) initTypewriter();
            }

            const loginLanguageCopy = {
                th: {
                    eyebrow: 'พื้นที่สำหรับทีมของคุณ', visualTitle: 'จัดการงานทุกอย่าง<br>ในที่เดียว', visualText: 'โฟกัสกับงานที่สำคัญ เชื่อมต่อกับทีม และพาโปรเจกต์ไปข้างหน้าได้อย่างลื่นไหล',
                    feature1: 'เวิร์กโฟลว์ที่ชัดเจน', feature2: 'ทำงานร่วมกันแบบเรียลไทม์', feature3: 'ข้อมูลของคุณปลอดภัย', quote: '“WorkRoom ทำให้ทุกคนเห็นภาพเดียวกัน และช่วยให้ทีมเราเดินหน้าได้เร็วขึ้น”', quoteBy: 'May — Product Lead',
                    title: 'ยินดีต้อนรับกลับมา', subtitle: 'เข้าสู่ระบบเพื่อกลับไปจัดการงานและทำงานร่วมกับทีมของคุณ', google: 'Google', facebook: 'Facebook', divider: 'หรือเข้าสู่ระบบด้วยอีเมล',
                    email: 'อีเมล', password: 'รหัสผ่าน', passwordPlaceholder: 'กรอกรหัสผ่าน', remember: 'จดจำฉัน', forgot: 'ลืมรหัสผ่าน?', submit: 'เข้าสู่ระบบ', noAccount: 'ยังไม่มีบัญชี?', signup: 'สร้างบัญชี', legal: 'เมื่อเข้าสู่ระบบ ถือว่าคุณยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว', back: 'กลับหน้าหลัก', show: 'แสดงรหัสผ่าน', hide: 'ซ่อนรหัสผ่าน'
                },
                en: {
                    eyebrow: 'Your team workspace', visualTitle: 'All your work,<br>in one place', visualText: 'Focus on what matters, stay connected with your team, and move every project forward.',
                    feature1: 'Clear, focused workflows', feature2: 'Real-time collaboration', feature3: 'Your data stays secure', quote: '“WorkRoom gives everyone the same view and helps our team move faster.”', quoteBy: 'May — Product Lead',
                    title: 'Welcome back', subtitle: 'Sign in to manage your work and collaborate with your team.', google: 'Google', facebook: 'Facebook', divider: 'or sign in with email',
                    email: 'Email', password: 'Password', passwordPlaceholder: 'Enter your password', remember: 'Remember me', forgot: 'Forgot password?', submit: 'Sign in', noAccount: "Don't have an account?", signup: 'Create account', legal: 'By signing in, you agree to our Terms of Service and Privacy Policy.', back: 'Back to home', show: 'Show password', hide: 'Hide password'
                }
            };

            function refreshLoginLanguage() {
                var lang = currentLang === 'en' ? 'en' : 'th';
                var copy = loginLanguageCopy[lang];
                document.querySelectorAll('[data-login-copy]').forEach(function (el) {
                    var value = copy[el.dataset.loginCopy];
                    if (value != null) el.innerHTML = value;
                });
                var password = document.getElementById('loginPassword');
                if (password) password.placeholder = copy.passwordPlaceholder;
                var toggle = document.querySelector('.password-toggle');
                if (toggle) toggle.setAttribute('aria-label', password && password.type === 'text' ? copy.hide : copy.show);
                var language = document.querySelector('.login-language');
                if (language) language.setAttribute('aria-label', lang === 'en' ? 'Change language' : 'เปลี่ยนภาษา');
            }

            function toggleLoginPassword(button) {
                var input = document.getElementById('loginPassword');
                if (!input) return;
                input.type = input.type === 'password' ? 'text' : 'password';
                var lang = currentLang === 'en' ? 'en' : 'th';
                button.setAttribute('aria-label', input.type === 'text' ? loginLanguageCopy[lang].hide : loginLanguageCopy[lang].show);
                button.textContent = input.type === 'text' ? '◌' : '◉';
            }

            let rooms = {
                'room-1': { name: 'ไอเดีย', emoji: '💡', privacy: 'shared', sectionId: 'section-main', createdAt: Date.now() - 86400000 },
                'room-2': { name: 'โปสต์ของฉัน', emoji: '📁', privacy: 'shared', sectionId: 'section-main', createdAt: Date.now() - 72000000 },
                'room-3': { name: 'โปสต์แบบทีม', emoji: '👥', privacy: 'shared', sectionId: 'section-main', createdAt: Date.now() - 50000000 },
                'room-4': { name: 'โปรเจ็กลับ', emoji: '🔒', privacy: 'private', sectionId: 'section-private', createdAt: Date.now() - 30000000 },
                'room-5': { name: 'ฝ่ายคอนเทนต์', emoji: '📂', privacy: 'shared', sectionId: 'section-department', createdAt: Date.now() - 15000000 },
                'room-6': { name: 'ฝ่ายพัฒนาเว็ป', emoji: '📂', privacy: 'shared', sectionId: 'section-department', createdAt: Date.now() - 5000000 }
            };
            let roomOrder = Object.keys(rooms);

            let roomSections = [
                { id: 'section-main', name: 'ห้องทั่วไป' },
                { id: 'section-private', name: 'ห้องส่วนตัว' },
                { id: 'section-department', name: 'ห้องแผนก' }
            ];

            let roomPages = {
                'room-1': {
                    title: 'ไอเดียสำหรับโปรเจกต์ใหม่', blocks: [
                        { type: 'text', content: 'ยินดีต้อนรับสู่ห้องไอเดีย! ที่นี่คุณสามารถจดบันทึกความคิดสร้างสรรค์ทั้งหมดของคุณได้' },
                        { type: 'h2', content: 'แนวคิดหลัก' },
                        { type: 'bullet', content: 'พัฒนาแอปจัดการงานแบบใหม่' },
                        { type: 'bullet', content: 'เพิ่มระบบ AI ช่วยเขียนเนื้อหา' },
                        { type: 'h2', content: 'สิ่งที่ต้องทำ' },
                        { type: 'todo', content: 'วิจัยตลาดเป้าหมาย', checked: false },
                        { type: 'todo', content: 'ออกแบบ Wireframe', checked: true },
                        { type: 'todo', content: 'สร้าง MVP', checked: false }
                    ]
                },
                'room-2': { title: 'โปสต์ของฉัน', blocks: [{ type: 'text', content: 'เนื้อหาส่วนตัวของคุณ...' }] },
                'room-3': { title: 'โปสต์แบบทีม', blocks: [{ type: 'text', content: 'เนื้อหาร่วมกับทีม...' }] },
                'room-4': { title: 'โปรเจ็กลับ', blocks: [{ type: 'text', content: 'เอกสารลับ...' }] },
                'room-5': { title: 'ฝ่ายคอนเทนต์', blocks: [{ type: 'text', content: 'แผนคอนเทนต์...' }] },
                'room-6': { title: 'ฝ่ายพัฒนาเว็ป', blocks: [{ type: 'text', content: 'เอกสารทางเทคนิค...' }] }
            };

            let notifications = [];
            let collaborationState = null;
            let activeWorkspace = null;
            let collaborationSaveTimer = null;
            let workspaceProfileTargetId = null;
            let pendingWorkspaceProfile = null;
            const DEFAULT_WORKSPACE_ICON = 'assets/images/workroom-default-workspace.png';
            const initialRooms = JSON.parse(JSON.stringify(rooms));
            const initialRoomPages = JSON.parse(JSON.stringify(roomPages));
            let roomPageCollections = {};
            Object.keys(roomPages).forEach(function (id) {
                if (id === 'room-1' || id === 'room-2' || id === 'room-3') return;
                var firstId = 'room-page-initial-' + id;
                roomPageCollections[id] = {
                    activePageId: firstId,
                    pages: [{ id: firstId, title: roomPages[id].title, blocks: roomPages[id].blocks, createdAt: Date.now() }]
                };
            });
            const initialRoomSections = JSON.parse(JSON.stringify(roomSections));

            const defaultIdeaBlocks = readJson('ideaDocBlocks', null) || [
                { type: 'h1', content: 'วิธีการใช้งาน' },
                { type: 'text', content: 'พิมพ์ <b>/</b> เพื่อเข้าถึงฟังก์ชันต่างๆ ในการออกแบบไอเดีย' },
                { type: 'text', content: '' }
            ];
            const initialIdeaPages = [{
                id: 'idea-page-guide',
                title: 'วิธีการใช้งาน',
                blocks: JSON.parse(JSON.stringify(defaultIdeaBlocks)),
                strokes: [],
                createdAt: Date.now()
            }];
            let ideaPages = JSON.parse(JSON.stringify(initialIdeaPages));
            let activeIdeaPageId = ideaPages[0].id;
            let ideaDocBlocks = ideaPages[0].blocks;
            let wbStrokes = ideaPages[0].strokes;
            let wbTool = 'pen', wbColor = '#333', wbSize = 3, isWbDrawing = false, currentWbStroke = null;

            // ========== INIT ==========
            let workroomInitialized = false;
            function initWorkroom() {
                if (workroomInitialized) return;
                workroomInitialized = true;
                renderEditor();
                renderPageHistory();
                updateBellBadge();
                initDragAndDrop();
                initWhiteboard();
                initTypewriter();
                document.getElementById('editorContainer').addEventListener('input', function () {
                    if (activeWorkspace && activeWorkspace.role === 'viewer') return;
                    var title = document.getElementById('pageTitle');
                    if (title && currentRoomId !== 'room-1' && roomPages[currentRoomId]) {
                        roomPages[currentRoomId].title = title.value;
                        renderNormalPageTabs();
                    }
                    scheduleWorkspaceSave();
                });
                document.getElementById('editorContainer').addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
                document.getElementById('editorContainer').addEventListener('drop', e => {
                    e.preventDefault();
                    let files = e.dataTransfer.files;
                    if (!files.length) return;
                    let file = files[0];
                    if (!isAllowedRasterImageFile(file)) return showToast(currentLang === 'en' ? 'Use a PNG, JPEG, GIF or WebP image' : 'รองรับเฉพาะรูป PNG, JPEG, GIF หรือ WebP');
                    if (file.size > 5 * 1024 * 1024) return showToast(currentLang === 'en' ? 'Image must not exceed 5 MB' : 'รูปภาพต้องมีขนาดไม่เกิน 5 MB');
                    let reader = new FileReader();
                    reader.onload = function (evt) {
                        let page = roomPages[currentRoomId];
                        let newBlock = { type: 'image', content: evt.target.result, url: evt.target.result };
                        page.blocks.push(newBlock);
                        renderEditor();
                        showToast('แทรกรูปภาพแล้ว');
                    };
                    reader.readAsDataURL(file);
                });
            }
            document.addEventListener('DOMContentLoaded', () => {
                initWorkroom();
                // หยุด Lenis ไม่ให้จับ scroll event ใน slash menu
                var sm = document.getElementById('slashMenu');
                if (sm) sm.addEventListener('wheel', function (e) { e.stopPropagation(); }, { passive: false });
            });


            // ========== TYPEWRITER TITLE ==========
            let typewriterRunId = 0;
            function initTypewriter() {
                const runId = ++typewriterRunId;
                const text = workroomSystemText('ไอเดียสำหรับโปรเจกต์ใหม่');
                const el = document.getElementById('typewriterText');
                if (!el) return;
                let i = 0;
                let deleting = false;
                let pause = 0;

                function tick() {
                    if (runId !== typewriterRunId) return;
                    if (pause > 0) {
                        pause--;
                        setTimeout(tick, 100);
                        return;
                    }
                    if (!deleting) {
                        el.textContent = text.substring(0, i + 1);
                        i++;
                        if (i === text.length) {
                            deleting = true;
                            pause = 12; // pause before delete
                        }
                        setTimeout(tick, 120);
                    } else {
                        el.textContent = text.substring(0, i - 1);
                        i--;
                        if (i === 0) {
                            deleting = false;
                            pause = 6; // pause before retype
                        }
                        setTimeout(tick, 60);
                    }
                }
                tick();
            }

            // ========== AUTH ==========
            document.getElementById('loginForm').addEventListener('submit', e => {
                e.preventDefault();
                var email = (document.getElementById('loginEmail').value || '').trim();
                var password = document.getElementById('loginPassword').value || '';
                if (!email || password.length < 8) {
                    showToast(currentLang === 'en' ? 'Enter a valid email and at least 8 password characters' : 'กรอกอีเมลและรหัสผ่านอย่างน้อย 8 ตัวอักษร');
                    return;
                }
                var name = email.split('@')[0] || 'สมาชิก';
                completeLogin({ name: name, email: email, picture: null, provider: 'email' });
                document.getElementById('loginPassword').value = '';
            });

            // ========== ROOMS ==========
            function switchRoom(roomId, el) {
                saveActiveWorkspaceData();
                currentRoomId = roomId;
                document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
                if (el) el.classList.add('active');
                let roomName = rooms[roomId] ? rooms[roomId].name : 'ไม่มีชื่อ';
                let breadcrumb = document.getElementById('headerBreadcrumb');
                if (breadcrumb) breadcrumb.innerHTML = escapeHtml(roomName) + ' <span>/</span> ' + escapeHtml(workroomSystemText('ไม่มีชื่อ'));
                renderEditor();
                renderPageHistory();
                applyWorkspaceRole();
            }

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
                        pages: [{ id: firstId, title: source.title, blocks: source.blocks || [{ type: 'text', content: '' }], createdAt: Date.now() }]
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
                var page = { id: 'room-page-' + Date.now(), title: 'หน้ากระดาษใหม่', blocks: [{ type: 'text', content: '' }], createdAt: Date.now() };
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
                    return '<div class="idea-page-tab-wrap"><button class="idea-page-tab' + (active ? ' active' : '') + '" role="tab" aria-selected="' + String(active) + '" title="' + escapeHtml(page.title) + '" onclick="switchRoomPage(\'' + escapeHtml(page.id) + '\')">' + escapeHtml(page.title) + '</button>'
                        + (canDelete ? '<button class="idea-page-tab-close" onclick="deleteRoomPage(event,\'' + escapeHtml(page.id) + '\')" title="ลบหน้ากระดาษ" aria-label="ลบหน้ากระดาษ ' + escapeHtml(page.title) + '">×</button>' : '') + '</div>';
                }).join('');
            }

            function switchIdeaPage(pageId) {
                if (!ideaPages.some(function (page) { return page.id === pageId; })) return;
                activeIdeaPageId = pageId;
                syncActiveIdeaPageRefs();
                renderIdeaPageTabs();
                renderIdeaBlocks();
                renderWhiteboard();
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
                    var timeStr = '';
                    if (room.createdAt) {
                        var d = new Date(room.createdAt);
                        timeStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                            + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                    }
                    var canReorder = !activeWorkspace || ['owner', 'editor'].includes(activeWorkspace.role);
                    var displayName = workroomRoomName(id);
                    return '<div class="page-history-item' + (isActive ? ' active' : '') + '" draggable="' + String(canReorder) + '" data-room="' + escapeHtml(id) + '" title="' + (canReorder ? (currentLang === 'en' ? 'Drag to reorder rooms' : 'ลากเพื่อจัดลำดับห้อง') : escapeHtml(displayName)) + '" onclick="switchPage(\'' + escapeHtml(id) + '\',this)">'
                        + '<div class="page-history-icon">' + escapeHtml(room.emoji || '📄') + '</div>'
                        + '<div class="page-history-copy"><div class="page-history-name">' + escapeHtml(displayName) + '</div>'
                        + (timeStr ? '<div class="page-history-time">' + timeStr + '</div>' : '') + '</div>'
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
                document.getElementById('newItemNameLabel').textContent = roomMode ? 'ชื่อห้องทำงาน' : 'ชื่อหัวข้อห้อง';
                document.getElementById('newRoomName').placeholder = roomMode ? 'เช่น แผนงานโปรเจกต์' : 'เช่น งานฝ่ายออกแบบ';
                if (!roomMode) closeCreateSectionMenu();
            }

            function renderCreateSectionOptions() {
                var input = document.getElementById('newRoomSection');
                var selected = roomSections.find(function (section) { return section.id === input.value; }) || roomSections[0];
                if (!selected) {
                    input.value = '';
                    document.getElementById('createSectionText').textContent = 'ยังไม่มีหัวข้อ';
                    document.getElementById('createSectionMenu').innerHTML = '';
                    return;
                }
                input.value = selected.id;
                document.getElementById('createSectionText').textContent = selected.name;
                document.getElementById('createSectionMenu').innerHTML = roomSections.map(function (section) {
                    return '<button type="button" class="create-select-option" role="option" data-value="' + escapeHtml(section.id)
                        + '" aria-selected="' + (section.id === selected.id ? 'true' : 'false')
                        + '" onclick="selectCreateSection(this.dataset.value,true)" onkeydown="handleCreateSectionOptionKeydown(event)">'
                        + escapeHtml(section.name) + '</button>';
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
                try {
                    var parsed = new URL(source, location.href);
                    return /^https?:$/.test(parsed.protocol) ? parsed.href : '';
                } catch (e) { return ''; }
            }

            function isAllowedRasterImageFile(file) {
                return !!file && /^(image\/(?:png|jpeg|gif|webp))$/i.test(String(file.type || ''));
            }

            function collaborationKey(email) { return 'workroomCollab:' + normalizeEmail(email); }
            function mailboxKey(email) { return 'workroomMailbox:' + normalizeEmail(email); }
            function workspaceDataKey(id) { return 'workroomWorkspaceData:' + id; }

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
                if (state.workspaces[0] && !safeImageSource(state.workspaces[0].icon)) {
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
                        document.getElementById('workspaceProfilePreview').src = pendingWorkspaceProfile.image;
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
                document.getElementById('workspaceProfilePreview').removeAttribute('src');
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
                workspaceProfileTargetId = null;
                collaborationState.activeWorkspaceId = id;
                persistCollaborationState();
                document.getElementById('workspaceMenu').classList.remove('show');
                document.getElementById('workspaceSwitcher').setAttribute('aria-expanded', 'false');
                loadActiveWorkspaceData();
                renderWorkspaceMenu();
                renderTeamPanel();
                syncRegisteredUsers();
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

            // ========== NOTIFICATIONS ==========
            function toggleNotif(e) {
                e.stopPropagation();
                let d = document.getElementById('notifDropdown');
                d.classList.toggle('show');
                renderNotif();
                if (d.classList.contains('show')) {
                    notifications.forEach(function (item) { item.read = true; });
                    saveMailbox();
                    updateBellBadge();
                }
            }

            function renderNotif() {
                let list = document.getElementById('notifList');
                var visibleNotifications = notifications.filter(function (item) {
                    return item.type === 'team_invite' || readSetting('settings-notifTag', true);
                });
                if (visibleNotifications.length === 0) { list.innerHTML = '<div class="notif-dropdown-empty">' + escapeHtml(uiText('wrNoNotifications')) + '</div>'; return; }
                list.innerHTML = visibleNotifications.map(function (item) {
                    if (item.type === 'team_invite') {
                        var actions = item.status === 'pending'
                            ? '<div class="invite-actions"><button class="invite-accept" onclick="event.stopPropagation();respondToInvite(\'' + escapeHtml(item.id) + '\',true)">' + escapeHtml(uiText('wrAccept')) + '</button><button class="invite-decline" onclick="event.stopPropagation();respondToInvite(\'' + escapeHtml(item.id) + '\',false)">' + escapeHtml(uiText('wrDecline')) + '</button></div>'
                            : '<div class="invite-notification-meta">' + escapeHtml(item.status === 'accepted' ? uiText('wrAccepted') : uiText('wrDeclined')) + '</div>';
                        return '<div class="invite-notification"><div class="invite-notification-title"><strong>' + escapeHtml(item.fromName)
                            + '</strong> ' + escapeHtml(uiText('wrInviteMessage')) + ' “' + escapeHtml(item.workspaceName) + '”</div><div class="invite-notification-meta">'
                            + escapeHtml(item.time || uiText('wrJustNow')) + ' · ' + escapeHtml(item.role === 'editor' ? uiText('wrEditPermission') : uiText('wrViewPermission')) + '</div>' + actions + '</div>';
                    }
                    if (item.type === 'mention') {
                        return '<div class="invite-notification ' + (item.read ? '' : 'unread') + '">'
                            + '<div class="invite-notification-title"><strong>@' + escapeHtml(item.fromName || uiText('wrMemberFallback'))
                            + '</strong> ' + escapeHtml(uiText('wrMentionedYou')) + ' “' + escapeHtml(item.roomName || uiText('wrWorkroomFallback')) + '”</div>'
                            + '<div class="invite-notification-meta">' + escapeHtml(item.workspaceName || '')
                            + (item.time ? ' · ' + escapeHtml(item.time) : '') + '</div></div>';
                    }
                    return '<div class="notif-dropdown-item ' + (item.read ? '' : 'unread') + '"><div class="notif-dropdown-text">'
                        + escapeHtml(item.text || '') + '</div><div class="notif-dropdown-time">' + escapeHtml(item.time || '') + '</div></div>';
                }).join('');
            }

            function updateBellBadge() {
                let badge = document.getElementById('bellBadge');
                let unread = notifications.filter(function (item) {
                    return !item.read && (item.type === 'team_invite' || readSetting('settings-notifTag', true));
                }).length;
                badge.classList.toggle('show', unread > 0);
            }
            function clearNotif() {
                notifications = notifications.filter(function (item) { return item.type === 'team_invite' && item.status === 'pending'; });
                saveMailbox();
                renderNotif();
                updateBellBadge();
                showToast(notifications.length ? 'เก็บคำเชิญที่ยังรอการตอบรับไว้' : 'ล้างการแจ้งเตือนแล้ว');
            }

            // ========== SETTINGS FUNCTIONS ==========
            function readSetting(key, fallback) {
                try {
                    var value = localStorage.getItem(key);
                    return value === null ? fallback : value !== '0';
                } catch (e) { return fallback; }
            }
            function openSettingsModal() {
                restoreToggles();
                restoreTheme();
                restoreAccent();
                restoreSettingsLanguage();
                openModal('settingsModal');
            }
            function switchSettingsTab(tab, btn) {
                document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
                document.getElementById('settings-' + tab).classList.add('active');
            }
            function toggleSettingSwitch(el, storageKey) {
                el.classList.toggle('on');
                var enabled = el.classList.contains('on');
                el.setAttribute('aria-checked', String(enabled));
                try { localStorage.setItem(storageKey, enabled ? '1' : '0'); } catch (e) { }
                if (storageKey === 'settings-notifTag') { renderNotif(); updateBellBadge(); }
                if (typeof showToast === 'function') showToast(enabled ? 'เปิดการตั้งค่าแล้ว' : 'ปิดการตั้งค่าแล้ว');
            }
            function restoreToggles() {
                [['toggleNotifTag', 'settings-notifTag'], ['toggleNotifSound', 'settings-notifSound']].forEach(function (pair) {
                    var el = document.getElementById(pair[0]);
                    if (!el) return;
                    var enabled = readSetting(pair[1], true);
                    el.classList.toggle('on', enabled);
                    el.setAttribute('aria-checked', String(enabled));
                });
            }
            function playNotificationSound(force) {
                if (!force && !readSetting('settings-notifSound', true)) return;
                try {
                    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (!AudioContextClass) return;
                    var context = new AudioContextClass();
                    var oscillator = context.createOscillator();
                    var gain = context.createGain();
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(660, context.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + .12);
                    gain.gain.setValueAtTime(.0001, context.currentTime);
                    gain.gain.exponentialRampToValueAtTime(.11, context.currentTime + .02);
                    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .22);
                    oscillator.connect(gain); gain.connect(context.destination);
                    oscillator.start(); oscillator.stop(context.currentTime + .23);
                    oscillator.onended = function () { context.close(); };
                } catch (e) { }
            }
            function previewNotificationSound() {
                playNotificationSound(true);
                showToast('กำลังทดลองเสียงแจ้งเตือน');
            }
            function applyTheme(theme) {
                var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                var isPlayful = theme === 'playful';
                document.body.classList.toggle('playful-theme', isPlayful);
                document.body.classList.toggle('light-theme', !isDark || isPlayful);
            }
            function switchSettingsTheme(btn, theme) {
                document.querySelectorAll('.settings-theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                try { localStorage.setItem('settings-theme', theme); } catch (e) { }
                applyTheme(theme);
            }
            function restoreTheme() {
                try {
                    var saved = localStorage.getItem('settings-theme') || 'dark';
                    var btn = document.querySelector('.settings-theme-btn[data-theme="' + saved + '"]');
                    if (btn) { document.querySelectorAll('.settings-theme-btn').forEach(function (b) { b.classList.remove('active'); }); btn.classList.add('active'); }
                    applyTheme(saved);
                } catch (e) { }
            }
            var settingsSystemTheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
            if (settingsSystemTheme) settingsSystemTheme.addEventListener('change', function () {
                try { if ((localStorage.getItem('settings-theme') || 'dark') === 'system') applyTheme('system'); } catch (e) { }
            });
            function applyAccent(color) { document.documentElement.style.setProperty('--accent', color); }
            function pickAccent(dot, color) {
                document.querySelectorAll('.settings-accent-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                try { localStorage.setItem('settings-accent', color); } catch (e) { }
                applyAccent(color);
            }
            function restoreAccent() {
                try {
                    var saved = localStorage.getItem('settings-accent');
                    if (saved) {
                        applyAccent(saved);
                        document.querySelectorAll('.settings-accent-dot').forEach(function (d) { d.classList.remove('active'); });
                        var dot = document.querySelector('.settings-accent-dot[data-color="' + saved + '"]');
                        if (dot) dot.classList.add('active');
                    }
                } catch (e) { }
            }
            function switchSettingsLang(btn) {
                document.querySelectorAll('.settings-lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            function restoreSettingsLanguage() {
                var saved = localStorage.getItem('bentoLang') || currentLang || 'en';
                document.querySelectorAll('.settings-lang-btn').forEach(function (button) {
                    button.classList.toggle('active', button.dataset.lang === saved);
                });
                document.querySelectorAll('#settingsModal [data-i18n]').forEach(function (element) {
                    var value = translations[saved] && translations[saved][element.dataset.i18n];
                    if (value) element.textContent = value;
                });
            }
            function copyAppVersion() {
                var value = 'WorkRoom 1.0.0';
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(value).then(function () { showToast('คัดลอกข้อมูลเวอร์ชันแล้ว'); });
                } else {
                    var input = document.createElement('textarea');
                    input.value = value; input.style.position = 'fixed'; input.style.opacity = '0';
                    document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove();
                    showToast('คัดลอกข้อมูลเวอร์ชันแล้ว');
                }
            }
            function initializeSettings() {
                restoreToggles(); restoreTheme(); restoreAccent(); restoreSettingsLanguage();
            }
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeSettings);
            else initializeSettings();

            window.addEventListener('storage', function (event) {
                var activeAccount = getCurrentAccount();
                if (activeAccount.email && event.key === 'workroomSessionRevoked:' + activeAccount.email) {
                    closeModal('accountModal');
                    logout();
                    return;
                }
                if (event.key && event.key.indexOf('workroomMailbox:') === 0) {
                    var before = notifications.filter(function (item) { return !item.read; }).length;
                    var account = getCurrentAccount();
                    if (event.key !== mailboxKey(account.email)) return;
                    loadMailbox(true);
                    var after = notifications.filter(function (item) { return !item.read; }).length;
                    if (after > before) updateBellBadge();
                }
                if (event.key && event.key.indexOf('settings-') === 0) initializeSettings();
                if (event.key === 'bentoLang' && event.newValue) { setLang(event.newValue); restoreSettingsLanguage(); }
            });

            // ========== ACCOUNT FUNCTIONS ==========
            function openAccountPage(shouldOpen) {
                var user = currentUser || {};
                var name = user.name || 'User';
                var email = user.email || '';
                var initial = name.trim().charAt(0).toUpperCase() || '?';
                var pic = (typeof safePicture === 'function') ? safePicture(user.picture) : '';
                var avatar = document.getElementById('acctAvatar');
                avatar.innerHTML = '';
                avatar.style.background = '';
                if (pic) {
                    avatar.style.background = '#2a2a2a';
                    var img = document.createElement('img');
                    img.src = pic;
                    img.onerror = function () { avatar.style.background = 'linear-gradient(135deg, #ff8fa3, #b197fc)'; avatar.textContent = initial; };
                    avatar.appendChild(img);
                } else {
                    avatar.style.background = 'linear-gradient(135deg, #ff8fa3, #b197fc)';
                    avatar.textContent = initial;
                }
                document.getElementById('acctDisplayName').textContent = name;
                document.getElementById('acctNameInput').value = name;
                document.getElementById('acctEmailInput').value = email;
                var connected = user.provider === 'google';
                var badge = document.getElementById('acctConnectedBadge');
                var providerButton = document.getElementById('acctProviderBtn');
                document.getElementById('acctProviderDetail').textContent = connected ? email : uiText('acctGoogleNotConnected');
                badge.textContent = connected ? uiText('acctConnectedNow') : uiText('acctNotConnected');
                badge.classList.toggle('disconnected', !connected);
                providerButton.textContent = connected ? uiText('acctDisconnectGoogle') : uiText('acctConnectGoogle');
                if (shouldOpen !== false) openModal('accountModal');
            }
            function persistAccountUser(user) {
                currentUser = user;
                try { localStorage.setItem('workroomUser', JSON.stringify(user)); } catch (e) { }
                if (collaborationState && user.email) {
                    collaborationState.workspaces.forEach(function (workspace) {
                        if (normalizeEmail(workspace.ownerEmail) === normalizeEmail(user.email)) workspace.ownerName = user.name;
                        (workspace.members || []).forEach(function (member) {
                            if (normalizeEmail(member.email) === normalizeEmail(user.email)) { member.name = user.name; member.picture = user.picture || null; }
                        });
                    });
                    persistCollaborationState();
                }
                if (typeof renderUserProfile === 'function') renderUserProfile(user);
            }
            function resetAccountForm() { openAccountPage(); showToast(currentLang === 'th' ? 'ยกเลิกการเปลี่ยนแปลงแล้ว' : 'Changes cancelled'); }
            function saveAccountProfile() {
                var val = document.getElementById('acctNameInput').value.trim();
                if (!val) { document.getElementById('acctNameInput').focus(); return showToast('กรุณากรอกชื่อ'); }
                var user = Object.assign({}, currentUser || {}, { name: val.substring(0, 60) });
                persistAccountUser(user);
                document.getElementById('acctDisplayName').textContent = user.name;
                showToast(currentLang === 'th' ? 'บันทึกสำเร็จ' : 'Saved successfully');
            }
            function saveAccountField() { saveAccountProfile(); }
            function changeAvatar(e) {
                var file = e.target.files[0];
                if (!file) return;
                if (!isAllowedRasterImageFile(file)) return showToast('รองรับเฉพาะรูป PNG, JPEG, GIF หรือ WebP');
                if (file.size > 3 * 1024 * 1024) return showToast('รูปภาพต้องมีขนาดไม่เกิน 3 MB');
                var reader = new FileReader();
                reader.onload = function (evt) {
                    var user = Object.assign({}, currentUser || {});
                    user.picture = evt.target.result;
                    persistAccountUser(user);
                    openAccountPage();
                    showToast(currentLang === 'th' ? 'เปลี่ยนรูปโปรไฟล์สำเร็จ' : 'Profile picture updated');
                };
                reader.readAsDataURL(file);
                e.target.value = '';
            }
            function toggleGoogleConnection() {
                var user = Object.assign({}, currentUser || {});
                if (user.provider === 'google') {
                    user.provider = 'email';
                    persistAccountUser(user); openAccountPage();
                    return showToast('ยกเลิกการเชื่อมต่อ Google แล้ว');
                }
                loginDestination = 'app';
                if (typeof loginWithGoogle === 'function') loginWithGoogle();
                else showToast('บริการ Google ยังไม่พร้อมใช้งาน');
            }
            function logoutAllDevices() {
                var user = currentUser || {};
                if (!confirm('ออกจากระบบบัญชีนี้ในทุกอุปกรณ์ใช่ไหม?')) return;
                try { localStorage.setItem('workroomSessionRevoked:' + normalizeEmail(user.email), String(Date.now())); } catch (e) { }
                closeModal('accountModal');
                logout();
            }
            function deleteAccount() {
                var lang = currentLang || 'th';
                if (!confirm(lang === 'th' ? 'คุณแน่ใจหรือว่าต้องการลบบัญชี?' : 'Are you sure you want to delete your account?')) return;
                var account = getCurrentAccount();
                var state = account.email ? readJson(collaborationKey(account.email), null) : null;
                try {
                    if (state && Array.isArray(state.workspaces)) state.workspaces.forEach(function (workspace) {
                        if (normalizeEmail(workspace.ownerEmail) === account.email) localStorage.removeItem(workspaceDataKey(workspace.id));
                    });
                    localStorage.removeItem('workroomUser');
                    localStorage.removeItem('wr-user');
                    localStorage.removeItem(collaborationKey(account.email));
                    localStorage.removeItem(mailboxKey(account.email));
                    localStorage.removeItem('workroomPresence:' + account.email);
                } catch (e) { }
                currentUser = null;
                closeModal('accountModal');
                showToast(lang === 'th' ? 'ลบบัญชีสำเร็จ' : 'Account deleted');
                setTimeout(function () { if (typeof showBento === 'function') showBento(true); updateNavLogin(); }, 700);
            }

            var acctCancelButton = document.getElementById('acctCancelBtn');
            var acctSaveButton = document.getElementById('acctSaveBtn');
            if (acctCancelButton) acctCancelButton.addEventListener('click', resetAccountForm);
            if (acctSaveButton) acctSaveButton.addEventListener('click', function () {
                acctSaveButton.disabled = true;
                try { saveAccountProfile(); }
                finally { setTimeout(function () { acctSaveButton.disabled = false; }, 300); }
            });
            var accountScroller = document.querySelector('#accountModal .account-page');
            if (accountScroller) {
                accountScroller.addEventListener('wheel', function (event) {
                    event.stopPropagation();
                    if (!event.deltaY) return;
                    var previous = accountScroller.scrollTop;
                    accountScroller.scrollTop += event.deltaY;
                    if (accountScroller.scrollTop !== previous) event.preventDefault();
                }, { passive: false });
                accountScroller.addEventListener('keydown', function (event) {
                    var step = Math.max(120, accountScroller.clientHeight * .78);
                    if (event.key === 'PageDown') { event.preventDefault(); accountScroller.scrollBy({ top: step, behavior: 'smooth' }); }
                    else if (event.key === 'PageUp') { event.preventDefault(); accountScroller.scrollBy({ top: -step, behavior: 'smooth' }); }
                    else if (event.key === 'Home' && !event.target.matches('input')) { event.preventDefault(); accountScroller.scrollTo({ top: 0, behavior: 'smooth' }); }
                    else if (event.key === 'End' && !event.target.matches('input')) { event.preventDefault(); accountScroller.scrollTo({ top: accountScroller.scrollHeight, behavior: 'smooth' }); }
                });
            }

            window.openAccountPage = openAccountPage;
            window.openModal = openModal;
            window.closeModal = closeModal;
            window.saveAccountProfile = saveAccountProfile;
            window.saveAccountField = saveAccountField;
            window.resetAccountForm = resetAccountForm;
            window.changeAvatar = changeAvatar;
            window.toggleGoogleConnection = toggleGoogleConnection;
            window.logoutAllDevices = logoutAllDevices;
            window.deleteAccount = deleteAccount;

            // ========== MENTION FUNCTIONS ==========
            let mentionTarget = null, mentionIndex = 0, mentionBlockIndex = null;
            let mentionVisibleUsers = [];
            const mentionColors = ['#8b5cf6', '#e64980', '#1971c2', '#f76707', '#37b24d', '#0ca678', '#f59f00'];
            let registeredUsers = [];
            function getMentionUsers(query) {
                var q = (query || '').toLowerCase();
                return registeredUsers.filter(function (u) { return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q); });
            }
            function showMentionMenu(targetEl, blockIdx, query) {
                var users = getMentionUsers(query);
                if (users.length === 0) { hideMentionMenu(); return; }
                mentionVisibleUsers = users;
                mentionBlockIndex = blockIdx;
                mentionIndex = 0;
                var menu = document.getElementById('mentionMenu');
                var rect = targetEl.getBoundingClientRect();
                menu.style.left = (rect.left + 40) + 'px';
                menu.style.top = (rect.bottom + 4) + 'px';
                var html = '<div class="mention-menu-title">@ แท็กผู้ใช้</div>';
                users.forEach(function (u, i) {
                    var initial = u.name.charAt(0).toUpperCase();
                    var color = mentionColors[i % mentionColors.length];
                    var avatar = u.picture
                        ? '<img src="' + escapeHtml(u.picture) + '" alt="">'
                        : escapeHtml(initial);
                    html += '<div class="mention-item' + (i === 0 ? ' selected' : '') + '" role="option" aria-selected="' + (i === 0 ? 'true' : 'false') + '" data-email="' + escapeHtml(u.email) + '">'
                        + '<div class="mention-avatar" style="background:' + color + '">' + avatar + '</div>'
                        + '<div><div class="mention-name">' + escapeHtml(u.name) + '</div>'
                        + '<div class="mention-email">' + escapeHtml(u.email) + '</div></div></div>';
                });
                menu.innerHTML = html;
                menu.setAttribute('role', 'listbox');
                menu.classList.add('show');
            }
            function hideMentionMenu() {
                document.getElementById('mentionMenu').classList.remove('show');
                mentionBlockIndex = null;
                mentionTarget = null;
                mentionVisibleUsers = [];
            }
            function sendMentionNotification(user) {
                var account = getCurrentAccount();
                var targetEmail = normalizeEmail(user.email);
                if (!targetEmail || targetEmail === account.email || !activeWorkspace) return;
                var roomName = rooms[currentRoomId] ? rooms[currentRoomId].name : (currentRoomId === 'room-1' ? 'ไอเดีย' : 'ห้องทำงาน');
                var targetMailbox = readJson(mailboxKey(targetEmail), []);
                targetMailbox.unshift({
                    id: 'mention-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
                    type: 'mention',
                    fromName: account.name,
                    fromEmail: account.email,
                    workspaceId: activeWorkspace.id,
                    workspaceName: activeWorkspace.name,
                    roomId: currentRoomId,
                    roomName: roomName,
                    text: account.name + ' แท็กคุณใน “' + roomName + '”',
                    time: 'เมื่อกี้',
                    createdAt: Date.now(),
                    popupShown: false,
                    read: false
                });
                writeJson(mailboxKey(targetEmail), targetMailbox);
            }
            function selectMention(email) {
                if (mentionBlockIndex === null) return;
                var user = registeredUsers.find(function (u) { return u.email === email; });
                if (!user) return;
                var isIdea = currentRoomId === 'room-1';
                var page = isIdea ? null : roomPages[currentRoomId];
                var block = isIdea ? ideaDocBlocks[mentionBlockIndex] : page.blocks[mentionBlockIndex];
                var raw = block.content || '';
                var atIdx = raw.lastIndexOf('@');
                if (atIdx !== -1) raw = raw.substring(0, atIdx);
                block.content = raw + '<span class="mention-chip" contenteditable="false" title="' + escapeHtml(user.email) + '">@' + escapeHtml(user.name) + '</span>&nbsp;';
                var selectedBlockIndex = mentionBlockIndex;
                sendMentionNotification(user);
                hideMentionMenu();
                if (isIdea) { saveIdeaBlocks(); renderIdeaBlocks(); setTimeout(() => focusIdeaBlock(selectedBlockIndex, false), 10); }
                else { scheduleWorkspaceSave(); renderEditor(); setTimeout(() => focusBlock(selectedBlockIndex, false), 10); }
                showToast('แท็ก ' + user.name + ' แล้ว');
            }
            function updateMentionSelection() {
                document.querySelectorAll('#mentionMenu .mention-item').forEach((item, i) => {
                    item.classList.toggle('selected', i === mentionIndex);
                    item.setAttribute('aria-selected', i === mentionIndex ? 'true' : 'false');
                });
            }
            function handleMentionMenuKeydown(e) {
                var menu = document.getElementById('mentionMenu');
                if (!menu.classList.contains('show') || mentionVisibleUsers.length === 0) return false;
                if (e.key === 'ArrowDown') {
                    e.preventDefault(); mentionIndex = (mentionIndex + 1) % mentionVisibleUsers.length; updateMentionSelection(); return true;
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault(); mentionIndex = (mentionIndex - 1 + mentionVisibleUsers.length) % mentionVisibleUsers.length; updateMentionSelection(); return true;
                }
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault(); selectMention(mentionVisibleUsers[mentionIndex].email); return true;
                }
                if (e.key === 'Escape') { e.preventDefault(); hideMentionMenu(); return true; }
                return false;
            }
            document.getElementById('mentionMenu').addEventListener('click', function (e) {
                var item = e.target.closest('.mention-item');
                if (!item) return;
                e.stopPropagation();
                var email = item.dataset.email;
                if (email) selectMention(email);
            });

            // ========== MODALS ==========
            function openModal(id) { document.getElementById(id).classList.add('active'); }
            function closeModal(id) {
                document.getElementById(id).classList.remove('active');
                if (id === 'roomModal') closeCreateSectionMenu();
                if (id === 'workspaceProfileConfirmModal') {
                    pendingWorkspaceProfile = null;
                    workspaceProfileTargetId = null;
                    var preview = document.getElementById('workspaceProfilePreview');
                    if (preview) preview.removeAttribute('src');
                }
            }

            document.querySelectorAll('.modal-overlay').forEach(m => {
                m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
            });

            document.addEventListener('click', e => {
                let searchBox = document.querySelector('.search-box');
                let searchResults = document.getElementById('workspaceSearchResults');
                let searchInput = document.getElementById('searchInput');
                if (searchBox && searchResults && searchInput && !searchBox.contains(e.target)) {
                    searchResults.classList.remove('show');
                    searchInput.setAttribute('aria-expanded', 'false');
                }
                let dropdown = document.getElementById('notifDropdown');
                let bell = document.querySelector('.bell-btn');
                if (!dropdown.contains(e.target) && !bell.contains(e.target)) dropdown.classList.remove('show');
                let slash = document.getElementById('slashMenu');
                if (!slash.contains(e.target)) hideSlashMenu();
                var mention = document.getElementById('mentionMenu');
                if (mention && mention.classList.contains('show') && !mention.contains(e.target)) hideMentionMenu();
                let bctx = document.getElementById('blockCtx');
                if (!bctx.contains(e.target)) bctx.classList.remove('show');
                let sectionCtx = document.getElementById('sectionCtx');
                if (sectionCtx && !sectionCtx.contains(e.target)) sectionCtx.classList.remove('show');
                let postitCtx = document.getElementById('postitCtx');
                if (postitCtx && !postitCtx.contains(e.target)) postitCtx.classList.remove('show');
                let ideaToolbar = document.getElementById('ideaToolbar');
                if (ideaToolbar && !ideaToolbar.contains(e.target)) closeIdeaToolbar();
                let saveMenu = document.getElementById('ideaSaveMenu');
                let saveButton = document.getElementById('ideaSaveBtn');
                if (saveMenu && saveButton && !saveMenu.contains(e.target) && !saveButton.contains(e.target)) closeIdeaSaveMenu();
                let teamPanel = document.getElementById('teamPanel');
                let teamButton = document.getElementById('teamButton');
                if (teamPanel && teamButton && !teamPanel.contains(e.target) && !teamButton.contains(e.target)) closeTeamPanel();
                let workspaceMenu = document.getElementById('workspaceMenu');
                let workspaceButton = document.getElementById('workspaceSwitcher');
                if (workspaceMenu && workspaceButton && !workspaceMenu.contains(e.target) && !workspaceButton.contains(e.target)) {
                    workspaceMenu.classList.remove('show');
                    workspaceButton.setAttribute('aria-expanded', 'false');
                }
                let createSectionSelect = document.getElementById('createSectionSelect');
                if (createSectionSelect && !createSectionSelect.contains(e.target)) closeCreateSectionMenu();
            });

            // ========== TOAST ==========
            function showToast(msg) { let t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }

            // ========== SEARCH ==========
            let workspaceSearchResults = [], workspaceSearchIndex = -1;
            function plainSearchText(value) {
                var temp = document.createElement('div'); temp.innerHTML = String(value || '');
                return (temp.textContent || '').replace(/\s+/g, ' ').trim();
            }
            function searchableBlockText(block) {
                if (!block) return '';
                var parts = [plainSearchText(block.content), block.title, block.name, block.fileName, block.filename, block.url, block.link];
                (block.taskRows || []).forEach(function (row) { parts.push(row.title, row.link, row.fileName, row.name); });
                (block.attachments || []).forEach(function (file) { parts.push(file.name, file.fileName, file.url, file.link, file.type); });
                return parts.filter(Boolean).join(' ');
            }
            function searchResultIcon(kind) {
                return { room: '📁', page: '📄', link: '🔗', file: '📎', postit: '📝', content: '⌕' }[kind] || '⌕';
            }
            function buildWorkspaceSearchResults(query) {
                var q = String(query || '').trim().toLocaleLowerCase();
                if (!q) return [];
                var results = [];
                function add(item, haystack) {
                    if (String(haystack || '').toLocaleLowerCase().includes(q)) results.push(item);
                }
                Object.keys(rooms).forEach(function (roomId) {
                    var roomName = (rooms[roomId] && rooms[roomId].name) || 'ไม่มีชื่อ';
                    add({ kind: 'room', title: roomName, meta: 'ห้อง', roomId: roomId }, roomName);

                    if (roomId === 'room-1') {
                        ideaPages.forEach(function (page) {
                            add({ kind: 'page', title: page.title || 'หน้ากระดาษ', meta: roomName, roomId: roomId, pageId: page.id }, page.title);
                            (page.blocks || []).forEach(function (block, blockIndex) {
                                var text = searchableBlockText(block); if (!text) return;
                                var kind = block.type === 'embed' ? 'link' : /\.pdf\b|\.docx?\b|\.xlsx?\b|\.pptx?\b|\.zip\b/i.test(text) ? 'file' : 'content';
                                add({ kind: kind, title: plainSearchText(text).substring(0, 90), meta: roomName + ' / ' + (page.title || 'หน้ากระดาษ'), roomId: roomId, pageId: page.id, blockIndex: blockIndex }, text);
                                (block.taskRows || []).forEach(function (row) {
                                    var rowText = [row.title, row.link, row.fileName].filter(Boolean).join(' ');
                                    add({ kind: /\.pdf\b|\.docx?\b|\.xlsx?\b|\.pptx?\b/i.test(rowText) ? 'file' : 'link', title: row.title || row.fileName || row.link, meta: roomName + ' / ' + (page.title || 'หน้ากระดาษ'), roomId: roomId, pageId: page.id, blockIndex: blockIndex }, rowText);
                                });
                            });
                        });
                        return;
                    }

                    if (isPostitRoomId(roomId)) {
                        var postPage = roomPages[roomId];
                        (postPage && postPage.postIts || []).forEach(function (post) {
                            var postText = [post.title].concat((post.blocks || []).map(searchableBlockText)).join(' ');
                            add({ kind: 'postit', title: post.title || 'โปสต์อิท', meta: roomName, roomId: roomId, postitId: post.id }, postText);
                        });
                        return;
                    }

                    var collection = roomPageCollections[roomId];
                    var pages = collection && Array.isArray(collection.pages) ? collection.pages : (roomPages[roomId] ? [roomPages[roomId]] : []);
                    pages.forEach(function (page) {
                        add({ kind: 'page', title: page.title || 'หน้ากระดาษ', meta: roomName, roomId: roomId, pageId: page.id }, page.title);
                        (page.blocks || []).forEach(function (block, blockIndex) {
                            var text = searchableBlockText(block); if (!text) return;
                            var kind = block.type === 'embed' ? 'link' : /\.pdf\b|\.docx?\b|\.xlsx?\b|\.pptx?\b|\.zip\b/i.test(text) ? 'file' : 'content';
                            add({ kind: kind, title: plainSearchText(text).substring(0, 90), meta: roomName + ' / ' + (page.title || 'หน้ากระดาษ'), roomId: roomId, pageId: page.id, blockIndex: blockIndex }, text);
                            (block.taskRows || []).forEach(function (row) {
                                var rowText = [row.title, row.link, row.fileName].filter(Boolean).join(' ');
                                add({ kind: /\.pdf\b|\.docx?\b|\.xlsx?\b|\.pptx?\b/i.test(rowText) ? 'file' : 'link', title: row.title || row.fileName || row.link, meta: roomName + ' / ' + (page.title || 'หน้ากระดาษ'), roomId: roomId, pageId: page.id, blockIndex: blockIndex }, rowText);
                            });
                        });
                    });
                });
                return results.slice(0, 60);
            }
            function renderWorkspaceSearchResults() {
                var panel = document.getElementById('workspaceSearchResults');
                var input = document.getElementById('searchInput');
                if (!panel || !input) return;
                if (!input.value.trim()) { panel.classList.remove('show'); input.setAttribute('aria-expanded', 'false'); panel.innerHTML = ''; return; }
                panel.innerHTML = workspaceSearchResults.length ? workspaceSearchResults.map(function (item, index) {
                    return '<button class="workspace-search-item' + (index === workspaceSearchIndex ? ' selected' : '') + '" role="option" aria-selected="' + String(index === workspaceSearchIndex) + '" onclick="openWorkspaceSearchResult(' + index + ')"><span class="workspace-search-icon">' + searchResultIcon(item.kind) + '</span><span class="workspace-search-copy"><span class="workspace-search-title">' + escapeHtml(item.title || 'ไม่มีชื่อ') + '</span><span class="workspace-search-meta">' + escapeHtml(item.meta || '') + '</span></span></button>';
                }).join('') : '<div class="workspace-search-empty">ไม่พบห้อง เอกสาร ไฟล์ หรือลิงก์ที่ค้นหา</div>';
                panel.classList.add('show'); input.setAttribute('aria-expanded', 'true');
            }
            function handleSearch(val) {
                workspaceSearchResults = buildWorkspaceSearchResults(val);
                workspaceSearchIndex = workspaceSearchResults.length ? 0 : -1;
                renderWorkspaceSearchResults();
            }
            function handleSearchKeydown(event) {
                if (!workspaceSearchResults.length) { if (event.key === 'Escape') { event.target.value = ''; handleSearch(''); } return; }
                if (event.key === 'ArrowDown') { event.preventDefault(); workspaceSearchIndex = (workspaceSearchIndex + 1) % workspaceSearchResults.length; renderWorkspaceSearchResults(); }
                else if (event.key === 'ArrowUp') { event.preventDefault(); workspaceSearchIndex = (workspaceSearchIndex - 1 + workspaceSearchResults.length) % workspaceSearchResults.length; renderWorkspaceSearchResults(); }
                else if (event.key === 'Enter') { event.preventDefault(); openWorkspaceSearchResult(Math.max(0, workspaceSearchIndex)); }
                else if (event.key === 'Escape') { document.getElementById('searchInput').value = ''; handleSearch(''); }
            }
            function openWorkspaceSearchResult(index) {
                var result = workspaceSearchResults[index]; if (!result || !rooms[result.roomId]) return;
                var roomEl = document.querySelector('.page-history-item[data-room="' + CSS.escape(result.roomId) + '"]');
                switchPage(result.roomId, roomEl);
                if (result.roomId === 'room-1' && result.pageId) switchIdeaPage(result.pageId);
                else if (result.pageId && !isPostitRoomId(result.roomId)) switchRoomPage(result.pageId);
                document.getElementById('searchInput').value = '';
                workspaceSearchResults = []; renderWorkspaceSearchResults();
                setTimeout(function () {
                    if (result.postitId) { openPostit(result.postitId); return; }
                    if (typeof result.blockIndex !== 'number') return;
                    var selector = result.roomId === 'room-1' ? '.idea-block[data-index="' + result.blockIndex + '"]' : '.editor-block[data-index="' + result.blockIndex + '"]';
                    var block = document.querySelector(selector);
                    if (!block) return;
                    block.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    block.animate([{ background: 'rgba(139,92,246,.22)' }, { background: 'transparent' }], { duration: 1800, easing: 'ease-out' });
                }, 120);
            }

            // ========== EDITOR RENDER ==========
            function renderEditor() {
                if (currentRoomId !== 'room-1' && roomPages[currentRoomId] && ensureRichBlockTrailingText(roomPages[currentRoomId].blocks)) scheduleWorkspaceSave();
                let roomName = workroomRoomName(currentRoomId);
                let breadcrumb = document.getElementById('headerBreadcrumb');
                if (breadcrumb) breadcrumb.innerHTML = escapeHtml(roomName) + ' <span>/</span> ' + escapeHtml(workroomSystemText('ไม่มีชื่อ'));
                let editorContainer = document.getElementById('editorContainer');
                let editorScroll = document.querySelector('.editor-scroll');
                let ideaToolbar = document.getElementById('ideaToolbar');
                let postitLibrary = document.getElementById('postitLibrary');
                var isPostitRoom = isPostitRoomId(currentRoomId);
                if (postitLibrary) postitLibrary.style.display = isPostitRoom ? 'block' : 'none';
                var newPageButton = document.getElementById('ideaNewPageBtn');
                if (newPageButton) newPageButton.style.display = isPostitRoom ? 'none' : '';
                if (ideaToolbar) {
                    var canUseTools = !activeWorkspace || activeWorkspace.role !== 'viewer';
                    ideaToolbar.style.display = canUseTools ? 'flex' : 'none';
                    ideaToolbar.classList.remove('expanded');
                    var toolbarToggle = document.getElementById('ideaToolbarToggle');
                    if (toolbarToggle) toolbarToggle.setAttribute('aria-expanded', 'false');
                }
                if (currentRoomId === 'room-1') {
                    editorContainer.classList.add('idea-mode');
                    if (editorScroll) editorScroll.classList.add('idea-mode-scroll');
                    document.getElementById('normalEditor').style.display = 'none';
                    document.getElementById('ideaEditor').style.display = 'block';
                    setTimeout(() => {
                        let canvas = document.getElementById('ideaCanvas');
                        let wrap = document.querySelector('.idea-canvas-wrap');
                        if (canvas && wrap) {
                            let rect = wrap.getBoundingClientRect();
                            canvas.width = rect.width;
                            canvas.height = rect.height;
                            renderWhiteboard();
                        }
                        renderIdeaPageTabs();
                        renderIdeaBlocks();
                        applyWorkspaceRole();
                    }, 50);
                    return;
                }
                editorContainer.classList.remove('idea-mode');
                if (editorScroll) editorScroll.classList.remove('idea-mode-scroll');
                if (isPostitRoom) {
                    document.getElementById('normalEditor').style.display = 'none';
                    document.getElementById('ideaEditor').style.display = 'none';
                    renderPostitLibrary();
                    postitLibrary.scrollTop = 0;
                    applyWorkspaceRole();
                    return;
                }
                document.getElementById('normalEditor').style.display = 'block';
                document.getElementById('ideaEditor').style.display = 'none';
                var collection = ensureRoomPageCollection(currentRoomId);
                let page = collection ? roomPages[currentRoomId] : { title: 'หน้าใหม่', blocks: [{ type: 'text', content: '' }] };
                var displayTitle = workroomSystemText(page.title || 'ไม่มีชื่อ');
                document.getElementById('pageTitle').value = displayTitle;
                if (breadcrumb) breadcrumb.innerHTML = escapeHtml(roomName) + ' <span>/</span> ' + escapeHtml(displayTitle);
                document.getElementById('normalEditor').scrollTop = 0;
                renderNormalPageTabs();
                let container = document.getElementById('editorBlocks');
                container.innerHTML = '';
                page.blocks.forEach((block, index) => createBlockElement(block, index, container, false));
                applyWorkspaceRole();
            }

            function deleteImageBlock(event, blockIndex, isIdea) {
                if (event) { event.preventDefault(); event.stopPropagation(); }
                if (activeWorkspace && activeWorkspace.role === 'viewer') return;
                var blocks = isIdea ? ideaDocBlocks : (roomPages[currentRoomId] && roomPages[currentRoomId].blocks);
                if (!blocks || !blocks[blockIndex] || blocks[blockIndex].type !== 'image') return;
                blocks[blockIndex] = { type: 'text', content: '' };
                if (isIdea) { saveIdeaBlocks(); renderIdeaBlocks(); }
                else { scheduleWorkspaceSave(); renderEditor(); }
                setTimeout(function () { if (isIdea) focusIdeaBlock(blockIndex); else focusBlock(blockIndex, false); }, 10);
                showToast(currentLang === 'en' ? 'Image deleted' : 'ลบรูปภาพแล้ว');
            }
            function createImageBlock(block, blockIndex, isIdea) {
                var frame = document.createElement('figure'); frame.className = 'image-block-frame';
                var source = safeImageSource(block.url || block.content);
                var image = document.createElement('img'); image.src = source; image.alt = block.alt || (currentLang === 'en' ? 'Inserted image' : 'รูปภาพที่แทรก');
                image.onclick = function () { if (source) window.open(source, '_blank', 'noopener,noreferrer'); };
                image.onerror = function () { frame.classList.add('is-error'); image.alt = currentLang === 'en' ? 'Unable to display image' : 'ไม่สามารถแสดงรูปภาพได้'; };
                var remove = document.createElement('button'); remove.type = 'button'; remove.className = 'image-block-delete'; remove.textContent = '×'; remove.title = currentLang === 'en' ? 'Delete image' : 'ลบรูปภาพ'; remove.setAttribute('aria-label', remove.title); remove.onclick = function (event) { deleteImageBlock(event, blockIndex, isIdea); };
                frame.appendChild(image); if (!activeWorkspace || activeWorkspace.role !== 'viewer') frame.appendChild(remove); return frame;
            }

            function normalizeEmbedUrl(value) {
                var raw = String(value || '').trim(); if (!raw) return null;
                var candidate = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
                try { var parsed = new URL(candidate); return /^https?:$/.test(parsed.protocol) ? parsed : null; }
                catch (e) { return null; }
            }
            function saveEmbedBlock(isIdea) { if (isIdea) saveIdeaBlocks(); else scheduleWorkspaceSave(); }
            function ensureRichBlockTrailingText(blocks) {
                if (!Array.isArray(blocks)) return false;
                var changed = false;
                for (var i = blocks.length - 1; i >= 0; i--) {
                    var needsWritingField = blocks[i].type === 'embed' || blocks[i].type === 'image';
                    if (needsWritingField && (!blocks[i + 1] || blocks[i + 1].type !== 'text')) {
                        blocks.splice(i + 1, 0, { type: 'text', content: '' }); changed = true;
                    }
                }
                return changed;
            }
            function deleteEmbedBlock(event, blockIndex, isIdea) {
                if (event) { event.preventDefault(); event.stopPropagation(); }
                if (activeWorkspace && activeWorkspace.role === 'viewer') return;
                var blocks = isIdea ? ideaDocBlocks : (roomPages[currentRoomId] && roomPages[currentRoomId].blocks);
                if (!blocks || !blocks[blockIndex] || blocks[blockIndex].type !== 'embed') return;
                blocks.splice(blockIndex, 1);
                if (!blocks[blockIndex] || blocks[blockIndex].type !== 'text') blocks.splice(blockIndex, 0, { type: 'text', content: '' });
                saveEmbedBlock(isIdea);
                if (isIdea) renderIdeaBlocks(); else renderEditor();
                setTimeout(function () { if (isIdea) focusIdeaBlock(blockIndex); else focusBlock(blockIndex, false); }, 10);
                showToast(currentLang === 'en' ? 'Link block deleted' : 'ลบบล็อกลิงก์แล้ว');
            }
            function createEmbedBlock(block, blockIndex, isIdea) {
                var readonly = !!(activeWorkspace && activeWorkspace.role === 'viewer');
                var card = document.createElement('div'); card.className = 'embed-card';
                var icon = document.createElement('span'); icon.className = 'embed-card-icon'; icon.textContent = '🔗';
                var copy = document.createElement('div'); copy.className = 'embed-card-copy';
                var input = document.createElement('input'); input.type = 'url'; input.className = 'embed-link-input'; input.value = block.content || '';
                input.placeholder = currentLang === 'en' ? 'Paste any website link...' : 'วางลิงก์เว็บไซต์ที่นี่...'; input.readOnly = readonly;
                var host = document.createElement('div'); host.className = 'embed-card-host';
                var open = document.createElement('button'); open.type = 'button'; open.className = 'embed-open-btn'; open.textContent = '↗'; open.title = currentLang === 'en' ? 'Open link' : 'เปิดลิงก์'; open.setAttribute('aria-label', open.title);
                var remove = document.createElement('button'); remove.type = 'button'; remove.className = 'embed-delete-btn'; remove.textContent = '×'; remove.title = currentLang === 'en' ? 'Delete link block' : 'ลบบล็อกลิงก์'; remove.setAttribute('aria-label', remove.title); remove.onclick = function (event) { deleteEmbedBlock(event, blockIndex, isIdea); };
                function syncLinkState() { var parsed = normalizeEmbedUrl(input.value); host.textContent = parsed ? parsed.hostname : (currentLang === 'en' ? 'Enter a valid link' : 'ใส่ลิงก์ที่ถูกต้อง'); open.disabled = !parsed; return parsed; }
                input.oninput = function () { block.content = input.value; syncLinkState(); saveEmbedBlock(isIdea); };
                input.onkeydown = function (event) { if (event.key === 'Enter') { event.preventDefault(); var parsed = syncLinkState(); if (parsed) window.open(parsed.href, '_blank', 'noopener,noreferrer'); } };
                open.onclick = function () { var parsed = syncLinkState(); if (parsed) window.open(parsed.href, '_blank', 'noopener,noreferrer'); };
                syncLinkState(); copy.append(input, host); card.append(icon, copy, open); if (!readonly) card.appendChild(remove); return card;
            }
            function focusEmbedInput(index, isIdea) {
                var selector = isIdea ? '.idea-block[data-index="' + index + '"] .embed-link-input' : '.editor-block[data-index="' + index + '"] .embed-link-input';
                var input = document.querySelector(selector); if (input) { input.focus(); input.select(); }
            }

            function ensureTaskRows(block) {
                if (Array.isArray(block.taskRows)) return block.taskRows;
                block.taskRows = [
                    { id: 'task-' + Date.now() + '-1', title: '', link: '', status: 'todo' },
                    { id: 'task-' + Date.now() + '-2', title: '', link: '', status: 'todo' }
                ];
                delete block.rows;
                return block.taskRows;
            }
            function saveTaskFlow(isIdea) { if (isIdea) saveIdeaBlocks(); else scheduleWorkspaceSave(); }
            function rerenderTaskFlow(isIdea) { if (isIdea) renderIdeaBlocks(); else renderEditor(); }
            function taskStatusLabel(status) {
                var labels = currentLang === 'en' ? { todo: 'Not started', doing: 'In progress', done: 'Completed' } : { todo: 'ยังไม่ได้ทำ', doing: 'กำลังทำ', done: 'ทำเสร็จแล้ว' };
                return labels[status] || labels.todo;
            }
            function deleteTaskFlowBlock(event, blockIndex, isIdea) {
                if (event) { event.preventDefault(); event.stopPropagation(); }
                if (activeWorkspace && activeWorkspace.role === 'viewer') return;
                var blocks = isIdea ? ideaDocBlocks : (roomPages[currentRoomId] && roomPages[currentRoomId].blocks);
                if (!blocks || !blocks[blockIndex] || blocks[blockIndex].type !== 'table') return;
                blocks[blockIndex] = { type: 'text', content: '' };
                saveTaskFlow(isIdea); rerenderTaskFlow(isIdea);
                setTimeout(function () { if (isIdea) focusIdeaBlock(blockIndex); else focusBlock(blockIndex, false); }, 10);
                showToast(currentLang === 'en' ? 'Task table deleted' : 'ลบตารางแล้ว');
            }
            function createTaskFlowTable(block, blockIndex, isIdea) {
                var rows = ensureTaskRows(block), readonly = !!(activeWorkspace && activeWorkspace.role === 'viewer');
                var root = document.createElement('section'); root.className = 'task-flow'; root.setAttribute('aria-label', currentLang === 'en' ? 'Task tracker' : 'ตารางติดตามงาน');
                var head = document.createElement('div'); head.className = 'task-flow-head';
                var title = document.createElement('div'); title.className = 'task-flow-title'; title.innerHTML = '<span class="task-flow-mark">✓</span><span>' + (currentLang === 'en' ? 'Task flow' : 'แผนงาน') + '</span>';
                var summary = document.createElement('div'); summary.className = 'task-flow-summary';
                ['todo', 'doing', 'done'].forEach(function (status) { var badge = document.createElement('span'); badge.className = 'task-flow-count ' + status; badge.textContent = taskStatusLabel(status) + ' ' + rows.filter(function (row) { return row.status === status; }).length; summary.appendChild(badge); });
                if (!readonly) { var deleteTable = document.createElement('button'); deleteTable.type = 'button'; deleteTable.className = 'task-flow-delete'; deleteTable.textContent = '×'; deleteTable.title = currentLang === 'en' ? 'Delete table' : 'ลบตาราง'; deleteTable.setAttribute('aria-label', deleteTable.title); deleteTable.onclick = function (event) { deleteTaskFlowBlock(event, blockIndex, isIdea); }; summary.appendChild(deleteTable); }
                head.append(title, summary); root.appendChild(head);
                var scroll = document.createElement('div'); scroll.className = 'task-flow-scroll'; var grid = document.createElement('div'); grid.className = 'task-flow-grid';
                var columns = document.createElement('div'); columns.className = 'task-flow-columns'; columns.innerHTML = '<div class="task-flow-cell">' + (currentLang === 'en' ? 'TASK' : 'งาน') + '</div><div class="task-flow-cell">' + (currentLang === 'en' ? 'LINK' : 'ลิงก์') + '</div><div class="task-flow-cell">' + (currentLang === 'en' ? 'STATUS' : 'สถานะ') + '</div><div></div>'; grid.appendChild(columns);
                rows.forEach(function (row, rowIndex) {
                    if (!['todo', 'doing', 'done'].includes(row.status)) row.status = 'todo';
                    var rowEl = document.createElement('div'); rowEl.className = 'task-flow-row';
                    var taskCell = document.createElement('div'); taskCell.className = 'task-flow-cell'; var taskInput = document.createElement('input'); taskInput.className = 'task-flow-input'; taskInput.value = row.title || ''; taskInput.placeholder = currentLang === 'en' ? 'Describe the task...' : 'เขียนชื่องาน...'; taskInput.readOnly = readonly; taskInput.oninput = function () { row.title = taskInput.value; saveTaskFlow(isIdea); }; taskCell.appendChild(taskInput);
                    var linkCell = document.createElement('div'); linkCell.className = 'task-flow-cell'; var linkWrap = document.createElement('div'); linkWrap.className = 'task-flow-link-wrap'; var linkInput = document.createElement('input'); linkInput.className = 'task-flow-input'; linkInput.type = 'url'; linkInput.value = row.link || ''; linkInput.placeholder = 'https://...'; linkInput.readOnly = readonly; linkInput.oninput = function () { row.link = linkInput.value; saveTaskFlow(isIdea); }; var openLink = document.createElement('button'); openLink.type = 'button'; openLink.className = 'task-flow-open'; openLink.textContent = '↗'; openLink.title = currentLang === 'en' ? 'Open link' : 'เปิดลิงก์'; openLink.onclick = function () { var value = (row.link || '').trim(); if (!value) return; var url = /^https?:\/\//i.test(value) ? value : 'https://' + value; try { var parsed = new URL(url); if (!/^https?:$/.test(parsed.protocol)) throw new Error(); window.open(parsed.href, '_blank', 'noopener,noreferrer'); } catch (e) { showToast(currentLang === 'en' ? 'Invalid website link' : 'ลิงก์เว็บไซต์ไม่ถูกต้อง'); } }; linkWrap.append(linkInput, openLink); linkCell.appendChild(linkWrap);
                    var statusCell = document.createElement('div'); statusCell.className = 'task-flow-cell'; var select = document.createElement('select'); select.className = 'task-flow-status ' + row.status; select.disabled = readonly;['todo', 'doing', 'done'].forEach(function (status) { var option = document.createElement('option'); option.value = status; option.textContent = taskStatusLabel(status); option.selected = row.status === status; select.appendChild(option); }); select.onchange = function () { row.status = select.value; saveTaskFlow(isIdea); rerenderTaskFlow(isIdea); }; statusCell.appendChild(select);
                    var removeCell = document.createElement('div'); var remove = document.createElement('button'); remove.type = 'button'; remove.className = 'task-flow-remove'; remove.textContent = '×'; remove.title = currentLang === 'en' ? 'Delete row' : 'ลบแถว'; remove.onclick = function () { rows.splice(rowIndex, 1); if (!rows.length) rows.push({ id: 'task-' + Date.now(), title: '', link: '', status: 'todo' }); saveTaskFlow(isIdea); rerenderTaskFlow(isIdea); }; removeCell.appendChild(remove);
                    rowEl.append(taskCell, linkCell, statusCell, removeCell); grid.appendChild(rowEl);
                });
                scroll.appendChild(grid); root.appendChild(scroll); var footer = document.createElement('div'); footer.className = 'task-flow-footer'; var add = document.createElement('button'); add.type = 'button'; add.className = 'task-flow-add'; add.textContent = currentLang === 'en' ? '＋ Add task' : '＋ เพิ่มงาน'; add.onclick = function () { rows.push({ id: 'task-' + Date.now(), title: '', link: '', status: 'todo' }); saveTaskFlow(isIdea); rerenderTaskFlow(isIdea); }; footer.appendChild(add); root.appendChild(footer); return root;
            }

            function createBlockElement(block, index, container, isIdea) {
                let div = document.createElement('div');
                div.className = 'editor-block block-' + block.type;
                div.dataset.index = index;
                div.dataset.type = block.type;

                let handle = document.createElement('div');
                handle.className = 'block-handle';
                handle.innerHTML = '⋮⋮';
                handle.title = 'ลากเพื่อย้าย';
                div.appendChild(handle);

                if (block.type === 'todo') {
                    let checkbox = document.createElement('div');
                    checkbox.className = 'todo-checkbox' + (block.checked ? ' checked' : '');
                    checkbox.onclick = e => { e.stopPropagation(); toggleTodo(index, isIdea); };
                    div.appendChild(checkbox);
                }

                if (block.type === 'divider') {
                    let line = document.createElement('div');
                    line.className = 'divider-line';
                    div.appendChild(line);
                    let remove = document.createElement('button');
                    remove.type = 'button';
                    remove.className = 'divider-delete-btn';
                    remove.textContent = '×';
                    remove.title = currentLang === 'en' ? 'Delete divider' : 'ลบเส้นแบ่ง';
                    remove.setAttribute('aria-label', remove.title);
                    remove.onclick = e => deleteDividerBlock(e, index, false);
                    div.appendChild(remove);
                }

                if (block.type === 'image') {
                    div.appendChild(createImageBlock(block, index, false));
                } else if (block.type === 'table') {
                    div.appendChild(createTaskFlowTable(block, index, false));
                } else if (block.type === 'embed') {
                    div.appendChild(createEmbedBlock(block, index, false));
                } else {
                    let content = document.createElement('div');
                    content.className = 'block-content';
                    content.setAttribute('contenteditable', block.type === 'code' ? 'plaintext-only' : 'true');
                    if (block.type === 'code') {
                        content.setAttribute('role', 'textbox');
                        content.setAttribute('aria-multiline', 'true');
                        content.spellcheck = false;
                    }
                    if (block.type === 'code') content.textContent = block.content || '';
                    else content.innerHTML = sanitizeEditorHtml(workroomSystemText(block.content || ''));
                    content.dataset.placeholder = getPlaceholder(block.type);
                    function toggleBlockEmpty(el) {
                        el.classList.toggle('is-empty', !el.innerText.trim() && !el.querySelector('img') && !el.querySelector('.mention-chip'));
                    }
                    toggleBlockEmpty(content);
                    content.addEventListener('input', () => toggleBlockEmpty(content));
                    content.addEventListener('keydown', e => handleBlockKeydown(e, index, isIdea));
                    content.addEventListener('input', e => handleBlockInput(e, index, isIdea));
                    content.addEventListener('focus', () => { hideSlashMenu(); });
                    if (block.type === 'code') bindCodeHighlighting(content);
                    if (isIdea) {
                        content.addEventListener('contextmenu', e => showBlockCtx(e, index));
                    }
                    div.appendChild(content);
                }

                container.appendChild(div);
            }

            function getPlaceholder(type) {
                let map = currentLang === 'en'
                    ? { text: 'Start writing...', h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3', bullet: 'List item', numbered: 'List item', todo: 'To do', quote: 'Quote', code: 'Code', table: 'Table', embed: 'https://...', image: 'Image URL' }
                    : { text: "เริ่มเขียนอะไรสักอย่าง...", h1: 'หัวข้อ 1', h2: 'หัวข้อ 2', h3: 'หัวข้อ 3', bullet: 'รายการ', numbered: 'รายการ', todo: 'สิ่งที่ต้องทำ', quote: 'ข้อความอ้างอิง', code: 'โค้ด', table: 'ตาราง', embed: 'https://...', image: 'URL รูปภาพ' };
                return map[type] || 'เขียนข้อความ...';
            }

            function deleteDividerBlock(event, index, isIdea) {
                if (event) { event.preventDefault(); event.stopPropagation(); }
                if (activeWorkspace && activeWorkspace.role === 'viewer') return;
                var blocks = isIdea ? ideaDocBlocks : (roomPages[currentRoomId] && roomPages[currentRoomId].blocks);
                if (!blocks || !blocks[index] || blocks[index].type !== 'divider') return;
                blocks.splice(index, 1);
                if (!blocks.length) blocks.push({ type: 'text', content: '' });
                var focusIndex = Math.min(index, blocks.length - 1);
                if (isIdea) {
                    saveIdeaBlocks(); renderIdeaBlocks();
                    setTimeout(() => focusIdeaBlock(focusIndex), 10);
                } else {
                    scheduleWorkspaceSave(); renderEditor();
                    setTimeout(() => focusBlock(focusIndex, false), 10);
                }
                showToast(currentLang === 'en' ? 'Divider deleted' : 'ลบเส้นแบ่งแล้ว');
            }

            function insertCodeAtCaret(content, text) {
                var selection = window.getSelection();
                if (!selection || !selection.rangeCount) return;
                var range = selection.getRangeAt(0);
                range.deleteContents();
                var node = document.createTextNode(text);
                range.insertNode(node);
                range.setStartAfter(node);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                content.dispatchEvent(new Event('input', { bubbles: true }));
            }

            function escapeCodeHtml(value) {
                return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
            function highlightCodeText(code) {
                var pattern = /(< !--[\s\S ]*?- ->|\/\*[\s\S]*?\*\/|\/\/[^\n]*|^[ \t]*#[^\n]*|<\/?[A-Za-z][^>\n]*>|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:async|await|break|case|catch|class|const|continue|def|delete|do|else|export|extends|false|finally|for|from|function|if|import|in|instanceof|interface|let|new|null|of|pass|private|protected|public|raise|return|static|super|switch|this|throw|true|try|type|typeof|undefined|var|void|while|with|yield)\b|\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?)\b|[=+\-*\/%<>!&|?:~^]+)/gm;
                var output = '', lastIndex = 0, match;
                while ((match = pattern.exec(code)) !== null) {
                    output += escapeCodeHtml(code.slice(lastIndex, match.index));
                    var token = match[0], cls = 'operator';
                    if (/^(?:< !--|\/\*|\/\/|\s*#)/.test(token)) cls = 'comment';
                    else if (/^["'`]/.test(token)) cls = 'string';
                    else if (/^<\/?[A-Za-z]/.test(token)) cls = 'tag';
                    else if (/^(?:0x[\da-fA-F]+|\d)/.test(token)) cls = 'number';
                    else if (/^[A-Za-z_$]/.test(token)) cls = 'keyword';
                    output += '<span class="code-token-' + cls + '">' + escapeCodeHtml(token) + '</span>';
                    lastIndex = pattern.lastIndex;
                }
                return output + escapeCodeHtml(code.slice(lastIndex));
            }
            function getCaretTextOffset(root) {
                var selection = window.getSelection();
                if (!selection || !selection.rangeCount || !root.contains(selection.anchorNode)) return null;
                var range = selection.getRangeAt(0).cloneRange();
                range.selectNodeContents(root);
                range.setEnd(selection.anchorNode, selection.anchorOffset);
                return range.toString().length;
            }
            function restoreCaretTextOffset(root, offset) {
                if (offset === null) return;
                var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
                var remaining = offset, node;
                while ((node = walker.nextNode())) {
                    if (remaining <= node.nodeValue.length) {
                        var range = document.createRange();
                        range.setStart(node, remaining); range.collapse(true);
                        var selection = window.getSelection();
                        selection.removeAllRanges(); selection.addRange(range);
                        return;
                    }
                    remaining -= node.nodeValue.length;
                }
                var fallback = document.createRange();
                fallback.selectNodeContents(root); fallback.collapse(false);
                var fallbackSelection = window.getSelection();
                fallbackSelection.removeAllRanges(); fallbackSelection.addRange(fallback);
            }
            function applyCodeHighlight(content, preserveCaret) {
                if (!content || content.dataset.composing === '1') return;
                var code = content.textContent || '';
                var offset = preserveCaret ? getCaretTextOffset(content) : null;
                content.innerHTML = code ? highlightCodeText(code) : '';
                restoreCaretTextOffset(content, offset);
            }
            function bindCodeHighlighting(content) {
                applyCodeHighlight(content, false);
                content.addEventListener('compositionstart', function () { content.dataset.composing = '1'; });
                content.addEventListener('compositionend', function () { content.dataset.composing = '0'; applyCodeHighlight(content, true); });
                content.addEventListener('input', function () {
                    if (content.dataset.highlightScheduled === '1') return;
                    content.dataset.highlightScheduled = '1';
                    requestAnimationFrame(function () {
                        content.dataset.highlightScheduled = '0';
                        applyCodeHighlight(content, true);
                    });
                });
            }

            function handleBlockKeydown(e, index, isIdea) {
                let page = isIdea ? roomPages['room-1'] : roomPages[currentRoomId];
                let block = page.blocks[index];
                let content = e.target;

                if (handleMentionMenuKeydown(e)) return;

                if (block.type === 'code') {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        insertCodeAtCaret(content, '    ');
                        return;
                    }
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        page.blocks.splice(index + 1, 0, { type: 'text', content: '' });
                        scheduleWorkspaceSave(); renderEditor();
                        setTimeout(() => focusBlock(index + 1, false), 10);
                        return;
                    }
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        insertCodeAtCaret(content, '\n');
                        return;
                    }
                }

                if (e.key === 'Enter' && !e.shiftKey) {
                    if (document.getElementById('mentionMenu').classList.contains('show') || document.getElementById('slashMenu').classList.contains('show')) return;
                    e.preventDefault();
                    let sel = window.getSelection();
                    let range = sel.getRangeAt(0);
                    let text = content.innerText;
                    let offset = range.startOffset;
                    let before = text.substring(0, offset);
                    let after = text.substring(offset);
                    block.content = before;
                    let newBlock = { type: 'text', content: after };
                    page.blocks.splice(index + 1, 0, newBlock);
                    if (isIdea) renderIdeaDoc(); else renderEditor();
                    setTimeout(() => focusBlock(index + 1, isIdea), 10);
                    return;
                }

                if (e.key === 'Backspace') {
                    let sel = window.getSelection();
                    let isEmpty = !content.innerText.trim() || content.innerText.trim() === '\n';
                    let isAtStart = sel.rangeCount > 0 && ((sel.getRangeAt(0).startOffset === 0 && sel.getRangeAt(0).collapsed) || isEmpty);
                    if (isAtStart) {
                        if (block.type !== 'text') {
                            e.preventDefault();
                            block.type = 'text';
                            if (isIdea) renderIdeaDoc(); else renderEditor();
                            setTimeout(() => focusBlock(index, isIdea), 10);
                            return;
                        }
                        if (index > 0) {
                            e.preventDefault();
                            let prev = page.blocks[index - 1];
                            let prevLen = prev.content.length;
                            prev.content += block.content;
                            page.blocks.splice(index, 1);
                            if (isIdea) renderIdeaDoc(); else renderEditor();
                            setTimeout(() => { let el = getBlockContent(index - 1, isIdea); if (el) setCursor(el, prevLen); }, 10);
                            return;
                        }
                    }
                }

                if (e.key === 'ArrowDown') {
                    let sel = window.getSelection();
                    let range = sel.getRangeAt(0);
                    let rect = range.getBoundingClientRect();
                    let blockRect = content.getBoundingClientRect();
                    if (rect.bottom >= blockRect.bottom - 2) {
                        e.preventDefault();
                        focusBlock(index + 1, isIdea, true);
                    }
                }
                if (e.key === 'ArrowUp') {
                    let sel = window.getSelection();
                    let range = sel.getRangeAt(0);
                    let rect = range.getBoundingClientRect();
                    let blockRect = content.getBoundingClientRect();
                    if (rect.top <= blockRect.top + 2) {
                        e.preventDefault();
                        focusBlock(index - 1, isIdea, false);
                    }
                }

                if (document.getElementById('slashMenu').classList.contains('show')) {
                    let items = document.querySelectorAll('.slash-item');
                    if (e.key === 'ArrowDown') { e.preventDefault(); slashMenuIndex = (slashMenuIndex + 1) % items.length; updateSlashSelection(); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); slashMenuIndex = (slashMenuIndex - 1 + items.length) % items.length; updateSlashSelection(); }
                    else if (e.key === 'Enter') { e.preventDefault(); selectSlashType(items[slashMenuIndex].dataset.type); }
                    else if (e.key === 'Escape') { e.preventDefault(); hideSlashMenu(); }
                }
            }

            function derivePageTitle(text) {
                var normalized = String(text || '').replace(/\u00a0/g, ' ').trim();
                if (!normalized) return '';
                var firstLine = normalized.split(/\r?\n/)[0].trim();
                var firstSentence = firstLine.match(/^.*?[.!?。！？](?=\s|$)/);
                return (firstSentence ? firstSentence[0] : firstLine).trim().substring(0, 48);
            }

            function handleBlockInput(e, index, isIdea) {
                let page = isIdea ? roomPages['room-1'] : roomPages[currentRoomId];
                let block = page.blocks[index];
                let text = e.target.innerText;
                block.content = e.target.querySelector('.mention-chip') ? sanitizeEditorHtml(e.target.innerHTML) : text;

                if (!isIdea && index === 0 && text.trim() !== '') {
                    let newTitle = derivePageTitle(text);
                    if (newTitle && page.title !== newTitle) {
                        page.title = newTitle;

                        let titleInput = document.getElementById('pageTitle');
                        if (titleInput) titleInput.value = newTitle;

                        let breadcrumb = document.getElementById('headerBreadcrumb');
                        if (breadcrumb) breadcrumb.innerHTML = escapeHtml(rooms[currentRoomId] ? rooms[currentRoomId].name : '') + ' <span>/</span> ' + escapeHtml(newTitle);

                        saveActiveWorkspaceData();
                        renderNormalPageTabs();
                    }
                }

                if (text === '# ' && block.type === 'text') { block.type = 'h1'; block.content = ''; if (isIdea) renderIdeaDoc(); else renderEditor(); setTimeout(() => focusBlock(index, isIdea), 10); return; }
                if (text === '## ' && block.type === 'text') { block.type = 'h2'; block.content = ''; if (isIdea) renderIdeaDoc(); else renderEditor(); setTimeout(() => focusBlock(index, isIdea), 10); return; }
                if (text === '### ' && block.type === 'text') { block.type = 'h3'; block.content = ''; if (isIdea) renderIdeaDoc(); else renderEditor(); setTimeout(() => focusBlock(index, isIdea), 10); return; }
                if (text === '- ' && block.type === 'text') { block.type = 'bullet'; block.content = ''; if (isIdea) renderIdeaDoc(); else renderEditor(); setTimeout(() => focusBlock(index, isIdea), 10); return; }
                if (text === '1. ' && block.type === 'text') { block.type = 'numbered'; block.content = ''; if (isIdea) renderIdeaDoc(); else renderEditor(); setTimeout(() => focusBlock(index, isIdea), 10); return; }
                if (text === '[] ' && block.type === 'text') { block.type = 'todo'; block.content = ''; block.checked = false; if (isIdea) renderIdeaDoc(); else renderEditor(); setTimeout(() => focusBlock(index, isIdea), 10); return; }
                if (text === '> ' && block.type === 'text') { block.type = 'quote'; block.content = ''; if (isIdea) renderIdeaDoc(); else renderEditor(); setTimeout(() => focusBlock(index, isIdea), 10); return; }
                if (text === '---' && block.type === 'text') {
                    block.type = 'divider'; block.content = '';
                    var targetBlocks = isIdea ? ideaDocBlocks : page.blocks;
                    targetBlocks.splice(index + 1, 0, { type: 'text', content: '' });
                    if (isIdea) { saveIdeaBlocks(); renderIdeaBlocks(); setTimeout(() => focusIdeaBlock(index + 1), 10); }
                    else { scheduleWorkspaceSave(); renderEditor(); setTimeout(() => focusBlock(index + 1, false), 10); }
                    return;
                }
                if (text === '```' && block.type === 'text') { block.type = 'code'; block.content = ''; if (isIdea) renderIdeaDoc(); else renderEditor(); setTimeout(() => focusBlock(index, isIdea), 10); return; }

                if (text.startsWith('/') && block.type === 'text') {
                    showSlashMenu(e.target, index);
                } else {
                    hideSlashMenu();
                }

                // Detect @ mention
                if (text.includes('@') && block.type !== 'code' && block.type !== 'divider') {
                    let atIdx = text.lastIndexOf('@');
                    let afterAt = text.substring(atIdx + 1);
                    if (!afterAt.includes(' ')) {
                        mentionTarget = e.target;
                        showMentionMenu(e.target, index, afterAt);
                    } else {
                        hideMentionMenu();
                    }
                } else {
                    hideMentionMenu();
                }
            }

            function focusBlock(index, isIdea, toStart) {
                let container = isIdea ? document.getElementById('ideaDocBlocks') : document.getElementById('editorBlocks');
                let blocks = container.querySelectorAll('.editor-block');
                if (index < 0 || index >= blocks.length) return;
                let content = blocks[index].querySelector('.block-content');
                if (!content) return;
                content.focus();
                let sel = window.getSelection();
                let range = document.createRange();
                if (toStart === true) range.setStart(content.firstChild || content, 0);
                else if (toStart === false) {
                    let len = content.innerText.length;
                    range.setStart(content.firstChild || content, len);
                } else {
                    let len = content.innerText.length;
                    range.setStart(content.firstChild || content, len);
                }
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }

            function getBlockContent(index, isIdea) {
                let container = isIdea ? document.getElementById('ideaDocBlocks') : document.getElementById('editorBlocks');
                let blocks = container.querySelectorAll('.editor-block');
                if (index < 0 || index >= blocks.length) return null;
                return blocks[index].querySelector('.block-content');
            }

            function setCursor(el, offset) {
                let sel = window.getSelection();
                let range = document.createRange();
                let node = el.firstChild || el;
                let pos = Math.min(offset, node.length || 0);
                range.setStart(node, pos);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }

            function toggleTodo(index, isIdea) {
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                let page = isIdea ? roomPages['room-1'] : roomPages[currentRoomId];
                if (!page.blocks[index]) return;
                page.blocks[index].checked = !page.blocks[index].checked;
                if (isIdea) renderIdeaDoc(); else renderEditor();
                scheduleWorkspaceSave();
                setTimeout(() => focusBlock(index, isIdea), 10);
            }

            // ========== SLASH MENU ==========
            function showSlashMenu(targetEl, index) {
                slashMenuTarget = index;
                slashMenuIndex = 0;
                let menu = document.getElementById('slashMenu');
                let rect = targetEl.getBoundingClientRect();
                menu.style.left = (rect.left + 40) + 'px';
                menu.style.top = (rect.bottom + 4) + 'px';
                menu.classList.add('show');
                updateSlashSelection();
            }

            function hideSlashMenu() {
                document.getElementById('slashMenu').classList.remove('show');
                slashMenuTarget = null;
            }

            function updateSlashSelection() {
                document.querySelectorAll('.slash-item').forEach((item, i) => {
                    item.classList.toggle('selected', i === slashMenuIndex);
                });
            }

            function selectSlashType(type) {
                if (slashMenuTarget === null) return;
                let isIdea = currentRoomId === 'room-1';
                let page = isIdea ? null : roomPages[currentRoomId];
                let block = isIdea ? ideaDocBlocks[slashMenuTarget] : page.blocks[slashMenuTarget];

                if (type === 'image') {
                    let input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.style.display = 'none';
                    input.onchange = function (e) {
                        let file = e.target.files[0];
                        if (!file) return;
                        if (!isAllowedRasterImageFile(file)) return showToast(currentLang === 'en' ? 'Use a PNG, JPEG, GIF or WebP image' : 'รองรับเฉพาะรูป PNG, JPEG, GIF หรือ WebP');
                        if (file.size > 5 * 1024 * 1024) return showToast(currentLang === 'en' ? 'Image must not exceed 5 MB' : 'รูปภาพต้องมีขนาดไม่เกิน 5 MB');
                        let reader = new FileReader();
                        reader.onload = function (evt) {
                            block.type = 'image';
                            block.content = evt.target.result;
                            block.url = evt.target.result;
                            var blocks = isIdea ? ideaDocBlocks : page.blocks;
                            var writingIndex = slashMenuTarget + 1;
                            blocks.splice(writingIndex, 0, { type: 'text', content: '' });
                            hideSlashMenu();
                            if (isIdea) { saveIdeaBlocks(); renderIdeaBlocks(); }
                            else { scheduleWorkspaceSave(); renderEditor(); }
                            setTimeout(function () {
                                if (isIdea) focusIdeaBlock(writingIndex);
                                else focusBlock(writingIndex, false);
                            }, 10);
                            showToast(currentLang === 'en' ? 'Image inserted' : 'แทรกรูปภาพแล้ว');
                        };
                        reader.readAsDataURL(file);
                    };
                    document.body.appendChild(input);
                    input.click();
                    setTimeout(() => input.remove(), 1000);
                    return;
                }

                if (type === 'mention') {
                    var targetBlockIndex = slashMenuTarget;
                    block.type = 'text';
                    block.content = '@';
                    hideSlashMenu();
                    if (isIdea) { saveIdeaBlocks(); renderIdeaBlocks(); }
                    else { scheduleWorkspaceSave(); renderEditor(); }
                    setTimeout(function () {
                        var selector = isIdea
                            ? '#ideaBlocks .idea-block[data-index="' + targetBlockIndex + '"] .ib-content'
                            : '#editorBlocks .editor-block[data-index="' + targetBlockIndex + '"] .block-content';
                        var target = document.querySelector(selector);
                        if (!target) return;
                        target.focus();
                        mentionTarget = target;
                        showMentionMenu(target, targetBlockIndex, '');
                    }, 10);
                    return;
                }

                block.type = type;
                if (type === 'todo') block.checked = false;
                if (type === 'table') {
                    block.taskRows = [
                        { id: 'task-' + Date.now() + '-1', title: '', link: '', status: 'todo' },
                        { id: 'task-' + Date.now() + '-2', title: '', link: '', status: 'todo' }
                    ];
                    delete block.rows; delete block.attachments;
                }
                block.content = '';
                var focusIndex = slashMenuTarget;
                if (type === 'divider' || type === 'embed') {
                    var blocks = isIdea ? ideaDocBlocks : page.blocks;
                    blocks.splice(slashMenuTarget + 1, 0, { type: 'text', content: '' });
                    if (type === 'divider') focusIndex = slashMenuTarget + 1;
                }
                hideSlashMenu();
                saveIdeaBlocks();
                if (isIdea) {
                    renderIdeaBlocks();
                    setTimeout(() => type === 'embed' ? focusEmbedInput(focusIndex, true) : focusIdeaBlock(focusIndex), 10);
                } else {
                    scheduleWorkspaceSave(); renderEditor();
                    setTimeout(() => type === 'embed' ? focusEmbedInput(focusIndex, false) : focusBlock(focusIndex, false), 10);
                }
            }

            // ========== BLOCK CONTEXT MENU ==========
            function showBlockCtx(e, index) {
                e.preventDefault();
                blockCtxIndex = index;
                let menu = document.getElementById('blockCtx');
                menu.style.left = e.clientX + 'px';
                menu.style.top = e.clientY + 'px';
                menu.classList.add('show');
            }

            function openSectionContext(event, sectionId) {
                event.preventDefault();
                event.stopPropagation();
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                contextSectionId = sectionId;
                var menu = document.getElementById('sectionCtx');
                menu.classList.add('show');
                var width = menu.offsetWidth || 180;
                var height = menu.offsetHeight || 44;
                menu.style.left = Math.min(event.clientX, window.innerWidth - width - 10) + 'px';
                menu.style.top = Math.min(event.clientY, window.innerHeight - height - 10) + 'px';
            }

            function deleteRoomSection() {
                var menu = document.getElementById('sectionCtx');
                if (menu) menu.classList.remove('show');
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                if (roomSections.length <= 1) return showToast('ต้องมีหัวข้อห้องอย่างน้อย 1 หัวข้อ');
                var index = roomSections.findIndex(function (section) { return section.id === contextSectionId; });
                if (index === -1) return;
                var deleted = roomSections[index];
                var fallback = roomSections.find(function (section) { return section.id !== deleted.id; });
                Object.keys(rooms).forEach(function (id) {
                    if (rooms[id].sectionId === deleted.id) rooms[id].sectionId = fallback.id;
                });
                roomSections.splice(index, 1);
                contextSectionId = null;
                saveActiveWorkspaceData();
                renderWorkspaceRooms();
                showToast('ลบหัวข้อ "' + deleted.name + '" แล้ว');
            }

            function deleteIdeaPage(event, pageId) {
                if (event) { event.preventDefault(); event.stopPropagation(); }
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                if (ideaPages.length <= 1) return showToast('ต้องมีหน้ากระดาษอย่างน้อย 1 หน้า');
                var index = ideaPages.findIndex(function (page) { return page.id === pageId; });
                if (index === -1) return;
                var deletedPage = ideaPages[index];
                ideaPages.splice(index, 1);
                if (activeIdeaPageId === deletedPage.id) {
                    var nextPage = ideaPages[Math.min(index, ideaPages.length - 1)];
                    activeIdeaPageId = nextPage.id;
                    syncActiveIdeaPageRefs();
                    renderIdeaBlocks();
                    renderWhiteboard();
                }
                renderIdeaPageTabs();
                saveActiveWorkspaceData();
                showToast('ลบหน้ากระดาษแล้ว');
            }

            function deleteBlock() {
                document.getElementById('blockCtx').classList.remove('show');
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                if (blockCtxIndex === null) return;
                if (currentRoomId === 'room-1') {
                    ideaDocBlocks.splice(blockCtxIndex, 1);
                    if (ideaDocBlocks.length === 0) ideaDocBlocks.push({ type: 'text', content: '' });
                    saveIdeaBlocks();
                    renderIdeaBlocks();
                } else {
                    roomPages[currentRoomId].blocks.splice(blockCtxIndex, 1);
                    renderEditor();
                }
                scheduleWorkspaceSave();
                showToast('ลบบล็อกแล้ว');
            }


            // ========== IDEA BLOCK EDITOR ==========
            function saveIdeaBlocks() {
                scheduleWorkspaceSave();
            }

            function renderIdeaBlocks() {
                let container = document.getElementById('ideaBlocks');
                if (!container) return;
                if (ensureRichBlockTrailingText(ideaDocBlocks)) saveIdeaBlocks();
                container.innerHTML = '';
                ideaDocBlocks.forEach((block, index) => createIdeaBlockElement(block, index, container));
            }

            function createIdeaBlockElement(block, index, container) {
                let div = document.createElement('div');
                div.className = 'idea-block idea-block-' + block.type;
                div.dataset.index = index;

                let handle = document.createElement('div');
                handle.className = 'ib-handle';
                handle.innerHTML = '⋮⋮';
                handle.title = 'ลากเพื่อย้าย';
                div.appendChild(handle);

                if (block.type === 'todo') {
                    let check = document.createElement('div');
                    check.className = 'ib-todo-check' + (block.checked ? ' checked' : '');
                    check.onclick = e => { e.stopPropagation(); toggleIdeaTodo(index); };
                    div.appendChild(check);
                }

                if (block.type === 'divider') {
                    let line = document.createElement('div');
                    line.className = 'ib-divider-line';
                    div.appendChild(line);
                    let remove = document.createElement('button');
                    remove.type = 'button';
                    remove.className = 'divider-delete-btn';
                    remove.textContent = '×';
                    remove.title = currentLang === 'en' ? 'Delete divider' : 'ลบเส้นแบ่ง';
                    remove.setAttribute('aria-label', remove.title);
                    remove.onclick = e => deleteDividerBlock(e, index, true);
                    div.appendChild(remove);
                }

                if (block.type === 'image') {
                    div.appendChild(createImageBlock(block, index, true));
                    container.appendChild(div);
                    return;
                }

                if (block.type === 'table') {
                    div.appendChild(createTaskFlowTable(block, index, true));
                    container.appendChild(div);
                    return;
                }

                if (block.type === 'embed') {
                    div.appendChild(createEmbedBlock(block, index, true));
                    container.appendChild(div);
                    return;
                }

                let content = document.createElement('div');
                content.className = 'ib-content';
                content.setAttribute('contenteditable', block.type === 'code' ? 'plaintext-only' : 'true');
                if (block.type === 'code') {
                    content.setAttribute('role', 'textbox');
                    content.setAttribute('aria-multiline', 'true');
                    content.spellcheck = false;
                }
                if (block.type === 'code') content.textContent = block.content || '';
                else content.innerHTML = sanitizeEditorHtml(workroomSystemText(block.content || ''));
                content.dataset.placeholder = getIdeaPlaceholder(block.type);
                function toggleIbEmpty(el) {
                    el.classList.toggle('is-empty', !el.innerText.trim() && !el.querySelector('img') && !el.querySelector('.mention-chip'));
                }
                toggleIbEmpty(content);
                content.addEventListener('input', () => toggleIbEmpty(content));
                content.addEventListener('keydown', e => handleIdeaKeydown(e, index));
                content.addEventListener('input', e => handleIdeaInput(e, index));
                content.addEventListener('focus', () => { hideSlashMenu(); });
                if (block.type === 'code') bindCodeHighlighting(content);
                content.addEventListener('contextmenu', e => showIdeaBlockCtx(e, index));
                div.appendChild(content);

                container.appendChild(div);
            }

            function getIdeaPlaceholder(type) {
                let map = currentLang === 'en'
                    ? { text: 'Start writing...', h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3', bullet: 'List item', numbered: 'List item', todo: 'To do', quote: 'Quote', divider: '', code: 'Code', table: 'Table', embed: 'https://...', image: 'Image URL' }
                    : { text: "เริ่มเขียนอะไรสักอย่าง...", h1: 'หัวข้อ 1', h2: 'หัวข้อ 2', h3: 'หัวข้อ 3', bullet: 'รายการ', numbered: 'รายการ', todo: 'สิ่งที่ต้องทำ', quote: 'ข้อความอ้างอิง', divider: '', code: 'โค้ด', table: 'ตาราง', embed: 'https://...', image: 'URL รูปภาพ' };
                return map[type] || (currentLang === 'en' ? 'Type something...' : 'พิมพ์ข้อความ...');
            }

            function handleIdeaKeydown(e, index) {
                let block = ideaDocBlocks[index];
                let content = e.target;

                if (handleMentionMenuKeydown(e)) return;

                if (block.type === 'code') {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        insertCodeAtCaret(content, '    ');
                        return;
                    }
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        ideaDocBlocks.splice(index + 1, 0, { type: 'text', content: '' });
                        saveIdeaBlocks(); renderIdeaBlocks();
                        setTimeout(() => focusIdeaBlock(index + 1), 10);
                        return;
                    }
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        insertCodeAtCaret(content, '\n');
                        return;
                    }
                }

                if (e.key === 'Enter' && !e.shiftKey) {
                    if (document.getElementById('mentionMenu').classList.contains('show') || document.getElementById('slashMenu').classList.contains('show')) return;
                    e.preventDefault();
                    let sel = window.getSelection();
                    let range = sel.getRangeAt(0);
                    let text = content.innerText;
                    let offset = range.startOffset;
                    let before = text.substring(0, offset);
                    let after = text.substring(offset);
                    block.content = before;
                    let newBlock = { type: 'text', content: after };
                    ideaDocBlocks.splice(index + 1, 0, newBlock);
                    saveIdeaBlocks();
                    renderIdeaBlocks();
                    setTimeout(() => focusIdeaBlock(index + 1), 10);
                    return;
                }

                if (e.key === 'Backspace') {
                    let sel = window.getSelection();
                    let isEmpty = !content.innerText.trim() || content.innerText.trim() === '\n';
                    let isAtStart = sel.rangeCount > 0 && ((sel.getRangeAt(0).startOffset === 0 && sel.getRangeAt(0).collapsed) || isEmpty);
                    if (isAtStart) {
                        if (block.type !== 'text') {
                            e.preventDefault();
                            block.type = 'text';
                            renderIdeaBlocks();
                            setTimeout(() => focusIdeaBlock(index), 10);
                            return;
                        }
                        if (index > 0) {
                            e.preventDefault();
                            let prev = ideaDocBlocks[index - 1];
                            let prevLen = prev.content.length;
                            prev.content += block.content;
                            ideaDocBlocks.splice(index, 1);
                            saveIdeaBlocks();
                            renderIdeaBlocks();
                            setTimeout(() => {
                                let el = getIdeaBlockContent(index - 1);
                                if (el) {
                                    let sel = window.getSelection();
                                    let range = document.createRange();
                                    let node = el.firstChild || el;
                                    let pos = Math.min(prevLen, node.length || 0);
                                    range.setStart(node, pos);
                                    range.collapse(true);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                }
                            }, 10);
                            return;
                        }
                    }
                }

                if (e.key === 'ArrowDown') {
                    let sel = window.getSelection();
                    let range = sel.getRangeAt(0);
                    let rect = range.getBoundingClientRect();
                    let blockRect = content.getBoundingClientRect();
                    if (rect.bottom >= blockRect.bottom - 2) {
                        e.preventDefault();
                        focusIdeaBlock(index + 1, true);
                    }
                }
                if (e.key === 'ArrowUp') {
                    let sel = window.getSelection();
                    let range = sel.getRangeAt(0);
                    let rect = range.getBoundingClientRect();
                    let blockRect = content.getBoundingClientRect();
                    if (rect.top <= blockRect.top + 2) {
                        e.preventDefault();
                        focusIdeaBlock(index - 1, false);
                    }
                }

                if (document.getElementById('slashMenu').classList.contains('show')) {
                    let items = document.querySelectorAll('.slash-item');
                    if (e.key === 'ArrowDown') { e.preventDefault(); slashMenuIndex = (slashMenuIndex + 1) % items.length; updateSlashSelection(); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); slashMenuIndex = (slashMenuIndex - 1 + items.length) % items.length; updateSlashSelection(); }
                    else if (e.key === 'Enter') { e.preventDefault(); selectSlashType(items[slashMenuIndex].dataset.type); }
                    else if (e.key === 'Escape') { e.preventDefault(); hideSlashMenu(); }
                }
            }

            function handleIdeaInput(e, index) {
                let block = ideaDocBlocks[index];
                let text = e.target.innerText;
                block.content = e.target.querySelector('.mention-chip') ? sanitizeEditorHtml(e.target.innerHTML) : text;
                saveIdeaBlocks();

                if (index === 0 && text.trim()) {
                    var activePage = ideaPages.find(function (page) { return page.id === activeIdeaPageId; });
                    var newPageTitle = derivePageTitle(text);
                    if (activePage && newPageTitle && activePage.title !== newPageTitle) {
                        activePage.title = newPageTitle;
                        renderIdeaPageTabs();
                        scheduleWorkspaceSave();
                    }
                }

                if (text === '# ' && block.type === 'text') { block.type = 'h1'; block.content = ''; renderIdeaBlocks(); setTimeout(() => focusIdeaBlock(index), 10); return; }
                if (text === '## ' && block.type === 'text') { block.type = 'h2'; block.content = ''; renderIdeaBlocks(); setTimeout(() => focusIdeaBlock(index), 10); return; }
                if (text === '### ' && block.type === 'text') { block.type = 'h3'; block.content = ''; renderIdeaBlocks(); setTimeout(() => focusIdeaBlock(index), 10); return; }
                if (text === '- ' && block.type === 'text') { block.type = 'bullet'; block.content = ''; renderIdeaBlocks(); setTimeout(() => focusIdeaBlock(index), 10); return; }
                if (text === '1. ' && block.type === 'text') { block.type = 'numbered'; block.content = ''; renderIdeaBlocks(); setTimeout(() => focusIdeaBlock(index), 10); return; }
                if (text === '[] ' && block.type === 'text') { block.type = 'todo'; block.content = ''; block.checked = false; renderIdeaBlocks(); setTimeout(() => focusIdeaBlock(index), 10); return; }
                if (text === '> ' && block.type === 'text') { block.type = 'quote'; block.content = ''; renderIdeaBlocks(); setTimeout(() => focusIdeaBlock(index), 10); return; }
                if (text === '---' && block.type === 'text') {
                    block.type = 'divider'; block.content = '';
                    ideaDocBlocks.splice(index + 1, 0, { type: 'text', content: '' });
                    saveIdeaBlocks(); renderIdeaBlocks();
                    setTimeout(() => focusIdeaBlock(index + 1), 10);
                    return;
                }
                if (text === '```' && block.type === 'text') { block.type = 'code'; block.content = ''; renderIdeaBlocks(); setTimeout(() => focusIdeaBlock(index), 10); return; }

                if (text.startsWith('/') && block.type === 'text') {
                    showSlashMenu(e.target, index);
                } else {
                    hideSlashMenu();
                }

                if (text.includes('@') && block.type !== 'code' && block.type !== 'divider') {
                    let atIdx = text.lastIndexOf('@');
                    let afterAt = text.substring(atIdx + 1);
                    if (!afterAt.includes(' ')) {
                        mentionTarget = e.target;
                        showMentionMenu(e.target, index, afterAt);
                    } else {
                        hideMentionMenu();
                    }
                } else {
                    hideMentionMenu();
                }
            }

            function focusIdeaBlock(index, toStart) {
                let container = document.getElementById('ideaBlocks');
                let blocks = container.querySelectorAll('.idea-block');
                if (index < 0 || index >= blocks.length) return;
                let content = blocks[index].querySelector('.ib-content');
                if (!content) return;
                content.focus();
                let sel = window.getSelection();
                let range = document.createRange();
                if (toStart === true) range.setStart(content.firstChild || content, 0);
                else if (toStart === false) {
                    let len = content.innerText.length;
                    range.setStart(content.firstChild || content, len);
                } else {
                    let len = content.innerText.length;
                    range.setStart(content.firstChild || content, len);
                }
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }

            function getIdeaBlockContent(index) {
                let container = document.getElementById('ideaBlocks');
                let blocks = container.querySelectorAll('.idea-block');
                if (index < 0 || index >= blocks.length) return null;
                return blocks[index].querySelector('.ib-content');
            }

            function toggleIdeaTodo(index) {
                if (!ideaDocBlocks[index]) return;
                ideaDocBlocks[index].checked = !ideaDocBlocks[index].checked;
                renderIdeaBlocks();
                setTimeout(() => focusIdeaBlock(index), 10);
            }

            function showIdeaBlockCtx(e, index) {
                e.preventDefault();
                blockCtxIndex = index;
                let menu = document.getElementById('blockCtx');
                menu.style.left = e.clientX + 'px';
                menu.style.top = e.clientY + 'px';
                menu.classList.add('show');
            }

            // ========== WHITEBOARD ==========
            function initWhiteboard() {
                let canvas = document.getElementById('ideaCanvas');
                let wrap = document.querySelector('.idea-canvas-wrap');
                var lastWidth = 0, lastHeight = 0;
                function resize() {
                    if (!wrap || !canvas) return;
                    let rect = wrap.getBoundingClientRect();
                    var nextWidth = Math.max(1, Math.round(rect.width));
                    var nextHeight = Math.max(1, Math.round(rect.height));
                    if (nextWidth === lastWidth && nextHeight === lastHeight) return;
                    lastWidth = nextWidth;
                    lastHeight = nextHeight;
                    canvas.width = nextWidth;
                    canvas.height = nextHeight;
                    renderWhiteboard();
                }
                resize();
                window.addEventListener('resize', resize);
                if ('ResizeObserver' in window) {
                    var whiteboardResizeObserver = new ResizeObserver(resize);
                    whiteboardResizeObserver.observe(wrap);
                }

                canvas.addEventListener('mousedown', startWbDraw);
                canvas.addEventListener('mousemove', moveWbDraw);
                canvas.addEventListener('mouseup', endWbDraw);
                canvas.addEventListener('mouseleave', endWbDraw);
                canvas.addEventListener('touchstart', startWbDraw, { passive: false });
                canvas.addEventListener('touchmove', moveWbDraw, { passive: false }); canvas.addEventListener('touchend', endWbDraw);

            }

            function getWbPos(e) {
                let canvas = document.getElementById('ideaCanvas');
                let rect = canvas.getBoundingClientRect();
                let clientX = e.touches ? e.touches[0].clientX : e.clientX;
                let clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return { x: clientX - rect.left, y: clientY - rect.top };
            }

            function startWbDraw(e) {
                if (activeWorkspace && activeWorkspace.role === 'viewer') return;
                e.preventDefault();
                isWbDrawing = true;
                let pos = getWbPos(e);
                currentWbStroke = { color: wbTool === 'eraser' ? 'rgba(0,0,0,1)' : wbColor, size: wbTool === 'eraser' ? 24 : wbSize, points: [pos], eraser: wbTool === 'eraser' };
                wbStrokes.push(currentWbStroke);
            }

            function moveWbDraw(e) {
                if (!isWbDrawing || !currentWbStroke) return;
                e.preventDefault();
                let pos = getWbPos(e);
                currentWbStroke.points.push(pos);
                var canvas = document.getElementById('ideaCanvas');
                var ctx = canvas && canvas.getContext('2d');
                var points = currentWbStroke.points;
                if (!ctx || points.length < 2) return;
                var previous = points[points.length - 2];
                ctx.save();
                ctx.globalCompositeOperation = currentWbStroke.eraser ? 'destination-out' : 'source-over';
                ctx.strokeStyle = currentWbStroke.color;
                ctx.lineWidth = currentWStrokeSize(currentWbStroke);
                ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.restore();
            }

            function currentWStrokeSize(stroke) {
                return Math.max(1, Math.min(64, Number(stroke && stroke.size) || 3));
            }

            function endWbDraw(e) {
                if (e && e.preventDefault) e.preventDefault();
                if (isWbDrawing) scheduleWorkspaceSave();
                isWbDrawing = false;
                currentWbStroke = null;
            }

            function renderWhiteboard() {
                let canvas = document.getElementById('ideaCanvas');
                if (!canvas) return;
                let ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                wbStrokes.forEach(stroke => {
                    if (stroke.points.length < 2) return;
                    ctx.beginPath();
                    if (stroke.eraser) {
                        ctx.globalCompositeOperation = 'destination-out';
                        ctx.strokeStyle = 'rgba(0,0,0,1)';
                    } else {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.strokeStyle = stroke.color;
                    }
                    ctx.lineWidth = currentWStrokeSize(stroke);
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                    for (let i = 1; i < stroke.points.length; i++) {
                        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
                    }
                    ctx.stroke();
                });
                ctx.globalCompositeOperation = 'source-over';
            }

            function closeIdeaToolbar() {
                var toolbar = document.getElementById('ideaToolbar');
                var toggle = document.getElementById('ideaToolbarToggle');
                if (toolbar) toolbar.classList.remove('expanded');
                closeIdeaSaveMenu();
                if (toggle) {
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.setAttribute('aria-label', uiText('wrToolbarOpen'));
                    toggle.title = uiText('wrToolbarOpen');
                }
            }

            function toggleIdeaToolbar() {
                let toolbar = document.getElementById('ideaToolbar');
                if (!toolbar) return;
                var expanded = toolbar.classList.toggle('expanded');
                var toggle = document.getElementById('ideaToolbarToggle');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', String(expanded));
                    toggle.setAttribute('aria-label', uiText(expanded ? 'wrToolbarClose' : 'wrToolbarOpen'));
                    toggle.title = uiText(expanded ? 'wrToolbarClose' : 'wrToolbarOpen');
                }
            }

            function closeIdeaSaveMenu() {
                var menu = document.getElementById('ideaSaveMenu');
                var button = document.getElementById('ideaSaveBtn');
                if (menu) menu.classList.remove('show');
                if (button) button.setAttribute('aria-expanded', 'false');
            }

            function toggleIdeaSaveMenu(event) {
                if (event) event.stopPropagation();
                var menu = document.getElementById('ideaSaveMenu');
                var button = document.getElementById('ideaSaveBtn');
                if (!menu || !button) return;
                var open = !menu.classList.contains('show');
                menu.classList.toggle('show', open);
                button.setAttribute('aria-expanded', String(open));
                if (open) {
                    var first = menu.querySelector('[role="menuitem"]');
                    if (first) setTimeout(function () { first.focus(); }, 30);
                }
            }

            function getCurrentDocumentSnapshot() {
                if (currentRoomId === 'room-1') {
                    var ideaPage = ideaPages.find(function (page) { return page.id === activeIdeaPageId; });
                    return ideaPage ? { title: ideaPage.title, blocks: ideaPage.blocks } : null;
                }
                var page = roomPages[currentRoomId];
                return page ? { title: page.title || (rooms[currentRoomId] && rooms[currentRoomId].name) || 'เอกสาร', blocks: page.blocks || [] } : null;
            }

            function blockToPlainText(block) {
                if (!block) return '';
                if (block.type === 'divider') return '──────────';
                if (block.type === 'table') {
                    if (Array.isArray(block.taskRows)) return block.taskRows.map(function (row) { return [row.title || '', row.link || '', taskStatusLabel(row.status)].join(' | '); }).join('\n');
                    return (block.rows || []).map(function (row) { return row.join(' | '); }).join('\n');
                }
                if (block.type === 'image') return '[รูปภาพ]';
                var text = String(block.content || '').replace(/<[^>]*>/g, '').trim();
                if (block.type === 'bullet') return '• ' + text;
                if (block.type === 'numbered') return '1. ' + text;
                if (block.type === 'todo') return (block.checked ? '☑ ' : '☐ ') + text;
                if (block.type === 'quote') return '“' + text + '”';
                return text;
            }

            function downloadCurrentDocument() {
                var doc = getCurrentDocumentSnapshot();
                if (!doc) return showToast('ไม่พบเอกสารสำหรับบันทึก');
                var body = (doc.blocks || []).map(function (block) {
                    var tag = block.type === 'h1' ? 'h1' : block.type === 'h2' ? 'h2' : block.type === 'h3' ? 'h3' : 'p';
                    return '<' + tag + '>' + escapeHtml(blockToPlainText(block)) + '</' + tag + '>';
                }).join('\n');
                var html = '<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' + escapeHtml(doc.title) + '</title><style>body{max-width:800px;margin:48px auto;padding:0 24px;font:17px/1.7 system-ui;color:#202124}h1,h2,h3{line-height:1.25}p{white-space:pre-wrap}</style><body><h1>' + escapeHtml(doc.title) + '</h1>' + body + '</body></html>';
                var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                var url = URL.createObjectURL(blob);
                var link = document.createElement('a');
                link.href = url;
                link.download = String(doc.title || 'เอกสาร').replace(/[\\/:*?"<>|]/g, '-').substring(0, 70) + '.html';
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
                closeIdeaSaveMenu();
                showToast('ดาวน์โหลดเอกสารแล้ว');
            }

            function findPostRoom(kind) {
                var preferredId = kind === 'team' ? 'room-3' : 'room-2';
                if (rooms[preferredId] && roomPages[preferredId]) return preferredId;
                var keyword = kind === 'team' ? 'ทีม' : 'ของฉัน';
                return Object.keys(rooms).find(function (id) { return String(rooms[id].name || '').includes('โปสต์') && String(rooms[id].name || '').includes(keyword) && roomPages[id]; });
            }

            function renderPostitLibrary() {
                var page = roomPages[currentRoomId];
                var grid = document.getElementById('postitGrid');
                var heading = document.getElementById('postitLibraryTitle');
                if (!grid || !page) return;
                if (heading) heading.textContent = (rooms[currentRoomId] && rooms[currentRoomId].name) || 'โปสต์อิท';
                var items = Array.isArray(page.postIts) ? page.postIts.slice().sort(function (a, b) {
                    return Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (b.savedAt || 0) - (a.savedAt || 0);
                }) : [];
                if (!items.length) {
                    grid.innerHTML = '<div class="postit-empty">ยังไม่มีกระดาษโปสต์อิท<br>บันทึกเอกสารจากปุ่มสีเหลืองบนแถบเครื่องมือได้เลย</div>';
                    return;
                }
                grid.innerHTML = items.map(function (item) {
                    var preview = (item.blocks || []).map(blockToPlainText).filter(Boolean).join(' ').substring(0, 130);
                    var time = item.savedAt ? new Date(item.savedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '';
                    var canEdit = !activeWorkspace || activeWorkspace.role !== 'viewer';
                    return '<div class="postit-card' + (item.pinned ? ' pinned' : '') + '" data-color="' + escapeHtml(item.color || 'yellow') + '" role="button" tabindex="0" onclick="openPostit(\'' + escapeHtml(item.id) + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openPostit(\'' + escapeHtml(item.id) + '\')}" oncontextmenu="openPostitContext(event,\'' + escapeHtml(item.id) + '\')" aria-label="เปิดอ่าน ' + escapeHtml(item.title) + '">'
                        + (item.pinned ? '<span class="postit-pin" aria-label="ปักหมุดแล้ว">📌</span>' : '')
                        + (canEdit ? '<button class="postit-card-close" onclick="deletePostit(event,\'' + escapeHtml(item.id) + '\')" title="ลบโปสต์อิท" aria-label="ลบโปสต์อิท ' + escapeHtml(item.title) + '">×</button>' : '')
                        + '<span class="postit-card-title">' + escapeHtml(item.title) + '</span>'
                        + '<span class="postit-card-preview">' + escapeHtml(preview || 'ไม่มีข้อความตัวอย่าง') + '</span>'
                        + '<span class="postit-card-time">' + escapeHtml(time) + '</span></div>';
                }).join('');
            }

            function getContextPostit() {
                var page = roomPages[currentRoomId];
                return page && Array.isArray(page.postIts) ? page.postIts.find(function (item) { return item.id === contextPostitId; }) : null;
            }

            function openPostitContext(event, id) {
                event.preventDefault(); event.stopPropagation();
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                contextPostitId = id;
                var item = getContextPostit();
                var menu = document.getElementById('postitCtx');
                document.getElementById('postitPinAction').textContent = item && item.pinned ? '📍 ถอนหมุด' : '📌 ปักหมุด';
                menu.classList.add('show');
                var width = menu.offsetWidth || 180, height = menu.offsetHeight || 90;
                menu.style.left = Math.min(event.clientX, window.innerWidth - width - 10) + 'px';
                menu.style.top = Math.min(event.clientY, window.innerHeight - height - 10) + 'px';
            }

            function deletePostit(event, id) {
                event.preventDefault(); event.stopPropagation();
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                var page = roomPages[currentRoomId];
                if (!page || !Array.isArray(page.postIts)) return;
                page.postIts = page.postIts.filter(function (item) { return item.id !== id; });
                saveActiveWorkspaceData(); renderPostitLibrary(); showToast('ลบกระดาษโปสต์อิทแล้ว');
            }

            function setPostitColor(color) {
                var item = getContextPostit();
                if (!item) return;
                item.color = color;
                document.getElementById('postitCtx').classList.remove('show');
                saveActiveWorkspaceData(); renderPostitLibrary(); showToast('เปลี่ยนสีกระดาษแล้ว');
            }

            function togglePostitPin() {
                var item = getContextPostit();
                if (!item) return;
                item.pinned = !item.pinned;
                document.getElementById('postitCtx').classList.remove('show');
                saveActiveWorkspaceData(); renderPostitLibrary(); showToast(item.pinned ? 'ปักหมุดแล้ว' : 'ถอนหมุดแล้ว');
            }

            function postitBlockHtml(block) {
                if (!block) return '';
                if (block.type === 'image' && (block.url || block.content)) {
                    var source = safeImageSource(block.url || block.content);
                    return source ? '<img src="' + escapeHtml(source) + '" alt="รูปภาพในเอกสาร">' : '';
                }
                if (block.type === 'divider') return '<hr>';
                if (block.type === 'table') return '<p>' + escapeHtml(blockToPlainText(block)) + '</p>';
                var tag = block.type === 'h1' ? 'h1' : block.type === 'h2' ? 'h2' : block.type === 'h3' ? 'h3' : 'p';
                return '<' + tag + '>' + escapeHtml(blockToPlainText(block)) + '</' + tag + '>';
            }

            function openPostit(id) {
                var page = roomPages[currentRoomId];
                var item = page && Array.isArray(page.postIts) ? page.postIts.find(function (post) { return post.id === id; }) : null;
                if (!item) return showToast('ไม่พบกระดาษโปสต์อิท');
                document.getElementById('postitReaderTitle').textContent = item.title || 'ไม่มีชื่อ';
                var readerBody = document.getElementById('postitReaderBody');
                readerBody.dataset.color = item.color || 'yellow';
                readerBody.innerHTML = (item.blocks || []).map(postitBlockHtml).join('') || '<p>ไม่มีเนื้อหา</p>';
                openModal('postitReaderModal');
            }

            function saveDocumentToPostRoom(kind) {
                var doc = getCurrentDocumentSnapshot();
                var targetId = findPostRoom(kind);
                if (!doc) return showToast('ไม่พบเอกสารสำหรับบันทึก');
                if (!targetId) return showToast(kind === 'team' ? 'ไม่พบห้องโปสต์อิทแบบทีม' : 'ไม่พบห้องโปสต์อิทของฉัน');
                var target = roomPages[targetId];
                if (!Array.isArray(target.postIts)) target.postIts = [];
                target.postIts.push({
                    id: 'postit-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                    title: doc.title || 'ไม่มีชื่อ',
                    blocks: JSON.parse(JSON.stringify(doc.blocks || [])),
                    savedAt: Date.now(),
                    color: 'yellow',
                    pinned: false
                });
                saveActiveWorkspaceData();
                closeIdeaSaveMenu();
                showToast(kind === 'team' ? 'บันทึกลงโปสต์อิทแบบทีมแล้ว' : 'บันทึกลงโปสต์อิทของฉันแล้ว');
            }

            function setWbTool(tool) {
                wbTool = tool;
                document.querySelectorAll('.idea-tool-btn').forEach(t => t.classList.remove('active'));
                let btnId = tool === 'pen' ? 'ideaPencilBtn' : 'ideaEraserBtn';
                let btn = document.getElementById(btnId);
                if (btn) btn.classList.add('active');
                let canvas = document.getElementById('ideaCanvas');
                if (canvas) canvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
                closeIdeaToolbar();
            }

            function setWbColor(color) {
                wbColor = color;
                wbTool = 'pen';
                document.querySelectorAll('.idea-tool-btn').forEach(t => t.classList.remove('active'));
                let pencil = document.getElementById('ideaPencilBtn');
                if (pencil) pencil.classList.add('active');
                document.querySelectorAll('.idea-color-opt').forEach(c => c.classList.remove('active'));
                document.querySelectorAll('.idea-color-opt').forEach(c => {
                    if (c.dataset.color === color) c.classList.add('active');
                });
                let canvas = document.getElementById('ideaCanvas');
                if (canvas) canvas.style.cursor = 'crosshair';
                closeIdeaToolbar();
            }

            function clearWhiteboard() {
                wbStrokes = [];
                var activePage = ideaPages.find(function (page) { return page.id === activeIdeaPageId; });
                if (activePage) activePage.strokes = wbStrokes;
                renderWhiteboard();
                scheduleWorkspaceSave();
                showToast('ล้างกระดาษแล้ว');
                closeIdeaToolbar();
            }

            function syncInitialWorkroomLanguage() {
                setLang(currentLang || 'en');
                restoreSettingsLanguage();
                refreshWorkroomLanguage();
            }
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', syncInitialWorkroomLanguage, { once: true });
            } else {
                syncInitialWorkroomLanguage();
            }
