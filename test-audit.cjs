// Isolated browser tests: no API, OAuth, presence service, or real account is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<script\b[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/script>/g,
    (tag, src) => /^js\/(?:i18n\.js|bento\.js|landing-showcase\.js|app\.js|modules\/)/.test(src) ? tag : '');

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const failures = [];
    let checks = 0;
    try {
        async function check(name, action) {
            const page = await browser.newPage({ reducedMotion: 'reduce' });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('**/*', route => {
                const url = new URL(route.request().url());
                if (url.origin !== 'http://audit.local') return route.abort();
                if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: html });
                const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
                if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.abort();
                return route.fulfill({ path: file });
            });
            await page.addInitScript(() => {
                window.currentUser = { name: 'Audit', email: 'audit@example.invalid' };
                // Animations are outside these security tests; complete translation callbacks synchronously.
                window.gsap = {
                    to: (element, options) => { if (options.onComplete) options.onComplete(); },
                    from() {}, fromTo() {}, registerPlugin() {},
                    utils: { toArray: selector => Array.from(document.querySelectorAll(selector)) }
                };
                window.ScrollTrigger = { refresh() {}, update() {} };
                window.updateNavLogin = () => {};
                window.renderUserProfile = () => {};
                window.getSavedUser = () => null;
            });
            try {
                await page.goto('http://audit.local/');
                await page.waitForTimeout(100);
                await page.evaluate(() => {
                    activeWorkspace = { id: 'audit-workspace', role: 'owner', name: 'Audit', members: [] };
                    collaborationState = { workspaces: [activeWorkspace] };
                    // Persistence and excluded services are deliberately replaced with counters.
                    window.auditSaves = 0;
                    saveActiveWorkspaceData = scheduleWorkspaceSave = saveIdeaBlocks = () => { window.auditSaves++; };
                    document.getElementById('page-workroom').style.display = 'block';
                    document.getElementById('mainApp').style.display = 'block';
                    document.getElementById('loginPage').style.display = 'none';
                    window.auditExecuted = 0;
                });
                await action(page);
                assert.deepEqual(errors, [], 'uncaught browser errors');
                checks++;
                console.log('PASS ' + name);
            } catch (error) { failures.push(name); console.log('FAIL ' + name + ': ' + error.message); }
            finally { await page.close(); }
        }

        await check('viewer remains read-only after switching idea tabs', async page => {
            assert.equal(await page.evaluate(() => {
                activeWorkspace.role = 'viewer';
                ideaPages.push({ id: 'second', title: 'Second', blocks: [{ type: 'text', content: 'Protected' }], strokes: [] });
                applyWorkspaceRole();
                switchIdeaPage('second');
                return document.querySelector('#ideaBlocks .ib-content').contentEditable;
            }), 'false');
        });
        await check('viewer cannot modify blocks with keyboard shortcuts', async page => {
            assert.equal(await page.evaluate(() => {
                activeWorkspace.role = 'viewer';
                currentRoomId = 'room-1';
                ideaDocBlocks = [{ type: 'code', content: 'Protected' }];
                renderIdeaBlocks(); applyWorkspaceRole();
                document.querySelector('#ideaBlocks .ib-content').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
                return ideaDocBlocks.length;
            }), 1);
        });
        await check('code blocks preserve plaintext-only editing after role application', async page => {
            assert.equal(await page.evaluate(() => {
                ideaDocBlocks = [{ type: 'code', content: 'const x = 1;' }]; renderIdeaBlocks(); applyWorkspaceRole();
                return document.querySelector('#ideaBlocks .ib-content').contentEditable;
            }), 'plaintext-only');
        });
        await check('viewer cannot toggle an idea checkbox', async page => {
            assert.equal(await page.evaluate(() => {
                activeWorkspace.role = 'viewer'; ideaDocBlocks = [{ type: 'todo', content: 'Protected', checked: false }];
                renderIdeaBlocks(); document.querySelector('#ideaBlocks .ib-todo-check').click();
                return ideaDocBlocks[0].checked;
            }), false);
        });
        await check('long adversarial code renders as escaped text within a bounded time', async page => {
            const result = await page.evaluate(() => {
                const code = '/*a'.repeat(100000) + '<img src=x onerror=window.auditExecuted++>';
                const started = performance.now();
                const element = document.createElement('div'); element.innerHTML = highlightCodeText(code);
                return { elapsed: performance.now() - started, matches: element.textContent === code, children: element.children.length };
            });
            assert.ok(result.elapsed < 1000, 'large block must not stall the main thread');
            assert.equal(result.matches, true); assert.equal(result.children, 0);
        });

        async function dropCase(page, change) {
            return page.evaluate(change => {
                currentRoomId = 'audit-a';
                roomPages['audit-a'] = { blocks: [] }; roomPages['audit-b'] = { blocks: [] };
                window.FileReader = class { readAsDataURL() { window.auditReader = this; } };
                renderEditor = () => {};
                if (change === 'viewer') activeWorkspace.role = 'viewer';
                const transfer = new DataTransfer(); transfer.items.add(new File(['png'], 'image.png', { type: 'image/png' }));
                document.getElementById('editorContainer').dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
                if (change === 'room') currentRoomId = 'audit-b';
                if (change === 'workspace') { activeWorkspace = { id: 'other', role: 'owner' }; roomPages['audit-a'] = { blocks: [] }; }
                if (change === 'role') activeWorkspace.role = 'viewer';
                if (window.auditReader) window.auditReader.onload({ target: { result: 'data:image/png;base64,YQ==' } });
                return { a: roomPages['audit-a'].blocks.length, b: roomPages['audit-b'].blocks.length, started: !!window.auditReader };
            }, change);
        }
        for (const change of ['viewer', 'room', 'workspace', 'role']) {
            await check('image drop rejects stale or read-only target: ' + change, async page => {
                const result = await dropCase(page, change);
                assert.equal(result.a + result.b, 0);
                if (change === 'viewer') assert.equal(result.started, false);
            });
        }
        await check('normal image drop still inserts and schedules save', async page => {
            const result = await dropCase(page, 'none');
            assert.equal(result.a, 1); assert.equal(result.b, 0);
            assert.ok(await page.evaluate(() => window.auditSaves > 0));
        });
        await check('slash image cannot write into another idea page', async page => {
            const result = await page.evaluate(() => {
                currentRoomId = 'room-1';
                ideaDocBlocks = [{ type: 'text', content: '/' }];
                const original = ideaDocBlocks;
                slashMenuTarget = 0;
                window.FileReader = class { readAsDataURL() { window.auditReader = this; } };
                selectSlashType('image');
                const input = document.querySelector('body > input[type=file]');
                input.onchange({ target: { files: [new File(['png'], 'image.png', { type: 'image/png' })] } });
                ideaDocBlocks = [{ type: 'text', content: 'Other page' }];
                window.auditReader.onload({ target: { result: 'data:image/png;base64,YQ==' } });
                return { original: original[0].type, other: ideaDocBlocks.length };
            });
            assert.deepEqual(result, { original: 'text', other: 1 });
        });
        await check('slash image keeps the insertion point after the menu closes', async page => {
            const result = await page.evaluate(() => {
                currentRoomId = 'room-1';
                ideaDocBlocks = [{ type: 'text', content: 'First' }, { type: 'text', content: '/' }, { type: 'text', content: 'Last' }];
                slashMenuTarget = 1;
                window.FileReader = class { readAsDataURL() { window.auditReader = this; } };
                selectSlashType('image');
                document.querySelector('body > input[type=file]').onchange({ target: { files: [new File(['png'], 'image.png', { type: 'image/png' })] } });
                hideSlashMenu();
                window.auditReader.onload({ target: { result: 'data:image/png;base64,YQ==' } });
                return ideaDocBlocks.map(block => block.type + ':' + (block.type === 'image' ? '' : block.content));
            });
            assert.deepEqual(result, ['text:First', 'image:', 'text:', 'text:Last']);
        });
        await check('avatar upload cannot modify a different signed-in user', async page => {
            const result = await page.evaluate(() => {
                window.FileReader = class { readAsDataURL() { window.auditReader = this; } };
                openAccountPage = () => {};
                changeAvatar({ target: { files: [new File(['png'], 'image.png', { type: 'image/png' })], value: 'image.png' } });
                currentUser = { name: 'Other', email: 'other@example.invalid' };
                window.auditReader.onload({ target: { result: 'data:image/png;base64,YQ==' } });
                return currentUser.picture || null;
            });
            assert.equal(result, null);
        });

        await check('malicious HTML stays inert in editor, post-its, comments, notifications and search', async page => {
            const result = await page.evaluate(async () => {
                const attack = '<img src="http://audit.local/missing" onerror="window.auditExecuted++"><svg onload="window.auditExecuted++"></svg>';
                ideaDocBlocks = ['text', 'h1', 'h2', 'h3', 'bullet', 'numbered', 'todo', 'quote', 'code'].map(type => ({ type, content: attack }));
                renderIdeaBlocks();
                const post = { id: 'post', title: attack, blocks: [{ type: 'text', content: attack }] };
                currentRoomId = 'room-2'; roomPages['room-2'].postIts = [post];
                renderPostitLibrary(); openPostitFullEditor('post');
                activeTaskDetail = { row: { title: attack, comments: [{ id: 'comment', author: attack, text: attack, createdAt: 1 }], assignees: [], links: [{ url: 'javascript:window.auditExecuted++', label: attack }], activity: [{ actor: attack, action: attack, createdAt: 1 }] } };
                for (const tab of ['comments', 'details', 'activity']) { activeWorkflowTab = tab; renderTaskDetail(); }
                notifications = [{ type: 'mention', fromName: attack, roomName: attack }, { type: 'other', text: attack }]; renderNotif();
                handleSearch('img');
                const extra = document.createElement('div'); extra.innerHTML = sanitizeEditorHtml('<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=window.auditExecuted++>">'); document.body.appendChild(extra);
                await new Promise(resolve => setTimeout(resolve, 100));
                return window.auditExecuted;
            });
            assert.equal(result, 0);
        });
        await check('external links reject active URL schemes and preserve HTTPS', async page => {
            const result = await page.evaluate(() => ({
                rejected: ['javascript:alert(1)', 'java\nscript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', 'file:///etc/passwd'].map(safeExternalUrl),
                good: safeExternalUrl('https://example.org/path?q=1'),
                imageRejected: ['javascript:alert(1)', 'data:image/svg+xml,<svg onload=alert(1)>', 'file:///secret'].map(safeImageSource)
            }));
            assert.deepEqual(result.rejected, Array(5).fill('')); assert.deepEqual(result.imageRejected, Array(3).fill('')); assert.equal(result.good, 'https://example.org/path?q=1');
        });
        await check('IDs remain data across room, section, workspace, notification, post-it and comment actions', async page => {
            const result = await page.evaluate(() => {
                const id = "');window.auditExecuted++;//";
                const groups = [];
                function collect(selector) {
                    document.querySelectorAll(selector).forEach(root => root.querySelectorAll('[onclick], [oncontextmenu]').forEach(element => groups.push(element.cloneNode(true))));
                }
                rooms = { [id]: { name: 'Room', emoji: 'R', sectionId: id } }; roomOrder = [id]; roomSections = [{ id, name: 'Section' }]; currentRoomId = id;
                renderPageHistory(); collect('#pageHistoryList');
                roomPageCollections[id] = { activePageId: id, pages: [{ id, title: 'One', blocks: [] }, { id: 'other', title: 'Two', blocks: [] }] };
                renderNormalPageTabs(); collect('#normalPageTabs');
                ideaPages = [{ id, title: 'Idea', blocks: [] }, { id: 'other', title: 'Other', blocks: [] }]; renderIdeaPageTabs(); collect('#ideaPageTabs');
                activeWorkspace.id = id; workspaceProfileTargetId = id; renderWorkspaceMenu(); collect('#workspaceList');
                notifications = [{ id, type: 'team_invite', status: 'pending', fromName: 'Sender', workspaceName: 'Workspace' }]; renderNotif(); collect('#notifList');
                currentRoomId = 'room-2'; rooms['room-2'] = { name: 'Post-its' }; roomPages['room-2'] = { postIts: [{ id, title: 'Post', blocks: [] }] };
                renderPostitLibrary(); collect('#postitGrid');
                activeReplyCommentId = id;
                const comments = document.createElement('div'); comments.innerHTML = workflowCommentsHtml({ comments: [{ id, text: 'Text', author: 'Author', createdAt: 1 }] }, true);
                comments.querySelectorAll('[onclick]').forEach(element => groups.push(element));
                const calls = [];
                for (const name of ['switchPage', 'openRoomEdit', 'openSectionContext', 'switchRoomPage', 'deleteRoomPage', 'switchIdeaPage', 'deleteIdeaPage', 'switchWorkspace', 'toggleWorkspaceProfileOptions', 'chooseWorkspaceProfileImage', 'respondToInvite', 'openPostit', 'openPostitContext', 'deletePostit', 'replyTaskComment', 'toggleCommentResolution', 'submitTaskReply', 'openArtifactWorkflow', 'closeModal', 'cancelTaskReply']) {
                    window[name] = (...args) => calls.push(args.filter(value => typeof value === 'string'));
                }
                for (const element of groups) {
                    if (element.hasAttribute('onclick')) element.click();
                    if (element.hasAttribute('oncontextmenu')) element.dispatchEvent(new MouseEvent('contextmenu', { cancelable: true }));
                }
                return { executed: window.auditExecuted, received: calls.flat().filter(value => value === id).length };
            });
            assert.equal(result.executed, 0); assert.ok(result.received >= 18, 'exercise all generated action families');
        });
        await check('file selectors reject SVG, HTML and oversized images', async page => {
            const result = await page.evaluate(() => {
                let reads = 0;
                window.FileReader = class { readAsDataURL() { reads++; } };
                for (const file of [new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' }), new File(['<script/>'], 'a.html', { type: 'text/html' }), new File([new Uint8Array(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' })]) {
                    changeAvatar({ target: { files: [file], value: '' } });
                    currentRoomId = 'room-5'; const transfer = new DataTransfer(); transfer.items.add(file);
                    document.getElementById('editorContainer').dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, cancelable: true }));
                }
                return reads;
            });
            assert.equal(result, 0);
        });
        await check('downloaded document escapes title and content', async page => {
            const result = await page.evaluate(async () => {
                const attack = '</title><img src=x onerror=window.auditExecuted++>';
                getCurrentDocumentSnapshot = () => ({ title: attack, blocks: [{ type: 'text', content: attack }, { type: 'code', content: '<script>alert(1)</script>' }] });
                let blob; URL.createObjectURL = value => { blob = value; return 'blob:http://audit.local/export'; };
                HTMLAnchorElement.prototype.click = () => {};
                downloadCurrentDocument();
                const content = await blob.text(); const parsed = new DOMParser().parseFromString(content, 'text/html');
                return { title: parsed.title, active: parsed.querySelectorAll('script,img,svg,[onerror]').length };
            });
            assert.equal(result.active, 0); assert.ok(result.title.startsWith('</title>'));
        });
        await check('settings, languages, templates and responsive editor initialize', async page => {
            for (const width of [390, 1280]) {
                await page.setViewportSize({ width, height: 800 });
                await page.evaluate(() => {
                    for (const lang of ['en', 'th']) { setLang(lang); openSettingsModal(); closeModal('settingsModal'); renderTemplateGallery(); }
                    for (const theme of ['dark', 'light', 'playful', 'system']) applyTheme(theme);
                    currentRoomId = 'room-5'; renderEditor();
                });
            }
        });
        await check('landing, story, blog and login routes use fixed page destinations', async page => {
            for (const hash of ['#story', '#blog', '#workroom', '#<img src=x onerror=window.auditExecuted++>']) {
                await page.evaluate(hash => { history.replaceState(null, '', hash); initRoute(); }, hash);
            }
            await page.evaluate(() => { showBlog(); prepareBlogGuides(); openBlogGuide(0); closeBlogGuide(); showLoginPage(); showBento(); });
            assert.equal(await page.evaluate(() => window.auditExecuted), 0);
        });
        console.log(JSON.stringify({ passed: checks, failed: failures }));
        assert.equal(failures.length, 0, failures.join('; '));
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
