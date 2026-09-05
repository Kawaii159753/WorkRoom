const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

function source(file) { return fs.readFileSync(path.join(__dirname, 'js/modules', file + '.js'), 'utf8'); }
function fn(file, name) {
    const text = source(file);
    const start = text.indexOf('            function ' + name + '(');
    assert.notEqual(start, -1, name);
    const end = text.indexOf('\n            function ', start + 1);
    return text.slice(start, end === -1 ? undefined : end);
}

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage();
        await page.route('**/missing-security-image', route => route.abort());
        await page.setContent('<div id="ideaPageTabs"></div>');
        await page.addScriptTag({ content: source('team').split('            function safeImageSource')[0] });
        for (const [file, name] of [['search', 'plainSearchText'], ['editor', 'firstLinePageTitle'], ['workflows', 'postitHeadingTitle'], ['workflows', 'syncPostitTitleFromHeading'], ['workflows', 'postitBlockTaskTitle'], ['workflows', 'closeoutStatus'], ['rooms', 'renderIdeaPageTabs']]) {
            await page.addScriptTag({ content: fn(file, name) });
        }
        for (const name of ['normalizeCloseoutTask', 'closeoutStatusLabel']) {
            await page.addScriptTag({ content: fn('workflows', name) });
        }
        const workflows = source('workflows');
        const tableStart = workflows.indexOf('            createTaskFlowTable = function');
        await page.addScriptTag({ content: workflows.slice(tableStart, workflows.indexOf('\n            function ', tableStart)) });
        const failures = [];
        async function check(name, action) {
            try { await action(); console.log('PASS ' + name); }
            catch (error) { failures.push(name); console.log('FAIL ' + name + ': ' + error.message); }
        }
        await check('document text extraction does not execute HTML', async () => {
            const result = await page.evaluate(async () => {
                window.securityExecuted = 0;
                const value = '<img src="https://example.invalid/missing-security-image" onerror="window.securityExecuted++"><b>Hello</b> &amp; ทีม';
                const values = [plainSearchText(value), firstLinePageTitle(value), postitHeadingTitle({ blocks: [{ type: 'h1', content: value }] }), syncPostitTitleFromHeading({ blocks: [{ type: 'h1', content: value }] }), postitBlockTaskTitle({ content: value })];
                await new Promise(resolve => setTimeout(resolve, 300));
                return { executed: window.securityExecuted, values };
            });
            assert.equal(result.executed, 0);
            assert.deepEqual(result.values, Array(5).fill('Hello & ทีม'));
        });
        await check('page IDs remain data when clicking rendered tabs', async () => {
            const result = await page.evaluate(() => {
                window.securityExecuted = 0;
                window.currentLang = 'en'; window.activeWorkspace = null;
                window.workroomSystemText = value => value;
                window.switchIdeaPage = value => { window.clickedId = value; };
                const ids = ["');window.securityExecuted++;//", "slash\\'quote", 'ทีม\n\"<&'];
                const actual = ids.map(id => {
                    window.ideaPages = [{ id, title: 'Safe title' }]; window.activeIdeaPageId = id;
                    renderIdeaPageTabs(); document.querySelector('.idea-page-tab').click();
                    return window.clickedId;
                });
                return { executed: window.securityExecuted, ids, actual };
            });
            assert.equal(result.executed, 0);
            assert.deepEqual(result.actual, result.ids);
        });
        await check('workflow status only returns supported CSS tokens', async () => {
            const result = await page.evaluate(() => ['todo', 'doing', 'done', 'review', 'revision', 'approved', '\"><img src=x onerror=alert(1)>', '__proto__', 'constructor'].map(closeoutStatus));
            assert.deepEqual(result, ['review', 'revision', 'approved', 'review', 'revision', 'approved', 'review', 'review', 'review']);
        });
        await check('task table cannot inject HTML through a stored status', async () => {
            const result = await page.evaluate(async () => {
                window.securityExecuted = 0;
                window.ensureTaskRows = block => block.taskRows;
                const row = { title: 'Task', status: '\"><img src="https://example.invalid/missing-security-image" onerror="window.securityExecuted++">' };
                const table = createTaskFlowTable({ taskRows: [row] }, 0, false);
                document.body.appendChild(table);
                await new Promise(resolve => setTimeout(resolve, 300));
                return { executed: window.securityExecuted, images: table.querySelectorAll('img').length, status: row.status, title: table.querySelector('input').value };
            });
            assert.deepEqual(result, { executed: 0, images: 0, status: 'review', title: 'Task' });
        });
        assert.equal(failures.length, 0, failures.join('; '));
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
