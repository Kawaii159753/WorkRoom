/**
 * WorkRoom Central State & Storage Store
 */
let currentRoomId = 'room-1', contextRoomId = null, contextSectionId = null, contextPostitId = null, draggedRoomId = null, suppressRoomClickUntil = 0, slashMenuTarget = null, slashMenuIndex = 0, blockCtxIndex = null;

            const workroomDefaultEnglish = {
                'ไอเดีย': 'Ideas', 'โปสต์ของฉัน': 'My Post-its', 'โปสต์แบบทีม': 'Team Post-its',
                'โปรเจ็กลับ': 'Private Project', 'ฝ่ายคอนเทนต์': 'Content Team', 'ฝ่ายพัฒนาเว็ป': 'Web Development',
                'ห้องทั่วไป': 'General', 'ห้องส่วนตัว': 'Private rooms', 'ห้องแผนก': 'Departments',
                'ไอเดียสำหรับโปรเจกต์ใหม่': 'Ideas for a new project',
                'ออกแบบความคิดของคุณให้เป็นธุรกิจจริง': 'Turn your ideas into a real business',
                'จดบันทึกสร้างสรรค์ความคิดต่าง ๆ ในหัวของคุณ': 'Capture the creative ideas in your mind',
                'วิธีการใช้งาน': 'How to use',
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
            const workroomDefaultRoomNames = {
                'room-1': { th: 'ไอเดีย', en: 'Ideas' }, 'room-2': { th: 'โปสต์ของฉัน', en: 'My Post-its' },
                'room-3': { th: 'โปสต์แบบทีม', en: 'Team Post-its' }, 'room-4': { th: 'โปรเจ็กลับ', en: 'Private Project' },
                'room-5': { th: 'ฝ่ายคอนเทนต์', en: 'Content Team' }, 'room-6': { th: 'ฝ่ายพัฒนาเว็ป', en: 'Web Development' }
            };
            function workroomSystemText(value) {
                if (currentLang === 'en' && workroomDefaultEnglish[value]) return workroomDefaultEnglish[value];
                if (currentLang !== 'en') {
                    var thai = Object.keys(workroomDefaultEnglish).find(function (key) { return workroomDefaultEnglish[key] === value; });
                    if (thai) return thai;
                }
                var plain = String(value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
                var normalized = plain.replace(/…|\.{2,}/g, '...').toLowerCase();
                var matchedThai = Object.keys(workroomDefaultEnglish).find(function (key) {
                    var thaiPlain = String(key).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().replace(/…|\.{2,}/g, '...').toLowerCase();
                    var englishPlain = String(workroomDefaultEnglish[key]).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().replace(/…|\.{2,}/g, '...').toLowerCase();
                    return currentLang === 'en' ? thaiPlain === normalized : englishPlain === normalized;
                });
                if (matchedThai) return currentLang === 'en' ? workroomDefaultEnglish[matchedThai] : matchedThai;
                if (currentLang === 'en' && /^พิมพ์\s*\/\s*เพื่อเข้าถึงฟังก์ชันต่างๆ/.test(plain)) {
                    return 'Type <b>/</b> to access the design tools';
                }
                var englishDesignHint = /^type\s*\/\s*to\s+access\s+(?:the\s+)?(?:idea\s+)?design\s*tools?\s*\.?$/i;
                if (currentLang !== 'en' && englishDesignHint.test(plain)) {
                    return 'พิมพ์ <b>/</b> เพื่อเข้าถึงฟังก์ชันต่างๆ ในการออกแบบไอเดีย';
                }
                if (currentLang === 'en' && englishDesignHint.test(plain)) {
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
                return workroomDefaultRoomNames[id] ? workroomDefaultRoomNames[id][currentLang === 'en' ? 'en' : 'th'] : room.name;
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
                var templateButton = document.querySelector('.template-launch-button');
                var myTasksButton = document.getElementById('myTasksButton');
                if (templateButton) templateButton.title = currentLang === 'en' ? 'Start from a template' : 'เริ่มจากเทมเพลต';
                if (myTasksButton) myTasksButton.title = uiText('wrMyTasks', currentLang === 'en' ? 'My tasks' : 'งานของฉัน');
                var teamPanel = document.getElementById('teamPanel');
                if (teamPanel) teamPanel.setAttribute('aria-label', uiText('wrTeamMembers'));
                var teamClose = document.querySelector('#teamPanel .team-close');
                if (teamClose) teamClose.setAttribute('aria-label', uiText('wrClose'));
                var toolCopy = currentLang === 'en' ? {
                    pencil:'Pencil', clear:'Clear drawing', eraser:'Eraser', save:'Save document', newPage:'New page', saveMenu:'Save document', download:'Save file to device', personal:'Save to My Post-its', team:'Save to Team Post-its', templateKicker:'START WITH A PLAN', tasksKicker:'MY WORK', postitKicker:'POST-IT'
                } : {
                    pencil:'ดินสอ', clear:'ลบภาพวาดทั้งหมด', eraser:'ยางลบ', save:'บันทึกเอกสาร', newPage:'หน้าใหม่', saveMenu:'บันทึกเอกสาร', download:'เซฟไฟล์ลงเครื่อง', personal:'บันทึกลงโปสต์อิทของฉัน', team:'บันทึกลงโปสต์อิทแบบทีม', templateKicker:'เริ่มต้นด้วยแผน', tasksKicker:'งานของฉัน', postitKicker:'กระดาษโปสต์อิท'
                };
                [[document.getElementById('ideaPencilBtn'),toolCopy.pencil],[document.querySelector('.idea-trash-btn'),toolCopy.clear],[document.getElementById('ideaEraserBtn'),toolCopy.eraser],[document.getElementById('ideaSaveBtn'),toolCopy.save],[document.getElementById('ideaNewPageBtn'),toolCopy.newPage]].forEach(function(pair){if(pair[0]){pair[0].title=pair[1];pair[0].setAttribute('aria-label',pair[1]);}});
                var saveTitle=document.querySelector('.idea-save-menu-title'),saveOptions=document.querySelectorAll('.idea-save-option span');
                if(saveTitle)saveTitle.textContent=toolCopy.saveMenu;
                [toolCopy.download,toolCopy.personal,toolCopy.team].forEach(function(label,index){if(saveOptions[index])saveOptions[index].textContent=label;});
                var templateKicker=document.querySelector('#templateGalleryModal .task-detail-kicker'),tasksKicker=document.querySelector('#myTasksModal .task-detail-kicker'),postitKicker=document.querySelector('#postitReaderModal .postit-reader-kicker');
                if(templateKicker)templateKicker.textContent=toolCopy.templateKicker;if(tasksKicker)tasksKicker.textContent=toolCopy.tasksKicker;if(postitKicker)postitKicker.textContent=toolCopy.postitKicker;
                document.querySelectorAll('.postit-reader-close').forEach(function(button){button.setAttribute('aria-label',uiText('wrClose'));});
                var fullPostit = document.getElementById('postitFullEditor');
                var postitIsOpen = fullPostit && fullPostit.style.display === 'block' && activePostitEditorId;
                if (typeof renderEditor === 'function' && workroomInitialized && !postitIsOpen) renderEditor();
                if (postitIsOpen && typeof refreshPostitFullEditorLanguage === 'function') refreshPostitFullEditorLanguage();
                var readerEdit = document.getElementById('postitReaderEditButton');
                var editCancel = document.querySelector('.postit-edit-cancel');
                var editSave = document.querySelector('.postit-edit-save');
                if (readerEdit && typeof postitUi === 'function') { readerEdit.innerHTML = '<span>✎</span> ' + postitUi('edit'); readerEdit.title = postitUi('editPostit'); }
                if (editCancel && typeof postitUi === 'function') editCancel.textContent = postitUi('cancel');
                if (editSave && typeof postitUi === 'function') editSave.textContent = postitUi('saveEdit');
                var roomModal=document.getElementById('roomModal'),templateModal=document.getElementById('templateGalleryModal'),tasksModal=document.getElementById('myTasksModal');
                if(roomModal&&roomModal.classList.contains('active')){var selectedType=document.querySelector('input[name="createItemType"]:checked');setCreateItemType(selectedType?selectedType.value:'room');renderCreateSectionOptions();}
                if(templateModal&&templateModal.classList.contains('active')&&typeof renderTemplateGallery==='function')renderTemplateGallery();
                if(tasksModal&&tasksModal.classList.contains('active')&&typeof renderMyTasks==='function')renderMyTasks();
                var taskDetailModal=document.getElementById('taskDetailModal');
                if(taskDetailModal&&taskDetailModal.classList.contains('active')&&typeof renderTaskDetail==='function')renderTaskDetail();
                if(typeof refreshPostitPinActionLanguage==='function')refreshPostitPinActionLanguage();
                if (typeof initTypewriter === 'function' && workroomInitialized) initTypewriter();
            }

            const loginLanguageCopy = {
                th: {
                    eyebrow: 'กลับเข้าสู่ WorkRoom', visualTitle: 'ไปต่อจากงาน<br>ที่คุณค้างไว้', visualText: 'เข้าสู่พื้นที่ของทีมเพื่อดูงานที่ได้รับมอบหมาย ความคิดเห็น และสิ่งที่ต้องตัดสินใจ',
                    feature1: 'เวิร์กโฟลว์ที่ชัดเจน', feature2: 'รวมไอเดียและงานของทีมไว้ด้วยกัน', feature3: 'ติดตามสิ่งที่ต้องตัดสินใจ',
                    title: 'ยินดีต้อนรับกลับมา', subtitle: 'เข้าสู่ระบบเพื่อกลับไปจัดการงานและทำงานร่วมกับทีมของคุณ', google: 'Google', facebook: 'Facebook', divider: 'หรือเข้าสู่ระบบด้วยอีเมล',
                    name: 'ชื่อที่แสดง', namePlaceholder: 'ชื่อของคุณ', email: 'อีเมล', password: 'รหัสผ่าน', passwordPlaceholder: 'กรอกรหัสผ่าน', remember: 'จดจำฉัน', recoveryPending: 'ระบบกู้รหัสผ่านจะเปิดเมื่อเชื่อมต่อหลังบ้าน', submit: 'เข้าสู่ระบบ', createSubmit: 'สร้างบัญชี', noAccount: 'ยังไม่มีบัญชี?', signup: 'สร้างบัญชี', haveAccount: 'มีบัญชีอยู่แล้ว?', signin: 'เข้าสู่ระบบ', legalPrefix: 'เมื่อเข้าสู่ระบบ ถือว่าคุณยอมรับ', terms: 'ข้อกำหนดการใช้งาน', legalAnd: 'และ', privacy: 'นโยบายความเป็นส่วนตัว', back: 'กลับหน้าหลัก', show: 'แสดงรหัสผ่าน', hide: 'ซ่อนรหัสผ่าน'
                },
                en: {
                    eyebrow: 'Back to WorkRoom', visualTitle: 'Continue where<br>you left off', visualText: 'Enter your team space to review assigned work, feedback, and decisions that need attention.',
                    feature1: 'Clear, focused workflows', feature2: 'Ideas and team tasks in one place', feature3: 'Track decisions that need attention',
                    title: 'Welcome back', subtitle: 'Sign in to manage your work and collaborate with your team.', google: 'Google', facebook: 'Facebook', divider: 'or sign in with email',
                    name: 'Display name', namePlaceholder: 'Your name', email: 'Email', password: 'Password', passwordPlaceholder: 'Enter your password', remember: 'Remember me', recoveryPending: 'Password recovery will be available after backend connection', submit: 'Sign in', createSubmit: 'Create account', noAccount: "Don't have an account?", signup: 'Create account', haveAccount: 'Already have an account?', signin: 'Sign in', legalPrefix: 'By signing in, you agree to our', terms: 'Terms of Service', legalAnd: 'and', privacy: 'Privacy Policy', back: 'Back to home', show: 'Show password', hide: 'Hide password'
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
                var signupName = document.getElementById('signupName');
                if (signupName) signupName.placeholder = copy.namePlaceholder;
                var logoutButton = document.getElementById('userLogoutButton');
                if (logoutButton) {
                    var logoutLabel = currentLang === 'en' ? 'Sign out' : 'ออกจากระบบ';
                    logoutButton.title = logoutLabel;
                    logoutButton.setAttribute('aria-label', logoutLabel);
                }
                var modeToggle = document.getElementById('loginModeToggle');
                var submitCopy = document.querySelector('.login-submit [data-login-copy="submit"]');
                var noAccountCopy = document.querySelector('.login-signup [data-login-copy="noAccount"]');
                if (loginAuthMode === 'signup') {
                    if (modeToggle) modeToggle.textContent = copy.signin;
                    if (submitCopy) submitCopy.textContent = copy.createSubmit;
                    if (noAccountCopy) noAccountCopy.textContent = copy.haveAccount;
                }
                var toggle = document.querySelector('.password-toggle');
                if (toggle) toggle.setAttribute('aria-label', password && password.type === 'text' ? copy.hide : copy.show);
                var language = document.querySelector('.login-language');
                if (language) language.setAttribute('aria-label', lang === 'en' ? 'Change language' : 'เปลี่ยนภาษา');
            }

            var loginAuthMode = 'signin';
            function toggleLoginMode() {
                loginAuthMode = loginAuthMode === 'signin' ? 'signup' : 'signin';
                var field = document.getElementById('signupNameField');
                var nameInput = document.getElementById('signupName');
                var password = document.getElementById('loginPassword');
                if (field) field.hidden = loginAuthMode !== 'signup';
                if (nameInput) nameInput.required = loginAuthMode === 'signup';
                if (password) password.autocomplete = loginAuthMode === 'signup' ? 'new-password' : 'current-password';
                refreshLoginLanguage();
                if (loginAuthMode === 'signup' && nameInput) nameInput.focus();
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
            const DEFAULT_WORKSPACE_ICON = 'assets/images/workroom-default-workspace.png?v=20260829-sticky-default-1';
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
                document.getElementById('editorContainer').addEventListener('input', function (event) {
                    if (activeWorkspace && activeWorkspace.role === 'viewer') return;
                    var title = document.getElementById('pageTitle');
                    // Room/page names are independent from document content. Only an
                    // explicit edit in the title field may rename the current page.
                    if (event.target === title && title && currentRoomId !== 'room-1' && roomPages[currentRoomId]) {
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
                const texts = [
                    'ไอเดียสำหรับโปรเจกต์ใหม่',
                    'ออกแบบความคิดของคุณให้เป็นธุรกิจจริง',
                    'จดบันทึกสร้างสรรค์ความคิดต่าง ๆ ในหัวของคุณ'
                ].map(workroomSystemText);
                const el = document.getElementById('typewriterText');
                if (!el) return;
                let textIndex = 0;
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
                    const text = texts[textIndex];
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
                            textIndex = (textIndex + 1) % texts.length;
                            pause = 6; // pause before retype
                        }
                        setTimeout(tick, 60);
                    }
                }
                tick();
            }
