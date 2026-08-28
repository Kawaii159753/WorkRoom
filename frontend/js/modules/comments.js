/**
 * WorkRoom Mention Engine & Threaded Discussions
 */
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

