/**
 * WorkRoom Universal Workspace Search
 */
            // ========== SEARCH ==========
            let workspaceSearchResults = [], workspaceSearchIndex = -1;
            function plainSearchText(value) {
                return editorPlainText(value).replace(/\s+/g, ' ').trim();
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
                    var displayRoomName = workroomRoomName(roomId);
                    var defaultNames = workroomDefaultRoomNames[roomId];
                    var roomSearchText = [roomName, displayRoomName, defaultNames && defaultNames.th, defaultNames && defaultNames.en].filter(Boolean).join(' ');
                    add({ kind: 'room', title: displayRoomName, meta: currentLang === 'en' ? 'Room' : 'ห้อง', roomId: roomId }, roomSearchText);

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
                }).join('') : '<div class="workspace-search-empty">' + (currentLang === 'en' ? 'No matching rooms, documents, files, or links' : 'ไม่พบห้อง เอกสาร ไฟล์ หรือลิงก์ที่ค้นหา') + '</div>';
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
