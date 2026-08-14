import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9334;
const FILE_URL = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'wr-cursor-test-'));

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function getJson(url) { return (await fetch(url)).json(); }

let ws, msgId = 0;
const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evalJs(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('eval error: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
  return r.result.value;
}

async function cursorState(label) {
  const s = await evalJs(`(() => {
    const c = document.getElementById('cursor');
    const d = document.getElementById('cursorDot');
    return {
      bodyCursor: document.body.style.cursor,
      customActive: !!window.__customCursorActive,
      cursorDisplay: c ? getComputedStyle(c).display : null,
      dotDisplay: d ? getComputedStyle(d).display : null,
      workroom: document.getElementById('page-workroom').style.display,
      mainApp: document.getElementById('mainApp') ? getComputedStyle(document.getElementById('mainApp')).display : null,
      hash: location.hash
    };
  })()`);
  console.log(label + ':', JSON.stringify(s));
  return s;
}

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${userData}`, 'about:blank'
  ], { stdio: 'ignore' });

  let targets;
  for (let i = 0; i < 40; i++) {
    try { targets = await getJson(`http://127.0.0.1:${PORT}/json`); break; }
    catch { await sleep(250); }
  }
  if (!targets) { console.log('FAIL: devtools not up'); chrome.kill(); process.exit(1); }

  const page = targets.find(t => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: FILE_URL });
  await sleep(3000);

  // 1. Initial landing load — custom cursor active, native hidden (no double cursor)
  let s = await cursorState('1.landing@load');

  // 2. mousemove — custom cursor follows
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 400, y: 300 });
  await sleep(500);
  s = await evalJs(`(() => {
    const c = document.getElementById('cursor');
    const d = document.getElementById('cursorDot');
    return { ring: c.style.left + ',' + c.style.top, dot: d.style.left + ',' + d.style.top };
  })()`);
  console.log('2.mousemove-follow:', JSON.stringify(s));

  // 3. Click CTA -> login page
  await evalJs(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => (x.textContent.includes('เริ่มการสร้างสรรค์') || x.textContent.includes('Start Creating')));
    if (b) b.click();
    return !!b;
  })()`);
  await sleep(800);
  await cursorState('3.loginpage');

  // 4. Complete login -> app
  await evalJs(`(() => {
    const f = document.getElementById('loginForm') || document.querySelector('.login-box form');
    if (f) { f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }
  })()`);
  await sleep(1000);
  await cursorState('4.app');

  // 5. Logout -> back to landing
  await evalJs(`(() => { if (typeof logout === 'function') logout(); return true; })()`);
  await sleep(800);
  await cursorState('5.after-logout-landing');

  // 6. Story page -> cursor state
  await evalJs(`(() => { if (typeof showStory === 'function') showStory(true); return true; })()`);
  await sleep(600);
  await cursorState('6.story');

  // 7. Back to bento
  await evalJs(`(() => { if (typeof showBento === 'function') showBento(true); return true; })()`);
  await sleep(600);
  await cursorState('7.back-to-bento');

  // 8. Fallback: simulate custom cursor NOT available (e.g. JS error in cursor script)
  await evalJs(`(() => {
    window.__customCursorActive = false;
    if (typeof showBento === 'function') showBento(true);
    return true;
  })()`);
  await sleep(500);
  await cursorState('8.fallback-no-custom');

  ws.close();
  chrome.kill();
}

main().catch(e => { console.log('TEST FAIL:', e.message); process.exit(1); });
