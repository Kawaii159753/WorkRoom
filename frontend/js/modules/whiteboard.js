/**
 * WorkRoom Whiteboard Canvas Engine & Drawing Tools
 */
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
                var subtitle = document.querySelector('#postitLibrary .postit-library-subtitle');
                if (!grid || !page) return;
                if (heading) heading.textContent = workroomRoomName(currentRoomId);
                if (subtitle) subtitle.textContent = currentLang === 'en' ? 'Open a post-it to edit it on a full page' : 'กดโปสต์อิทเพื่อเปิดและแก้ไขแบบเต็มหน้า';
                var items = Array.isArray(page.postIts) ? page.postIts.slice().sort(function (a, b) {
                    return Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (b.savedAt || 0) - (a.savedAt || 0);
                }) : [];
                if (!items.length) {
                    grid.innerHTML = '<div class="postit-empty">'+(currentLang === 'en' ? 'No post-its yet<br>Save a document from the yellow toolbar button.' : 'ยังไม่มีกระดาษโปสต์อิท<br>บันทึกเอกสารจากปุ่มสีเหลืองบนแถบเครื่องมือได้เลย')+'</div>';
                    return;
                }
                grid.innerHTML = items.map(function (item) {
                    syncPostitTitleFromHeading(item);
                    var displayPostitTitle = workroomSystemText(item.title);
                    var preview = (item.blocks || []).map(function(block){return workroomSystemText(blockToPlainText(block));}).filter(Boolean).join(' ').substring(0, 130);
                    var time = item.savedAt ? new Date(item.savedAt).toLocaleString(currentLang === 'en' ? 'en-US' : 'th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '';
                    var canEdit = !activeWorkspace || activeWorkspace.role !== 'viewer';
                    return '<div class="postit-card' + (item.pinned ? ' pinned' : '') + '" data-color="' + escapeHtml(item.color || 'yellow') + '" role="button" tabindex="0" onclick="openPostit(\'' + escapeHtml(item.id) + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openPostit(\'' + escapeHtml(item.id) + '\')}" oncontextmenu="openPostitContext(event,\'' + escapeHtml(item.id) + '\')" aria-label="เปิดอ่าน ' + escapeHtml(item.title) + '">'
                        + (item.pinned ? '<span class="postit-pin" aria-label="'+(currentLang==='en'?'Pinned':'ปักหมุดแล้ว')+'">📌</span>' : '')
                        + (canEdit ? '<button class="postit-card-close" onclick="deletePostit(event,\'' + escapeHtml(item.id) + '\')" title="ลบโปสต์อิท" aria-label="ลบโปสต์อิท ' + escapeHtml(item.title) + '">×</button>' : '')
                        + '<span class="postit-card-title">' + escapeHtml(displayPostitTitle) + '</span>'
                        + '<span class="postit-card-preview">' + escapeHtml(preview || (currentLang === 'en' ? 'No preview text' : 'ไม่มีข้อความตัวอย่าง')) + '</span>'
                        + '<span class="postit-card-time">' + escapeHtml(time) + '</span></div>';
                }).join('');
            }

            function getContextPostit() {
                var page = roomPages[currentRoomId];
                return page && Array.isArray(page.postIts) ? page.postIts.find(function (item) { return item.id === contextPostitId; }) : null;
            }

            function refreshPostitPinActionLanguage() {
                var action=document.getElementById('postitPinAction');if(!action)return;
                var item=getContextPostit(),pinned=!!(item&&item.pinned);
                action.textContent=pinned?(currentLang==='en'?'📍 Unpin':'📍 ถอนหมุด'):(currentLang==='en'?'📌 Pin':'📌 ปักหมุด');
            }

            function openPostitContext(event, id) {
                event.preventDefault(); event.stopPropagation();
                if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('คุณมีสิทธิ์ดูอย่างเดียว');
                contextPostitId = id;
                var item = getContextPostit();
                var menu = document.getElementById('postitCtx');
                refreshPostitPinActionLanguage();
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
                saveActiveWorkspaceData(); renderPostitLibrary(); showToast(item.pinned ? (currentLang==='en'?'Post-it pinned':'ปักหมุดแล้ว') : (currentLang==='en'?'Post-it unpinned':'ถอนหมุดแล้ว'));
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

