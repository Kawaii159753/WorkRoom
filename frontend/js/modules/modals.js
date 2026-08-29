/**
 * WorkRoom Modals, Settings, Account & Toasts
 */
            // ========== SETTINGS FUNCTIONS ==========
            function handleKeyboardClick(event, element) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                element.click();
            }
            window.handleKeyboardClick = handleKeyboardClick;

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
                document.body.dataset.workroomTheme = isPlayful ? 'playful' : (isDark ? 'dark' : 'light');
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
                try { sessionStorage.setItem('workroomUser', JSON.stringify(user)); localStorage.removeItem('workroomUser'); } catch (e) { }
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
            var workroomConfirmAction = null;
            function openWorkroomConfirm(options, action) {
                options = options || {};
                workroomConfirmAction = typeof action === 'function' ? action : null;
                var modal = document.getElementById('workroomConfirmModal');
                if (modal.parentElement !== document.body) document.body.appendChild(modal);
                modal.dataset.variant = options.variant || 'default';
                document.getElementById('workroomConfirmTitle').textContent = options.title || '';
                document.getElementById('workroomConfirmMessage').textContent = options.message || '';
                var icon = document.getElementById('workroomConfirmIcon');
                icon.hidden = !options.icon; icon.textContent = options.icon || '';
                var account = document.getElementById('workroomConfirmAccount');
                account.hidden = !options.accountName;
                document.getElementById('workroomConfirmAccountName').textContent = options.accountName || '';
                document.getElementById('workroomConfirmAccountEmail').textContent = options.accountEmail || '';
                document.getElementById('workroomConfirmAvatar').textContent = String(options.accountName || '?').trim().charAt(0).toUpperCase();
                var note = document.getElementById('workroomConfirmNote');
                note.hidden = !options.note; note.textContent = options.note || '';
                var accept = document.getElementById('workroomConfirmAccept');
                var cancel = document.getElementById('workroomConfirmCancel');
                accept.textContent = options.accept || (currentLang === 'en' ? 'Confirm' : 'ยืนยัน');
                cancel.textContent = options.cancel || (currentLang === 'en' ? 'Cancel' : 'ยกเลิก');
                accept.classList.toggle('workroom-confirm-danger', options.variant === 'logout' || options.variant === 'danger');
                accept.onclick = function () { var callback = workroomConfirmAction; closeWorkroomConfirm(); if (callback) callback(); };
                openModal('workroomConfirmModal');
                setTimeout(function () { (options.focusCancel ? cancel : accept).focus(); }, 30);
            }
            function closeWorkroomConfirm() { workroomConfirmAction = null; closeModal('workroomConfirmModal'); }
            function logoutAllDevices() {
                var user = currentUser || {};
                openWorkroomConfirm(currentLang === 'en' ? { title:'Sign out on all devices?', message:'You will need to sign in again on every device.', accept:'Sign out' } : { title:'ออกจากระบบทุกอุปกรณ์?', message:'คุณจะต้องเข้าสู่ระบบใหม่บนอุปกรณ์ทุกเครื่อง', accept:'ออกจากระบบ' }, function () {
                    try { localStorage.setItem('workroomSessionRevoked:' + normalizeEmail(user.email), String(Date.now())); } catch (e) { }
                    closeModal('accountModal'); logout();
                });
            }
            function deleteAccount() {
                var lang = currentLang || 'th';
                openWorkroomConfirm(lang === 'en' ? { title:'Delete account?', message:'Your local WorkRoom data and access will be removed from this device.', accept:'Delete account' } : { title:'ลบบัญชี?', message:'ข้อมูล WorkRoom และการเข้าถึงของบัญชีนี้จะถูกลบออกจากอุปกรณ์นี้', accept:'ลบบัญชี' }, function () {
                var account = getCurrentAccount();
                var state = account.email ? readJson(collaborationKey(account.email), null) : null;
                try {
                    if (state && Array.isArray(state.workspaces)) state.workspaces.forEach(function (workspace) {
                        if (normalizeEmail(workspace.ownerEmail) === account.email) localStorage.removeItem(workspaceDataKey(workspace.id));
                    });
                    localStorage.removeItem('workroomUser');
                    sessionStorage.removeItem('workroomUser');
                    localStorage.removeItem('wr-user');
                    localStorage.removeItem(collaborationKey(account.email));
                    localStorage.removeItem(mailboxKey(account.email));
                    localStorage.removeItem('workroomPresence:' + account.email);
                } catch (e) { }
                currentUser = null;
                closeModal('accountModal');
                showToast(lang === 'th' ? 'ลบบัญชีสำเร็จ' : 'Account deleted');
                setTimeout(function () { if (typeof showBento === 'function') showBento(true); updateNavLogin(); }, 700);
                });
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


            // ========== MODALS ==========
            var modalReturnFocus = new WeakMap();
            var viewportFitModalIds = { templateGalleryModal: true, myTasksModal: true };
            var viewportFitFrame = 0;
            function fitViewportModal(modal) {
                if (!modal || !viewportFitModalIds[modal.id] || !modal.classList.contains('active')) return;
                var dialog = modal.querySelector('.modal-box');
                if (!dialog) return;
                dialog.style.setProperty('--modal-fit-scale', '1');
                var viewport = window.visualViewport;
                var availableWidth = Math.max(1, (viewport ? viewport.width : window.innerWidth) - 24);
                var availableHeight = Math.max(1, (viewport ? viewport.height : window.innerHeight) - 24);
                var naturalWidth = Math.max(dialog.scrollWidth, dialog.offsetWidth, 1);
                var naturalHeight = Math.max(dialog.scrollHeight, dialog.offsetHeight, 1);
                var scale = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight);
                dialog.style.setProperty('--modal-fit-scale', String(Math.max(0.1, scale)));
            }
            function scheduleViewportModalFit(modal) {
                cancelAnimationFrame(viewportFitFrame);
                viewportFitFrame = requestAnimationFrame(function () { fitViewportModal(modal); });
            }
            function modalFocusableElements(modal) {
                return Array.from(modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
                    .filter(function (element) { return element.offsetParent !== null; });
            }
            function openModal(id) {
                var modal = document.getElementById(id);
                if (!modal) return;
                modalReturnFocus.set(modal, document.activeElement);
                modal.classList.add('active');
                if (viewportFitModalIds[id]) {
                    modal.classList.add('fit-without-scroll');
                    scheduleViewportModalFit(modal);
                }
                var focusable = modalFocusableElements(modal);
                var dialog = modal.querySelector('[role="dialog"], [role="alertdialog"]');
                requestAnimationFrame(function () {
                    if (focusable[0]) focusable[0].focus();
                    else if (dialog) { dialog.setAttribute('tabindex', '-1'); dialog.focus(); }
                });
            }
            function closeModal(id) {
                var modal = document.getElementById(id);
                if (!modal) return;
                modal.classList.remove('active');
                var dialog = modal.querySelector('.modal-box');
                if (dialog) dialog.style.removeProperty('--modal-fit-scale');
                var returnTarget = modalReturnFocus.get(modal);
                if (returnTarget && typeof returnTarget.focus === 'function' && document.contains(returnTarget)) returnTarget.focus();
                modalReturnFocus.delete(modal);
                if (id === 'roomModal') closeCreateSectionMenu();
                if (id === 'workspaceProfileConfirmModal') {
                    pendingWorkspaceProfile = null;
                    workspaceProfileTargetId = null;
                    var preview = document.getElementById('workspaceProfilePreview');
                    if (preview) {
                        preview.removeAttribute('src');
                        preview.hidden = true;
                    }
                }
            }

            document.querySelectorAll('.modal-overlay').forEach(m => {
                m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
            });

            window.addEventListener('resize', function () {
                var modal = document.querySelector('.modal-overlay.fit-without-scroll.active');
                if (modal) scheduleViewportModalFit(modal);
            });
            if (window.visualViewport) window.visualViewport.addEventListener('resize', function () {
                var modal = document.querySelector('.modal-overlay.fit-without-scroll.active');
                if (modal) scheduleViewportModalFit(modal);
            });
            if ('MutationObserver' in window) {
                new MutationObserver(function () {
                    var modal = document.querySelector('.modal-overlay.fit-without-scroll.active');
                    if (modal) scheduleViewportModalFit(modal);
                }).observe(document.getElementById('mainApp') || document.body, { childList: true, subtree: true, characterData: true });
            }

            document.addEventListener('keydown', function (event) {
                var modal = Array.from(document.querySelectorAll('.modal-overlay.active')).pop();
                if (!modal) return;
                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeModal(modal.id);
                    return;
                }
                if (event.key !== 'Tab') return;
                var focusable = modalFocusableElements(modal);
                if (!focusable.length) { event.preventDefault(); return; }
                var first = focusable[0];
                var last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
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
                if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
                    dropdown.classList.remove('show');
                    bell.setAttribute('aria-expanded', 'false');
                }
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
