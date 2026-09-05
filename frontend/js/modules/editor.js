/**
 * WorkRoom Document Editor, Block Rendering & Slash Menu
 */
            // ========== EDITOR RENDER ==========
            function captureDocumentImageTarget() {
                if (!activeWorkspace || activeWorkspace.role === 'viewer' || isPostitRoomId(currentRoomId)) return null;
                var blocks = currentRoomId === 'room-1' ? ideaDocBlocks : (roomPages[currentRoomId] && roomPages[currentRoomId].blocks);
                return Array.isArray(blocks) ? { workspace: activeWorkspace, user: currentUser, roomId: currentRoomId, blocks: blocks } : null;
            }
            function isCurrentDocumentImageTarget(target) {
                var current = captureDocumentImageTarget();
                return !!(target && current && target.workspace === current.workspace && target.user === current.user
                    && target.roomId === current.roomId && target.blocks === current.blocks);
            }

            function renderEditor() {
                if (currentRoomId !== 'room-1' && roomPages[currentRoomId] && ensureRichBlockTrailingText(roomPages[currentRoomId].blocks)) scheduleWorkspaceSave();
                var fullPostitEditor = document.getElementById('postitFullEditor');
                if (fullPostitEditor) fullPostitEditor.style.display = 'none';
                let roomName = workroomRoomName(currentRoomId);
                let breadcrumb = document.getElementById('headerBreadcrumb');
                if (breadcrumb) breadcrumb.innerHTML = escapeHtml(roomName) + ' <span>/</span> ' + escapeHtml(workroomSystemText('ไม่มีชื่อ'));
                let editorContainer = document.getElementById('editorContainer');
                let editorScroll = document.querySelector('.editor-scroll');
                let ideaToolbar = document.getElementById('ideaToolbar');
                let postitLibrary = document.getElementById('postitLibrary');
                var isPostitRoom = isPostitRoomId(currentRoomId);
                if (postitLibrary) postitLibrary.style.display = isPostitRoom ? 'block' : 'none';
                var templateButton = document.querySelector('.template-launch-button');
                if (templateButton) templateButton.style.display = isPostitRoom ? 'none' : '';
                var newPageButton = document.getElementById('ideaNewPageBtn');
                if (newPageButton) newPageButton.style.display = isPostitRoom ? 'none' : '';
                if (ideaToolbar) {
                    var canUseTools = !activeWorkspace || activeWorkspace.role !== 'viewer';
                    ideaToolbar.style.display = canUseTools && !isPostitRoom ? 'flex' : 'none';
                    ideaToolbar.classList.remove('expanded');
                    var toolbarToggle = document.getElementById('ideaToolbarToggle');
                    if (toolbarToggle) toolbarToggle.setAttribute('aria-expanded', 'false');
                }
                if (currentRoomId === 'room-1') {
                    syncActiveIdeaPageRefs();
                    var ideaCanvas = document.getElementById('ideaCanvas');
                    var ideaCanvasWrap = document.querySelector('.idea-canvas-wrap');
                    if (ideaCanvas && ideaCanvasWrap && ideaCanvas.parentElement !== ideaCanvasWrap) ideaCanvasWrap.insertBefore(ideaCanvas, ideaCanvasWrap.firstChild);
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
                if (!Array.isArray(page.strokes)) page.strokes = [];
                wbStrokes = page.strokes;
                var normalCanvasWrap = document.getElementById('normalCanvasWrap');
                var normalCanvas = document.getElementById('ideaCanvas');
                if (normalCanvas && normalCanvasWrap && normalCanvas.parentElement !== normalCanvasWrap) normalCanvasWrap.insertBefore(normalCanvas, normalCanvasWrap.firstChild);
                var cleanStoredTitle = firstLinePageTitle(page.title);
                var isDefaultPageTitle = !cleanStoredTitle || !/[0-9A-Za-zก-๙]/.test(cleanStoredTitle) || /^(?:หน้าใหม่|New page)$/i.test(cleanStoredTitle);
                var displayTitle = isDefaultPageTitle ? (currentLang === 'en' ? 'New page' : 'หน้าใหม่') : workroomSystemText(cleanStoredTitle);
                if (isDefaultPageTitle) page.title = '';
                document.getElementById('pageTitle').value = displayTitle;
                if (breadcrumb) breadcrumb.innerHTML = escapeHtml(roomName) + ' <span>/</span> ' + escapeHtml(displayTitle);
                document.getElementById('normalEditor').scrollTop = 0;
                renderNormalPageTabs();
                let container = document.getElementById('editorBlocks');
                container.innerHTML = '';
                page.blocks.forEach((block, index) => createBlockElement(block, index, container, false));
                setTimeout(function () { if (typeof resizeWhiteboardCanvas === 'function') resizeWhiteboardCanvas(); }, 0);
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
                    content.setAttribute('contenteditable', !activeWorkspace || activeWorkspace.role === 'viewer' ? 'false' : block.type === 'code' ? 'plaintext-only' : 'true');
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
                // Bound regex work on document-controlled input. Long code remains
                // fully readable/editable, without syntax colouring that can stall the UI.
                if (code.length > 20000) return escapeCodeHtml(code);
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
                if (!activeWorkspace || activeWorkspace.role === 'viewer') return;
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

            function firstLinePageTitle(value) {
                return editorPlainText(value).split(/\r?\n/)[0].replace(/\s+/g,' ').trim().substring(0,60);
            }
            function syncPageTabTitleFromFirstBlock(page, index, value, ideaCollection) {
                if(!page||index!==0)return;
                if(/^(?:#{1,3}|-|1\.|\[\]|>|---|```)\s*$/.test(firstLinePageTitle(value)))return;
                var nextTitle=firstLinePageTitle(value)||'หน้าใหม่';
                if(page.title===nextTitle)return;
                page.title=nextTitle;
                var titleInput=document.getElementById('pageTitle');if(titleInput)titleInput.value=workroomSystemText(nextTitle);
                if(ideaCollection)renderIdeaPageTabs();else renderRoomPageTabs(currentRoomId);
            }
            function handleBlockInput(e, index, isIdea) {
                if (!activeWorkspace || activeWorkspace.role === 'viewer') return;
                let page = isIdea ? roomPages['room-1'] : roomPages[currentRoomId];
                let block = page.blocks[index];
                let text = e.target.innerText;
                block.content = e.target.querySelector('.mention-chip') ? sanitizeEditorHtml(e.target.innerHTML) : text;
                syncPageTabTitleFromFirstBlock(page,index,block.content,false);

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
                if (!activeWorkspace || activeWorkspace.role === 'viewer') return;
                if (slashMenuTarget === null) return;
                let isIdea = currentRoomId === 'room-1';
                let page = isIdea ? null : roomPages[currentRoomId];
                let block = isIdea ? ideaDocBlocks[slashMenuTarget] : page.blocks[slashMenuTarget];

                if (type === 'image') {
                    var imageTarget = captureDocumentImageTarget();
                    if (!imageTarget || !block) return;
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
                            if (!isCurrentDocumentImageTarget(imageTarget) || !imageTarget.blocks.includes(block)) return;
                            block.type = 'image';
                            block.content = evt.target.result;
                            block.url = evt.target.result;
                            var blocks = imageTarget.blocks;
                            var writingIndex = blocks.indexOf(block) + 1;
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
                content.setAttribute('contenteditable', !activeWorkspace || activeWorkspace.role === 'viewer' ? 'false' : block.type === 'code' ? 'plaintext-only' : 'true');
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
                if (!activeWorkspace || activeWorkspace.role === 'viewer') return;
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
                if (!activeWorkspace || activeWorkspace.role === 'viewer') return;
                let block = ideaDocBlocks[index];
                let text = e.target.innerText;
                block.content = e.target.querySelector('.mention-chip') ? sanitizeEditorHtml(e.target.innerHTML) : text;
                var activePage=ideaPages.find(function(page){return page.id===activeIdeaPageId;});
                syncPageTabTitleFromFirstBlock(activePage,index,block.content,true);
                saveIdeaBlocks();

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
                if (!activeWorkspace || activeWorkspace.role === 'viewer') return;
                if (!ideaDocBlocks[index]) return;
                ideaDocBlocks[index].checked = !ideaDocBlocks[index].checked;
                saveIdeaBlocks();
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
