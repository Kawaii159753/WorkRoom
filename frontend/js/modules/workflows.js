/**
 * WorkRoom Workflows, Task Pipelines, Post-its & Templates
 */
            // ========== CLOSEOUT WORKFLOW ==========
            var activeTaskDetail = null;
            var activeReplyCommentId = null;
            var myTasksFilter = 'active';
            var showCompletedTasks = false;

            function closeoutStatus(status) {
                return ({ todo: 'review', doing: 'revision', done: 'approved' })[status] || status || 'review';
            }
            function closeoutStatusLabel(status) {
                var labels=currentLang==='en'?{review:'Waiting for feedback',revision:'In revision',approved:'Approved'}:{review:'รอความเห็น',revision:'กำลังแก้ไข',approved:'อนุมัติแล้ว'};
                return labels[closeoutStatus(status)];
            }
            function closeoutMembers() {
                return activeWorkspace && Array.isArray(activeWorkspace.members) ? activeWorkspace.members : [];
            }
            function closeoutInitial(member) {
                return workspaceInitial((member && (member.name || member.email)) || '?');
            }
            function closeoutDateState(value) {
                if (!value) return '';
                var due = new Date(value + 'T23:59:59');
                var days = Math.ceil((due - new Date()) / 86400000);
                return days < 0 ? 'overdue' : days <= 2 ? 'soon' : '';
            }
            function closeoutNotify(email, type, text, task) {
                email = normalizeEmail(email);
                if (!email || email === getCurrentAccount().email) return;
                var box = readJson(mailboxKey(email), []);
                box.unshift({ id: 'task-notif-' + Date.now() + Math.random(), type: type, text: text, taskId: task.id, workspaceName: activeWorkspace ? activeWorkspace.name : '', time: 'เมื่อกี้', read: false, createdAt: Date.now() });
                writeJson(mailboxKey(email), box);
            }
            function normalizeCloseoutTask(row) {
                row.id = row.id || ('task-' + Date.now() + Math.random());
                row.status = closeoutStatus(row.status);
                row.assignees = Array.isArray(row.assignees) ? row.assignees : [];
                row.comments = Array.isArray(row.comments) ? row.comments : [];
                row.dueDate = row.dueDate || '';
                return row;
            }
            function closeoutSave() {
                if (!activeTaskDetail) return;
                saveTaskFlow(activeTaskDetail.isIdea);
                if (document.getElementById('myTasksModal').classList.contains('active')) renderMyTasks();
            }
            function openTaskDetail(blockIndex, rowIndex, isIdea) {
                var blocks = isIdea ? ideaDocBlocks : (roomPages[currentRoomId] && roomPages[currentRoomId].blocks);
                var block = blocks && blocks[blockIndex];
                var row = block && ensureTaskRows(block)[rowIndex];
                if (!row) return;
                activeTaskDetail = { row: normalizeCloseoutTask(row), blockIndex: blockIndex, rowIndex: rowIndex, isIdea: !!isIdea };
                renderTaskDetail(); openModal('taskDetailModal');
            }
            function closeTaskDetail() {
                closeModal('taskDetailModal');
                if (activeTaskDetail) rerenderTaskFlow(activeTaskDetail.isIdea);
                activeTaskDetail = null;
            }
            function renderTaskDetail() {
                if (!activeTaskDetail) return;
                var row = activeTaskDetail.row, readonly = !!(activeWorkspace && activeWorkspace.role === 'viewer');
                document.getElementById('taskDetailTitle').textContent = row.title || 'งานไม่มีชื่อ';
                var members = closeoutMembers();
                var assignees = members.map(function (m) {
                    var email = normalizeEmail(m.email), checked = row.assignees.includes(email);
                    return '<label class="task-assignee-option"><input type="checkbox" value="' + escapeHtml(email) + '" ' + (checked ? 'checked' : '') + (readonly ? ' disabled' : '') + ' onchange="updateTaskAssignees()"><span class="task-avatar">' + escapeHtml(closeoutInitial(m)) + '</span><span>' + escapeHtml(m.name || m.email) + '</span></label>';
                }).join('') || '<p class="task-empty-copy">ยังไม่มีสมาชิกในพื้นที่นี้</p>';
                var comments = row.comments.map(function (comment) {
                    var replies = row.comments.filter(function (reply) { return reply.parentId === comment.id; });
                    if (comment.parentId) return '';
                    return '<article class="task-comment"><div class="task-comment-meta"><span class="task-avatar">' + escapeHtml(workspaceInitial(comment.author)) + '</span><strong>' + escapeHtml(comment.author) + '</strong><time>' + new Date(comment.createdAt).toLocaleString('th-TH') + '</time></div><p>' + escapeHtml(comment.text) + '</p><button onclick="replyTaskComment(\'' + escapeHtml(comment.id) + '\')">ตอบกลับ</button>'
                        + replies.map(function (reply) { return '<div class="task-comment-reply"><strong>' + escapeHtml(reply.author) + '</strong> ' + escapeHtml(reply.text) + '</div>'; }).join('') + '</article>';
                }).join('') || '<div class="task-empty-copy">ยังไม่มีคอมเมนต์</div>';
                document.getElementById('taskDetailBody').innerHTML = '<div class="task-detail-grid"><label>สถานะ<select id="taskDetailStatus" ' + (readonly ? 'disabled' : '') + ' onchange="updateTaskStatus(this.value)"><option value="review">รอความเห็น</option><option value="revision">กำลังแก้ไข</option><option value="approved">อนุมัติแล้ว</option></select></label><label>วันครบกำหนด<input id="taskDetailDue" type="date" value="' + escapeHtml(row.dueDate) + '" ' + (readonly ? 'disabled' : '') + ' onchange="updateTaskDue(this.value)"></label></div><section class="task-detail-section"><h3>ผู้รับผิดชอบ</h3><div class="task-assignee-list">' + assignees + '</div></section><section class="task-detail-section"><div class="task-section-heading"><h3>คอมเมนต์และตอบกลับ</h3><span>ใช้ @ชื่อ เพื่อ mention</span></div><div class="task-comments">' + comments + '</div>' + (readonly ? '' : '<div class="task-comment-compose"><textarea id="taskCommentInput" rows="3" placeholder="เขียนความคิดเห็น หรือ @ชื่อ สมาชิก..."></textarea><button onclick="addTaskComment()">ส่งความคิดเห็น</button></div>') + '</section>';
                document.getElementById('taskDetailStatus').value = row.status;
            }
            function updateTaskStatus(value) {
                var row = activeTaskDetail.row, previous = row.status; row.status = closeoutStatus(value); closeoutSave();
                if (previous !== row.status) row.assignees.forEach(function (email) { closeoutNotify(email, 'task_status', 'งาน “' + (row.title || 'ไม่มีชื่อ') + '” เปลี่ยนเป็น ' + closeoutStatusLabel(row.status), row); });
                renderTaskDetail();
            }
            function updateTaskDue(value) { activeTaskDetail.row.dueDate = value; closeoutSave(); }
            function updateTaskAssignees() {
                var row = activeTaskDetail.row, old = row.assignees.slice();
                row.assignees = Array.from(document.querySelectorAll('#taskDetailBody .task-assignee-option input:checked')).map(function (el) { return normalizeEmail(el.value); });
                row.assignees.filter(function (email) { return !old.includes(email); }).forEach(function (email) { closeoutNotify(email, 'task_assigned', 'คุณได้รับมอบหมายงาน “' + (row.title || 'ไม่มีชื่อ') + '”', row); });
                closeoutSave();
            }
            function addTaskComment(parentId, preset) {
                var input = document.getElementById('taskCommentInput'), text = String(preset || (input && input.value) || '').trim();
                if (!text) return;
                var row = activeTaskDetail.row, account = getCurrentAccount();
                row.comments.push({ id: 'comment-' + Date.now() + Math.random(), parentId: parentId || null, text: text, author: account.name, authorEmail: account.email, createdAt: Date.now(), resolved: false });
                row.assignees.forEach(function (email) { closeoutNotify(email, 'task_comment', account.name + ' คอมเมนต์งาน “' + (row.title || 'ไม่มีชื่อ') + '”', row); });
                closeoutMembers().forEach(function (m) { if (new RegExp('@' + String(m.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text)) closeoutNotify(m.email, 'mention', account.name + ' mention คุณในงาน “' + (row.title || 'ไม่มีชื่อ') + '”', row); });
                closeoutSave(); renderTaskDetail();
            }
            function replyTaskComment(parentId) {
                activeReplyCommentId = parentId;
                renderTaskDetail();
                setTimeout(function () { var input = document.getElementById('taskReplyInput'); if (input) input.focus(); }, 30);
            }
            function cancelTaskReply() { activeReplyCommentId = null; renderTaskDetail(); }
            function submitTaskReply(parentId) {
                var input = document.getElementById('taskReplyInput'), text = String(input && input.value || '').trim();
                if (!text) { if (input) input.focus(); return; }
                activeReplyCommentId = null;
                addTaskComment(parentId, text);
            }
            function allCloseoutTasks() {
                var result = [];
                Object.keys(roomPages).forEach(function (roomId) {
                    var pages = roomPageCollections[roomId] && roomPageCollections[roomId].pages;
                    var sources = pages || [roomPages[roomId]];
                    sources.forEach(function (page) { (page.blocks || []).forEach(function (block, blockIndex) { if (block.type === 'table') ensureTaskRows(block).forEach(function (row, rowIndex) { result.push({ row: normalizeCloseoutTask(row), roomId: roomId, pageId: page.id || null, blockIndex: blockIndex, rowIndex: rowIndex, isIdea: roomId === 'room-1' }); }); }); });
                });
                ideaPages.forEach(function (page) { (page.blocks || []).forEach(function (block, blockIndex) { if (block.type === 'table') ensureTaskRows(block).forEach(function (row, rowIndex) { if (!result.some(function (x) { return x.row === row; })) result.push({ row: normalizeCloseoutTask(row), roomId: 'room-1', pageId: page.id || null, blockIndex: blockIndex, rowIndex: rowIndex, isIdea: true }); }); }); });
                return result;
            }
            function openMyTasks() { myTasksFilter = 'active'; showCompletedTasks = false; renderMyTasks(); openModal('myTasksModal'); }
            function setMyTasksFilter(value) { myTasksFilter = value; renderMyTasks(); }
            function renderMyTasks() {
                var email = getCurrentAccount().email;
                var tasks = allCloseoutTasks().filter(function (item) { return item.row.assignees.includes(email); });
                if (myTasksFilter === 'due') tasks = tasks.filter(function (item) { return closeoutDateState(item.row.dueDate); });
                if (myTasksFilter !== 'all' && myTasksFilter !== 'due') tasks = tasks.filter(function (item) { return item.row.status === myTasksFilter; });
                document.getElementById('myTasksFilters').innerHTML = [['all','ทั้งหมด'],['review','รอความเห็น'],['revision','กำลังแก้ไข'],['approved','อนุมัติแล้ว'],['due','ใกล้/เลยกำหนด']].map(function (f) { return '<button class="' + (myTasksFilter === f[0] ? 'active' : '') + '" onclick="setMyTasksFilter(\'' + f[0] + '\')">' + f[1] + '</button>'; }).join('');
                document.getElementById('myTasksList').innerHTML = tasks.length ? tasks.map(function (item) { var state = closeoutDateState(item.row.dueDate); return '<button class="my-task-card" onclick="closeModal(\'myTasksModal\');switchRoom(\'' + escapeHtml(item.roomId) + '\');setTimeout(function(){openTaskDetail(' + item.blockIndex + ',' + item.rowIndex + ',' + String(item.isIdea) + ')},80)"><span><strong>' + escapeHtml(item.row.title || 'งานไม่มีชื่อ') + '</strong><small>' + escapeHtml(workroomRoomName(item.roomId)) + '</small></span><span class="task-status-pill ' + item.row.status + '">' + closeoutStatusLabel(item.row.status) + '</span>' + (item.row.dueDate ? '<time class="task-due ' + state + '">' + escapeHtml(item.row.dueDate) + '</time>' : '') + '</button>'; }).join('') : '<div class="task-empty-copy task-empty-large">ยังไม่มีงานที่มอบหมายให้คุณ</div>';
            }

            createTaskFlowTable = function (block, blockIndex, isIdea) {
                var rows = ensureTaskRows(block), readonly = !!(activeWorkspace && activeWorkspace.role === 'viewer');
                rows.forEach(normalizeCloseoutTask);
                var root = document.createElement('section'); root.className = 'task-flow closeout-task-flow'; root.setAttribute('aria-label', 'ตารางติดตามงาน');
                var head = document.createElement('div'); head.className = 'task-flow-head'; head.innerHTML = '<div class="task-flow-title"><span class="task-flow-mark">✓</span><span>แผนงานปิดงาน</span></div><div class="task-flow-summary">' + ['review','revision','approved'].map(function (status) { return '<span class="task-flow-count ' + status + '">' + closeoutStatusLabel(status) + ' ' + rows.filter(function (r) { return r.status === status; }).length + '</span>'; }).join('') + (readonly ? '' : '<button class="task-flow-delete-table" type="button" onclick="confirmDeleteTaskFlow(event,'+blockIndex+','+String(!!isIdea)+')" title="ลบแผนงานทั้งตาราง" aria-label="ลบแผนงานทั้งตาราง"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6"/></svg><span>ลบแผนงาน</span></button>') + '</div>'; root.appendChild(head);
                var list = document.createElement('div'); list.className = 'closeout-task-list';
                rows.forEach(function (row, rowIndex) {
                    var card = document.createElement('div'); card.className = 'closeout-task-row';
                    var avatars = row.assignees.slice(0,3).map(function (email) { var m = closeoutMembers().find(function (x) { return normalizeEmail(x.email) === email; }); return '<span class="task-avatar" title="' + escapeHtml((m && (m.name || m.email)) || email) + '">' + escapeHtml(closeoutInitial(m || {email:email})) + '</span>'; }).join('');
                    card.innerHTML = '<input class="task-flow-input closeout-task-title" value="' + escapeHtml(row.title || '') + '" placeholder="เขียนชื่องาน..." ' + (readonly ? 'readonly' : '') + '><button class="task-status-pill ' + row.status + '" type="button">' + closeoutStatusLabel(row.status) + '</button><div class="task-row-avatars">' + (avatars || '<span class="task-unassigned">ยังไม่ assign</span>') + '</div>' + (row.dueDate ? '<time class="task-due ' + closeoutDateState(row.dueDate) + '">' + escapeHtml(row.dueDate) + '</time>' : '<span class="task-no-due">ไม่มีกำหนด</span>') + '<button class="task-detail-open" type="button">รายละเอียด · ' + row.comments.length + ' ความเห็น</button>' + (readonly ? '' : '<button class="task-flow-remove" type="button" aria-label="ลบงาน">×</button>');
                    var titleInput = card.querySelector('input'); titleInput.oninput = function () { row.title = titleInput.value; saveTaskFlow(isIdea); };
                    card.querySelector('.task-status-pill').onclick = function () { openTaskDetail(blockIndex, rowIndex, isIdea); };
                    card.querySelector('.task-detail-open').onclick = function () { openTaskDetail(blockIndex, rowIndex, isIdea); };
                    var remove = card.querySelector('.task-flow-remove'); if (remove) remove.onclick = function () { rows.splice(rowIndex,1); if (!rows.length) rows.push(normalizeCloseoutTask({title:'',status:'review'})); saveTaskFlow(isIdea); rerenderTaskFlow(isIdea); };
                    list.appendChild(card);
                });
                root.appendChild(list);
                if (!readonly) { var add = document.createElement('button'); add.type = 'button'; add.className = 'task-flow-add closeout-add-task'; add.textContent = '＋ เพิ่มงาน'; add.onclick = function () { rows.push(normalizeCloseoutTask({ id:'task-'+Date.now(), title:'', status:'review' })); saveTaskFlow(isIdea); rerenderTaskFlow(isIdea); }; root.appendChild(add); }
                return root;
            };

            function confirmDeleteTaskFlow(event, blockIndex, isIdea) {
                if (event) { event.preventDefault(); event.stopPropagation(); }
                openWorkroomConfirm(currentLang === 'en' ? { title:'Delete this task board?', message:'Tasks, statuses, assignees, and comments in this board will all be deleted.', accept:'Delete board' } : { title:'ลบแผนงานทั้งตาราง?', message:'งาน สถานะ ผู้รับผิดชอบ และความคิดเห็นในตารางนี้จะถูกลบทั้งหมด', accept:'ลบแผนงาน' }, function () {
                    deleteTaskFlowBlock(null, blockIndex, isIdea);
                });
            }

            // ===== Unified artifact workflow: idea, file and post-it =====
            function artifactTypeLabel(kind) { var labels=currentLang==='en'?{idea:'Idea',file:'File',postit:'Post-it','postit-block':'Post-it task',task:'Task'}:{idea:'ไอเดีย',file:'ไฟล์',postit:'โปสต์อิท','postit-block':'งานย่อยในโปสต์อิท',task:'งาน'};return labels[kind]||(currentLang==='en'?'Work item':'ชิ้นงาน'); }
            function postitHeadingTitle(postit) {
                var blocks=postit&&Array.isArray(postit.blocks)?postit.blocks:[];
                var firstHeading=blocks.find(function(item){return item&&(item.type==='h1'||item.type==='h2')&&String(item.content||'').replace(/<[^>]*>/g,'').trim();});
                var firstBlock = firstHeading || blocks.find(function (item) {
                    return String(item && item.content || '').replace(/<[^>]*>/g, '').trim();
                });
                if (firstBlock) { var holder=document.createElement('div');holder.innerHTML=String(firstBlock.content||'');var heading=String(holder.textContent||holder.innerText||'').replace(/\s+/g,' ').trim();if(heading)return heading.substring(0,80); }
                return String(postit&&postit.title||'').replace(/\s+/g,' ').trim().substring(0,80);
            }
            function syncPostitTitleFromHeading(postit) {
                if(!postit)return '';
                var headingBlock=(postit.blocks||[]).find(function(item){return item&&(item.type==='h1'||item.type==='h2')&&String(item.content||'').replace(/<[^>]*>/g,'').trim();});
                if(!headingBlock)return postit.title||'';
                var holder=document.createElement('div');holder.innerHTML=String(headingBlock.content||'');
                var heading=String(holder.textContent||holder.innerText||'').replace(/\s+/g,' ').trim().substring(0,100);
                if(!heading)return postit.title||'';
                postit.title=heading;if(postit.workflow)postit.workflow.title=heading;
                return heading;
            }
            function postitBlockTaskTitle(block, postit) {
                if (!block) return postitHeadingTitle(postit) || 'งานย่อยที่ยังไม่มีชื่อ';
                var holder = document.createElement('div');
                holder.innerHTML = String(block.content || '');
                var text = String(holder.textContent || holder.innerText || '').replace(/\s+/g, ' ').trim();
                if (text) return text.substring(0, 80);
                if (block.type === 'image') return 'รูปภาพในโปสต์อิท';
                if (block.type === 'embed') return String(block.url || '').trim().substring(0, 80) || 'ลิงก์ในโปสต์อิท';
                if (block.type === 'table') return 'แผนงานในโปสต์อิท';
                return postitHeadingTitle(postit) || 'งานย่อยที่ยังไม่มีชื่อ';
            }
            function artifactTitle(item, kind, parentPostit) {
                if (kind === 'postit-block') return postitBlockTaskTitle(item, parentPostit);
                if (kind === 'postit') return postitHeadingTitle(item);
                if (item.title) return item.title;
                if (item.name || item.fileName) return item.name || item.fileName;
                var plain = blockToPlainText(item).trim();
                return plain.substring(0, 54) || artifactTypeLabel(kind) + 'ไม่มีชื่อ';
            }
            function ensureArtifactWorkflow(item, kind, parentPostit) {
                item.workflow = item.workflow || {};
                var wf = item.workflow;
                wf.id = wf.id || ('artifact-' + Date.now() + Math.random().toString(36).slice(2));
                wf.title = artifactTitle(item, kind, parentPostit);
                wf.status = closeoutStatus(wf.status);
                wf.assignees = Array.isArray(wf.assignees) ? wf.assignees : [];
                wf.comments = Array.isArray(wf.comments) ? wf.comments : [];
                wf.links = Array.isArray(wf.links) ? wf.links : [];
                wf.activity = Array.isArray(wf.activity) ? wf.activity : [];
                wf.dueDate = wf.dueDate || '';
                wf.kind = kind;
                return wf;
            }
            function addWorkflowActivity(wf, action) {
                var account = getCurrentAccount();
                wf.activity.unshift({ id: 'activity-' + Date.now() + Math.random(), actor: account.name, action: action, createdAt: Date.now() });
                wf.activity = wf.activity.slice(0, 30);
            }
            function openArtifactWorkflow(kind, index, id) {
                var source, isIdea = false;
                if (kind === 'postit') {
                    var page = roomPages[currentRoomId];
                    source = page && (page.postIts || []).find(function (post) { return post.id === id; });
                } else if (kind === 'postit-block') {
                    var postitPage = roomPages[activePostitEditorRoomId || currentRoomId];
                    var postit = postitPage && (postitPage.postIts || []).find(function (post) { return post.id === id; });
                    source = postit && (postit.blocks || [])[index];
                } else {
                    isIdea = kind === 'idea';
                    source = (isIdea ? ideaDocBlocks : ((roomPages[currentRoomId] || {}).blocks || []))[index];
                }
                if (!source) return showToast('ไม่พบชิ้นงาน');
                var wf = ensureArtifactWorkflow(source, kind, kind === 'postit-block' ? postit : null);
                if (!wf.activity.length) addWorkflowActivity(wf, 'สร้างรายการติดตาม');
                activeTaskDetail = { row: wf, artifact: source, artifactKind: kind, isIdea: isIdea, standalone: true, postitId: kind === 'postit-block' ? id : null, blockIndex: kind === 'postit-block' ? index : null };
                renderTaskDetail(); openModal('taskDetailModal');
            }
            var closeoutSaveBase = closeoutSave;
            closeoutSave = function () {
                if (activeTaskDetail && activeTaskDetail.standalone) {
                    if (activeTaskDetail.isIdea) saveIdeaBlocks(); else saveActiveWorkspaceData();
                    return;
                }
                closeoutSaveBase();
            };
            var closeTaskDetailBase = closeTaskDetail;
            closeTaskDetail = function () {
                if (activeTaskDetail && activeTaskDetail.standalone) {
                    closeModal('taskDetailModal');
                    if (activeTaskDetail.artifactKind === 'postit-block') {
                        var activePostit = getActivePostitEditorItem();
                        if (activePostit) renderPostitFullBlocks(activePostit);
                    } else if (activeTaskDetail.artifactKind === 'postit') renderPostitLibrary();
                    else if (activeTaskDetail.isIdea) renderIdeaBlocks();
                    else renderEditor();
                    activeTaskDetail = null;
                    return;
                }
                closeTaskDetailBase();
            };
            function workflowStatusIcon(status) { return ({ review: '◌', revision: '↻', approved: '✓' })[closeoutStatus(status)] || '◌'; }
            function workflowCommentsHtml(row, canModerate) {
                var t=currentLang==='en'?{empty:'No comments yet — start a conversation with your team',reply:'Reply to',replyPlaceholder:'Write a reply or @mention a member...',cancel:'Cancel',send:'Send reply',replyAction:'Reply',continue:'Needs more work',resolved:'Resolved'}:{empty:'ยังไม่มีคอมเมนต์ — เริ่มคุยกับทีมได้เลย',reply:'ตอบกลับ',replyPlaceholder:'เขียนคำตอบ หรือ @ชื่อ สมาชิก...',cancel:'ยกเลิก',send:'ส่งคำตอบ',replyAction:'ตอบกลับ',continue:'ต้องทำต่อ',resolved:'แก้แล้ว'};
                var roots = row.comments.filter(function (c) { return !c.parentId; });
                if (!roots.length) return '<div class="task-empty-copy">'+t.empty+'</div>';
                return roots.map(function (comment) {
                    var replies = row.comments.filter(function (reply) { return reply.parentId === comment.id; });
                    var replyComposer = activeReplyCommentId === comment.id ? '<div class="task-reply-compose"><label for="taskReplyInput">'+t.reply+' ' + escapeHtml(comment.author) + '</label><textarea id="taskReplyInput" rows="2" placeholder="'+t.replyPlaceholder+'"></textarea><div><button class="task-reply-cancel" onclick="cancelTaskReply()">'+t.cancel+'</button><button class="task-reply-send" onclick="submitTaskReply(\'' + escapeHtml(comment.id) + '\')">'+t.send+'</button></div></div>' : '';
                    return '<article class="task-comment' + (comment.resolved ? ' resolved' : '') + '"><div class="task-comment-meta"><span class="task-avatar">' + escapeHtml(workspaceInitial(comment.author)) + '</span><strong>' + escapeHtml(comment.author) + '</strong><time>' + new Date(comment.createdAt).toLocaleString(currentLang==='en'?'en-US':'th-TH') + '</time></div><p>' + escapeHtml(comment.text) + '</p><div class="task-comment-actions"><button onclick="replyTaskComment(\'' + escapeHtml(comment.id) + '\')">↩ '+t.replyAction+'</button>' + (canModerate ? '<button onclick="toggleCommentResolution(\'' + escapeHtml(comment.id) + '\')">' + (comment.resolved ? '↻ '+t.continue : '✓ '+t.resolved) + '</button>' : '') + '</div>' + replies.map(function (reply) { return '<div class="task-comment-reply"><strong>' + escapeHtml(reply.author) + '</strong> ' + escapeHtml(reply.text) + '</div>'; }).join('') + replyComposer + '</article>';
                }).join('');
            }
            renderTaskDetail = function () {
                if (!activeTaskDetail) return;
                var row = normalizeCloseoutTask(activeTaskDetail.row), role = activeWorkspace ? activeWorkspace.role : 'owner';
                var canEdit = role === 'owner' || role === 'editor', canComment = !!activeWorkspace;
                var kind = activeTaskDetail.artifactKind || 'task';
                document.getElementById('taskDetailTitle').textContent = row.title || artifactTypeLabel(kind) + 'ไม่มีชื่อ';
                var members = closeoutMembers();
                var assignees = members.map(function (m) { var email = normalizeEmail(m.email), checked = row.assignees.includes(email); return '<label class="task-assignee-option"><input type="checkbox" value="' + escapeHtml(email) + '" ' + (checked ? 'checked' : '') + (canEdit ? '' : ' disabled') + ' onchange="updateTaskAssignees()"><span class="task-avatar">' + escapeHtml(closeoutInitial(m)) + '</span><span><b>' + escapeHtml(m.name || m.email) + '</b><small>' + escapeHtml(m.role || 'member') + '</small></span></label>'; }).join('') || '<p class="task-empty-copy">ยังไม่มีสมาชิกในพื้นที่นี้</p>';
                var links = (row.links || []).map(function (link, i) { return '<div class="workflow-link"><span>↗</span><a href="' + escapeHtml(link.url) + '" target="_blank" rel="noopener">' + escapeHtml(link.label || link.url) + '</a>' + (canEdit ? '<button onclick="removeWorkflowLink(' + i + ')" aria-label="ลบลิงก์">×</button>' : '') + '</div>'; }).join('') || '<div class="task-empty-copy compact">ยังไม่ได้เชื่อมไฟล์ เอกสาร หรือหน้าวาด</div>';
                var activity = (row.activity || []).map(function (item) { return '<li><span class="activity-dot"></span><div><strong>' + escapeHtml(item.actor) + '</strong> ' + escapeHtml(item.action) + '<time>' + new Date(item.createdAt).toLocaleString('th-TH') + '</time></div></li>'; }).join('') || '<li><span class="activity-dot"></span><div>ยังไม่มีกิจกรรม</div></li>';
                var history = kind === 'file' ? '<section class="task-detail-section"><div class="task-section-heading"><h3>ประวัติการรีวิว</h3><span>บันทึกผู้ดำเนินการอัตโนมัติ</span></div><ol class="workflow-activity">' + activity + '</ol></section>' : '';
                document.getElementById('taskDetailBody').innerHTML = '<div class="workflow-hero"><div class="workflow-kind-icon ' + kind + '">' + (kind === 'file' ? '▱' : kind === 'postit' ? '▰' : kind === 'idea' ? '✦' : '✓') + '</div><div><span>' + artifactTypeLabel(kind) + '</span><p>ทุกคนเห็นคนรับผิดชอบ สถานะ และสิ่งที่ต้องตัดสินใจในที่เดียว</p></div><div class="workflow-status-preview ' + row.status + '"><b>' + workflowStatusIcon(row.status) + '</b>' + closeoutStatusLabel(row.status) + '</div></div>'
                    + '<div class="task-detail-grid workflow-fields"><label>สถานะ<select id="taskDetailStatus" ' + (canEdit ? '' : 'disabled') + ' onchange="updateTaskStatus(this.value)"><option value="review">รอความเห็น</option><option value="revision">กำลังแก้ไข</option><option value="approved">อนุมัติแล้ว</option></select></label><label>วันครบกำหนด<input id="taskDetailDue" type="date" value="' + escapeHtml(row.dueDate) + '" ' + (canEdit ? '' : 'disabled') + ' onchange="updateTaskDue(this.value)"></label></div>'
                    + '<section class="task-detail-section"><div class="task-section-heading"><h3>ผู้รับผิดชอบ</h3><span>เลือกได้มากกว่า 1 คน</span></div><div class="task-assignee-list">' + assignees + '</div></section>'
                    + '<section class="task-detail-section"><div class="task-section-heading"><h3>สิ่งที่เกี่ยวข้อง</h3><span>รวมงานที่กระจัดกระจายไว้ด้วยกัน</span></div><div class="workflow-links">' + links + '</div>' + (canEdit ? '<div class="workflow-link-compose"><input id="workflowLinkLabel" placeholder="ชื่อ เช่น ไฟล์ดีไซน์"><input id="workflowLinkUrl" type="url" placeholder="https://..."><button onclick="addWorkflowLink()">เชื่อมลิงก์</button></div>' : '') + '</section>'
                    + '<section class="task-detail-section"><div class="task-section-heading"><h3>คอมเมนต์และตอบกลับ</h3><span>ใช้ @ชื่อ เพื่อ mention</span></div><div class="task-comments">' + workflowCommentsHtml(row, canEdit) + '</div>' + (canComment ? '<div class="task-comment-compose"><textarea id="taskCommentInput" rows="3" placeholder="เขียนความคิดเห็น หรือ @ชื่อ สมาชิก..."></textarea><button onclick="addTaskComment()">ส่งความคิดเห็น</button></div>' : '') + '</section>' + history
                    + (kind !== 'file' ? '<section class="task-detail-section"><div class="task-section-heading"><h3>กิจกรรมล่าสุด</h3><span>เก็บสูงสุด 30 รายการ</span></div><ol class="workflow-activity">' + activity + '</ol></section>' : '');
                document.getElementById('taskDetailStatus').value = row.status;
            };
            var updateTaskStatusBase = updateTaskStatus;
            updateTaskStatus = function (value) {
                if (!activeTaskDetail || !activeTaskDetail.standalone) return updateTaskStatusBase(value);
                var row = activeTaskDetail.row, previous = row.status; row.status = closeoutStatus(value);
                if (previous !== row.status) { addWorkflowActivity(row, 'เปลี่ยนสถานะเป็น “' + closeoutStatusLabel(row.status) + '”'); row.assignees.forEach(function (email) { closeoutNotify(email, 'task_status', '“' + row.title + '” เปลี่ยนเป็น ' + closeoutStatusLabel(row.status), row); }); }
                closeoutSave(); renderTaskDetail();
            };
            var updateTaskDueBase = updateTaskDue;
            updateTaskDue = function (value) { if (!activeTaskDetail.standalone) return updateTaskDueBase(value); activeTaskDetail.row.dueDate = value; addWorkflowActivity(activeTaskDetail.row, value ? 'กำหนดส่ง ' + value : 'นำวันครบกำหนดออก'); closeoutSave(); };
            var updateTaskAssigneesBase = updateTaskAssignees;
            updateTaskAssignees = function () {
                if (!activeTaskDetail.standalone) return updateTaskAssigneesBase();
                var row = activeTaskDetail.row, old = row.assignees.slice(); row.assignees = Array.from(document.querySelectorAll('#taskDetailBody .task-assignee-option input:checked')).map(function (el) { return normalizeEmail(el.value); });
                row.assignees.filter(function (email) { return !old.includes(email); }).forEach(function (email) { closeoutNotify(email, 'task_assigned', 'คุณได้รับมอบหมาย “' + row.title + '”', row); });
                addWorkflowActivity(row, 'อัปเดตผู้รับผิดชอบ'); closeoutSave(); renderTaskDetail();
            };
            var addTaskCommentBase = addTaskComment;
            addTaskComment = function (parentId, preset) {
                if (!activeTaskDetail.standalone) return addTaskCommentBase(parentId, preset);
                var input = document.getElementById('taskCommentInput'), text = String(preset || (input && input.value) || '').trim(); if (!text) return;
                var row = activeTaskDetail.row, account = getCurrentAccount(); row.comments.push({ id: 'comment-' + Date.now() + Math.random(), parentId: parentId || null, text: text, author: account.name, authorEmail: account.email, createdAt: Date.now(), resolved: false });
                addWorkflowActivity(row, parentId ? 'ตอบกลับความคิดเห็น' : 'เพิ่มความคิดเห็น'); row.assignees.forEach(function (email) { closeoutNotify(email, 'task_comment', account.name + ' คอมเมนต์ “' + row.title + '”', row); });
                closeoutMembers().forEach(function (m) { if (text.toLowerCase().includes('@' + String(m.name || '').toLowerCase())) closeoutNotify(m.email, 'mention', account.name + ' mention คุณใน “' + row.title + '”', row); }); closeoutSave(); renderTaskDetail();
            };
            function toggleCommentResolution(id) { var comment = activeTaskDetail.row.comments.find(function (c) { return c.id === id; }); if (!comment) return; comment.resolved = !comment.resolved; addWorkflowActivity(activeTaskDetail.row, comment.resolved ? 'ทำเครื่องหมายความคิดเห็นว่าแก้แล้ว' : 'เปิดความคิดเห็นให้ทำต่อ'); closeoutSave(); renderTaskDetail(); }
            function addWorkflowLink() { var label = document.getElementById('workflowLinkLabel').value.trim(), raw = document.getElementById('workflowLinkUrl').value.trim(); if (!raw) return showToast('กรุณาใส่ลิงก์'); var url = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw; try { var parsed = new URL(url); if (!/^https?:$/.test(parsed.protocol)) throw new Error(); activeTaskDetail.row.links.push({ label: label || parsed.hostname, url: parsed.href }); addWorkflowActivity(activeTaskDetail.row, 'เชื่อม “' + (label || parsed.hostname) + '”'); closeoutSave(); renderTaskDetail(); } catch (e) { showToast('ลิงก์ไม่ถูกต้อง'); } }
            function removeWorkflowLink(index) { activeTaskDetail.row.links.splice(index, 1); addWorkflowActivity(activeTaskDetail.row, 'นำลิงก์ที่เกี่ยวข้องออก'); closeoutSave(); renderTaskDetail(); }

            var renderPostitLibraryBase = renderPostitLibrary;
            renderPostitLibrary = function () {
                renderPostitLibraryBase();
                var page = roomPages[currentRoomId], items = page && Array.isArray(page.postIts) ? page.postIts.slice().sort(function (a,b) { return Number(Boolean(b.pinned))-Number(Boolean(a.pinned)) || (b.savedAt||0)-(a.savedAt||0); }) : [];
                document.querySelectorAll('#postitGrid .postit-card').forEach(function (card, i) { var item = items[i]; if (!item) return; var wf = ensureArtifactWorkflow(item, 'postit'); card.classList.add('workflow-enabled'); card.insertAdjacentHTML('beforeend','<button class="postit-workflow-chip ' + wf.status + '" onclick="event.stopPropagation();openArtifactWorkflow(\'postit\',0,\'' + escapeHtml(item.id) + '\')"><span>' + workflowStatusIcon(wf.status) + '</span>' + closeoutStatusLabel(wf.status) + (wf.assignees.length ? '<i>' + wf.assignees.length + '</i>' : '') + '</button>'); });
            };
            var openPostitBase = openPostit;
            openPostit = function (id) { openPostitBase(id); var body = document.getElementById('postitReaderBody'); if (body) body.insertAdjacentHTML('beforeend','<button class="postit-open-workflow" onclick="closeModal(\'postitReaderModal\');openArtifactWorkflow(\'postit\',0,\'' + escapeHtml(id) + '\')">เปิดสถานะและความคิดเห็น <span>→</span></button>'); };

            var WORKROOM_TEMPLATES = [
                { id:'brief', icon:'⌁', color:'yellow', title:'รับบรีฟ', desc:'เป้าหมาย กลุ่มเป้าหมาย ขอบเขต และสิ่งส่งมอบ', blocks:[{type:'h1',content:'บรีฟโปรเจกต์'},{type:'h2',content:'เป้าหมาย'},{type:'text',content:'เราต้องการแก้ปัญหาอะไร และผลลัพธ์ที่คาดหวังคืออะไร'},{type:'h2',content:'กลุ่มเป้าหมาย'},{type:'text',content:''},{type:'h2',content:'สิ่งส่งมอบและข้อจำกัด'},{type:'bullet',content:''}] },
                { id:'brainstorm', icon:'✦', color:'blue', title:'Brainstorm', desc:'รวบรวมไอเดีย จัดกลุ่ม และเลือกแนวทางที่น่าลอง', blocks:[{type:'h1',content:'Brainstorm'},{type:'h2',content:'โจทย์ที่เรากำลังแก้'},{type:'text',content:''},{type:'h2',content:'ไอเดียทั้งหมด'},{type:'bullet',content:''},{type:'h2',content:'แนวทางที่เลือก'},{type:'text',content:''}] },
                { id:'client-review', icon:'◉', color:'pink', title:'รีวิวงานลูกค้า', desc:'รวมไฟล์ ข้อเสนอแนะ และการตัดสินใจไว้หน้าเดียว', blocks:[{type:'h1',content:'รีวิวงานลูกค้า'},{type:'h2',content:'เวอร์ชันที่ส่งรีวิว'},{type:'text',content:''},{type:'h2',content:'Feedback'},{type:'bullet',content:''},{type:'h2',content:'สิ่งที่ต้องแก้'},{type:'table',taskRows:[{id:'task-'+Date.now(),title:'',status:'review',assignees:[],comments:[],dueDate:''}]}] },
                { id:'handoff', icon:'✓', color:'green', title:'ส่งมอบงาน', desc:'Checklist ไฟล์ ลิงก์ คู่มือ และการอนุมัติขั้นสุดท้าย', blocks:[{type:'h1',content:'ส่งมอบงาน'},{type:'h2',content:'ไฟล์และลิงก์สำคัญ'},{type:'bullet',content:''},{type:'h2',content:'Checklist ก่อนส่ง'},{type:'todo',content:'ตรวจชื่อและเวอร์ชันไฟล์',checked:false},{type:'todo',content:'ยืนยันสิทธิ์การเข้าถึง',checked:false},{type:'todo',content:'รับการอนุมัติขั้นสุดท้าย',checked:false}] }
            ];
            function templateDisplayCopy(id){var en={brief:['Project brief','Goals, audience, scope and deliverables'],brainstorm:['Brainstorm','Collect, group and choose ideas worth exploring'],'client-review':['Client review','Keep files, feedback and decisions together'],handoff:['Project handoff','Checklist for files, links, guides and final approval']};return currentLang==='en'?en[id]:null;}
            function renderTemplateGallery(){document.getElementById('templateGalleryGrid').innerHTML=WORKROOM_TEMPLATES.map(function(t){var translated=templateDisplayCopy(t.id),title=translated?translated[0]:t.title,desc=translated?translated[1]:t.desc;return '<button class="template-card" data-color="'+t.color+'" onclick="useWorkroomTemplate(\''+t.id+'\')"><span class="template-card-icon">'+t.icon+'</span><strong>'+title+'</strong><p>'+desc+'</p><span class="template-card-action">'+(currentLang==='en'?'Use template':'ใช้เทมเพลต')+' →</span></button>';}).join('');}
            function openTemplateGallery() { renderTemplateGallery(); openModal('templateGalleryModal'); }
            function useWorkroomTemplate(id) { if (activeWorkspace && activeWorkspace.role === 'viewer') return showToast('Viewer ไม่สามารถสร้างหน้าใหม่ได้'); var template = WORKROOM_TEMPLATES.find(function (t) { return t.id === id; }); if (!template) return; var page = { id:'idea-page-'+Date.now(), title:template.title, blocks:JSON.parse(JSON.stringify(template.blocks)), strokes:[], createdAt:Date.now() }; ideaPages.push(page); activeIdeaPageId=page.id; syncActiveIdeaPageRefs(); saveActiveWorkspaceData(); closeModal('templateGalleryModal'); switchRoom('room-1'); renderIdeaPageTabs(); renderIdeaBlocks(); showToast('สร้างหน้า “'+template.title+'” แล้ว'); }

            var myTaskArtifactItems = [];
            function collectArtifactTasks() {
                var output = [];
                Object.keys(roomPages).forEach(function (roomId) {
                    var page = roomPages[roomId];
                    (page.postIts || []).forEach(function (post) {
                        output.push({ row:ensureArtifactWorkflow(post,'postit'), kind:'postit', roomId:roomId, postitId:post.id, source:post });
                        (post.blocks || []).forEach(function (block, index) {
                            if (!block.workflow) return;
                            output.push({ row:ensureArtifactWorkflow(block,'postit-block',post), kind:'postit-block', roomId:roomId, postitId:post.id, index:index, source:block });
                        });
                    });
                });
                return output;
            }
            var allCloseoutTasksBase = allCloseoutTasks;
            allCloseoutTasks = function () { return allCloseoutTasksBase().concat(collectArtifactTasks()); };
            function openMyTaskItem(index) {
                var item = myTaskArtifactItems[index]; if (!item) return;
                closeModal('myTasksModal');
                if (item.kind) {
                    switchRoom(item.roomId);
                    if ((item.kind === 'idea' || item.kind === 'file') && !item.normal) { activeIdeaPageId = item.pageId; syncActiveIdeaPageRefs(); renderIdeaPageTabs(); renderIdeaBlocks(); setTimeout(function () { openArtifactWorkflow(item.kind,item.index); },80); }
                    else if (item.normal) setTimeout(function () { openArtifactWorkflow(item.kind,item.index); },80);
                    else if (item.kind === 'postit-block') setTimeout(function () { openPostitFullEditor(item.postitId); setTimeout(function () { openArtifactWorkflow('postit-block',item.index,item.postitId); },80); },80);
                    else setTimeout(function () { openArtifactWorkflow('postit',0,item.postitId); },80);
                } else {
                    switchRoom(item.roomId);
                    if (item.isIdea && item.pageId) switchIdeaPage(item.pageId);
                    else if (item.pageId) switchRoomPage(item.pageId);
                    setTimeout(function () { openTaskDetail(item.blockIndex,item.rowIndex,item.isIdea); },80);
                }
            }
            renderMyTasks = function () {
                var c=currentLang==='en'?{filter:'View current work',active:'To do',review:'Waiting for feedback',revision:'In revision',due:'Due soon/overdue',current:'Current work',results:'Filtered results',unit:'tasks',empty:'No tasks in this list',other:'Try another filter',clear:'Everything is done. Great work!',completed:'Completed work',history:'Kept as history and can be reopened anytime',noneApproved:'No approved work yet',doing:'In progress',overview:'Tasks leave the main list when changed to “Approved”',open:'Open details',untitled:'Untitled task'}:{filter:'ดูงานที่กำลังทำ',active:'ต้องทำ',review:'รอความเห็น',revision:'กำลังแก้ไข',due:'ใกล้/เลยกำหนด',current:'งานที่ต้องทำตอนนี้',results:'ผลลัพธ์ที่กรอง',unit:'งาน',empty:'ไม่มีงานในรายการนี้',other:'ลองเลือกตัวกรองอื่น',clear:'งานที่ต้องทำเสร็จหมดแล้ว เยี่ยมมาก!',completed:'งานที่เสร็จแล้ว',history:'เก็บเป็นประวัติ เปิดกลับมาแก้ต่อได้เสมอ',noneApproved:'ยังไม่มีงานที่อนุมัติแล้ว',doing:'กำลังทำ',overview:'งานจะหายจากรายการหลักเมื่อเปลี่ยนเป็น “อนุมัติแล้ว”',open:'เปิดรายละเอียด',untitled:'งานไม่มีชื่อ'};
                var email = getCurrentAccount().email;
                var assigned = allCloseoutTasks().filter(function (item) { return item.row.assignees.includes(email); });
                var active = assigned.filter(function (item) { return item.row.status !== 'approved'; });
                var completed = assigned.filter(function (item) { return item.row.status === 'approved'; });
                var counts = { active:active.length, review:active.filter(function(i){return i.row.status==='review';}).length, revision:active.filter(function(i){return i.row.status==='revision';}).length, due:active.filter(function(i){return closeoutDateState(i.row.dueDate);}).length };
                var visible = active;
                if (myTasksFilter === 'review' || myTasksFilter === 'revision') visible = active.filter(function (item) { return item.row.status === myTasksFilter; });
                if (myTasksFilter === 'due') visible = active.filter(function (item) { return closeoutDateState(item.row.dueDate); });
                myTaskArtifactItems = visible.concat(showCompletedTasks ? completed : []);
                document.getElementById('myTasksFilters').innerHTML = '<div class="my-tasks-filter-label">'+c.filter+'</div><div class="my-tasks-filter-row">' + [['active',c.active,counts.active],['review',c.review,counts.review],['revision',c.revision,counts.revision],['due',c.due,counts.due]].map(function (f) { return '<button class="' + (myTasksFilter === f[0] ? 'active' : '') + '" onclick="setMyTasksFilter(\'' + f[0] + '\')"><span>' + f[1] + '</span><b>' + f[2] + '</b></button>'; }).join('') + '</div>';
                function cardHtml(item,index) { var state=closeoutDateState(item.row.dueDate), kind=item.kind || 'task', translatedTitle=workroomSystemText(item.row.title || c.untitled); return '<button class="my-task-card" onclick="openMyTaskItem('+index+')"><span class="my-task-kind '+kind+'">'+(kind==='file'?'▱':kind==='postit'?'▰':kind==='idea'?'✦':'✓')+'</span><span><strong>'+escapeHtml(translatedTitle)+'</strong><small>'+escapeHtml(artifactTypeLabel(kind))+' · '+escapeHtml(workroomRoomName(item.roomId))+'</small></span><span class="task-status-pill '+item.row.status+'">'+closeoutStatusLabel(item.row.status)+'</span>'+(item.row.dueDate?'<time class="task-due '+state+'">'+escapeHtml(item.row.dueDate)+'</time>':'')+'<span class="my-task-open">'+c.open+' →</span></button>'; }
                var activeHtml = visible.length ? '<div class="my-tasks-section-head"><strong>'+(myTasksFilter==='active'?c.current:c.results)+'</strong><span>'+visible.length+' '+c.unit+'</span></div>' + visible.map(function(item,index){return cardHtml(item,index);}).join('') : '<div class="my-tasks-empty"><span>✓</span><strong>'+c.empty+'</strong><p>'+(active.length?c.other:c.clear)+'</p></div>';
                var completedStart = visible.length;
                var completedHtml = '<section class="completed-tasks-section"><button class="completed-tasks-toggle" onclick="showCompletedTasks=!showCompletedTasks;renderMyTasks()" aria-expanded="'+String(showCompletedTasks)+'"><span><b>✓</b><span><strong>'+c.completed+'</strong><small>'+c.history+'</small></span></span><em>'+completed.length+'</em><i>'+ (showCompletedTasks?'⌃':'⌄') +'</i></button>' + (showCompletedTasks ? '<div class="completed-tasks-list">'+(completed.length?completed.map(function(item,index){return cardHtml(item,completedStart+index);}).join(''):'<div class="task-empty-copy compact">'+c.noneApproved+'</div>')+'</div>' : '') + '</section>';
                document.getElementById('myTasksList').innerHTML = '<div class="my-tasks-overview"><div><span>'+c.doing+'</span><strong>'+active.length+'</strong></div><div><span>'+c.due+'</span><strong class="'+(counts.due?'attention':'')+'">'+counts.due+'</strong></div><p>'+c.overview+'</p></div>'+activeHtml+completedHtml;
            };

            // ===== Task detail v2: one decision first, details on demand =====
            var activeWorkflowTab = 'comments';
            function setWorkflowTab(tab) { activeWorkflowTab = tab; renderTaskDetail(); }
            function chooseWorkflowStatus(status) {
                var role = activeWorkspace ? activeWorkspace.role : 'owner';
                if (role === 'viewer') return showToast('Viewer แสดงความคิดเห็นได้ แต่เปลี่ยนสถานะไม่ได้');
                updateTaskStatus(status);
            }
            function workflowAssigneePreview(row) {
                if (!row.assignees.length) return '<span class="workflow-nobody">'+(currentLang==='en'?'No assignees yet':'ยังไม่มีผู้รับผิดชอบ')+'</span>';
                return '<span class="workflow-avatar-stack">' + row.assignees.slice(0,4).map(function (email) { var member=closeoutMembers().find(function(m){return normalizeEmail(m.email)===email;}); return '<i class="task-avatar" title="'+escapeHtml((member&&(member.name||member.email))||email)+'">'+escapeHtml(closeoutInitial(member||{email:email}))+'</i>'; }).join('') + '</span><span>'+row.assignees.length+' '+(currentLang==='en'?'people':'คน')+'</span>';
            }
            renderTaskDetail = function () {
                if (!activeTaskDetail) return;
                var row=normalizeCloseoutTask(activeTaskDetail.row), role=activeWorkspace?activeWorkspace.role:'owner', canEdit=role==='owner'||role==='editor', kind=activeTaskDetail.artifactKind||'task';
                var t=currentLang==='en'?{untitled:'Untitled',status:'Task status',choose:'Choose the current step',review:'Waiting for feedback',reviewSub:'Send for team review',revision:'In revision',revisionSub:'Work in progress',approved:'Approved',approvedSub:'Work completed',due:'Due date',assignees:'Assignees',noMembers:'No members yet',noLinks:'No related links yet',deleteLink:'Delete link',noActivity:'No activity yet',comments:'Comments',details:'Details',activity:'Activity',talk:'Discuss this task',talkHelp:'Reply in threads and use @name to notify members',issues:'threads',commentPlaceholder:'Write a comment or @mention a member...',sendComment:'Send comment',assigneeTitle:'Assignees',assigneeHelp:'Choose who should follow and complete this task',links:'Related links',linksHelp:'Keep files, documents and other work together',linkName:'Link name',addLink:'Add link',history:'Activity history',historyHelp:'See who changed what and when'}:{untitled:'ไม่มีชื่อ',status:'สถานะงาน',choose:'เลือกขั้นตอนปัจจุบัน',review:'รอความเห็น',reviewSub:'ส่งให้ทีมตรวจ',revision:'กำลังแก้ไข',revisionSub:'กำลังลงมือแก้',approved:'อนุมัติแล้ว',approvedSub:'ปิดงานเรียบร้อย',due:'กำหนดส่ง',assignees:'ผู้รับผิดชอบ',noMembers:'ยังไม่มีสมาชิก',noLinks:'ยังไม่มีลิงก์ที่เกี่ยวข้อง',deleteLink:'ลบลิงก์',noActivity:'ยังไม่มีกิจกรรม',comments:'ความคิดเห็น',details:'รายละเอียด',activity:'กิจกรรม',talk:'พูดคุยเกี่ยวกับงานนี้',talkHelp:'ตอบกลับเป็น thread และใช้ @ชื่อ เพื่อแจ้งเตือนสมาชิก',issues:'ประเด็น',commentPlaceholder:'เขียนความคิดเห็น หรือ @ชื่อ สมาชิก...',sendComment:'ส่งความคิดเห็น',assigneeTitle:'ผู้รับผิดชอบ',assigneeHelp:'เลือกคนที่ต้องติดตามและดำเนินงานนี้',links:'ลิงก์ที่เกี่ยวข้อง',linksHelp:'เชื่อมไฟล์ เอกสาร หรืองานอื่นไว้ด้วยกัน',linkName:'ชื่อลิงก์',addLink:'เพิ่มลิงก์',history:'ประวัติการทำงาน',historyHelp:'ดูว่าใครเปลี่ยนแปลงอะไรและเมื่อไร'};
                row.links=Array.isArray(row.links)?row.links:[]; row.activity=Array.isArray(row.activity)?row.activity:[];
                document.getElementById('taskDetailTitle').textContent=workroomSystemText(row.title)||(artifactTypeLabel(kind)+' · '+t.untitled);
                var kicker=document.querySelector('#taskDetailModal .task-detail-kicker'); if(kicker) kicker.textContent=artifactTypeLabel(kind).toUpperCase()+' · WORKFLOW';
                var statuses=[['review','1',t.review,t.reviewSub],['revision','2',t.revision,t.revisionSub],['approved','3',t.approved,t.approvedSub]];
                var statusHtml=statuses.map(function(s){return '<button class="workflow-step '+s[0]+(row.status===s[0]?' active':'')+'" onclick="chooseWorkflowStatus(\''+s[0]+'\')" '+(canEdit?'':'disabled')+'><b>'+s[1]+'</b><span><strong>'+s[2]+'</strong><small>'+s[3]+'</small></span></button>';}).join('<span class="workflow-step-line"></span>');
                var members=closeoutMembers();
                var assignees=members.map(function(m){var email=normalizeEmail(m.email),checked=row.assignees.includes(email);return '<label class="task-assignee-option"><input type="checkbox" value="'+escapeHtml(email)+'" '+(checked?'checked':'')+(canEdit?'':' disabled')+' onchange="updateTaskAssignees()"><span class="task-avatar">'+escapeHtml(closeoutInitial(m))+'</span><span><b>'+escapeHtml(m.name||m.email)+'</b><small>'+escapeHtml(m.role||'member')+'</small></span></label>';}).join('')||'<p class="task-empty-copy">'+t.noMembers+'</p>';
                var links=row.links.map(function(link,i){return '<div class="workflow-link"><span>↗</span><a href="'+escapeHtml(link.url)+'" target="_blank" rel="noopener">'+escapeHtml(link.label||link.url)+'</a>'+(canEdit?'<button onclick="removeWorkflowLink('+i+')" aria-label="'+t.deleteLink+'">×</button>':'')+'</div>';}).join('')||'<div class="task-empty-copy compact">'+t.noLinks+'</div>';
                var activity=row.activity.map(function(item){return '<li><span class="activity-dot"></span><div><strong>'+escapeHtml(item.actor)+'</strong> '+escapeHtml(item.action)+'<time>'+new Date(item.createdAt).toLocaleString(currentLang==='en'?'en-US':'th-TH')+'</time></div></li>';}).join('')||'<li><span class="activity-dot"></span><div>'+t.noActivity+'</div></li>';
                var commentsPanel='<section class="workflow-tab-panel"><div class="workflow-panel-heading"><div><h3>'+t.talk+'</h3><p>'+t.talkHelp+'</p></div><span>'+row.comments.filter(function(c){return !c.parentId;}).length+' '+t.issues+'</span></div><div class="task-comments">'+workflowCommentsHtml(row,canEdit)+'</div><div class="task-comment-compose"><textarea id="taskCommentInput" rows="3" placeholder="'+t.commentPlaceholder+'"></textarea><button onclick="addTaskComment()">'+t.sendComment+'</button></div></section>';
                var detailsPanel='<section class="workflow-tab-panel"><div class="workflow-panel-heading"><div><h3>'+t.assigneeTitle+'</h3><p>'+t.assigneeHelp+'</p></div></div><div class="task-assignee-list">'+assignees+'</div><div class="workflow-detail-divider"></div><div class="workflow-panel-heading"><div><h3>'+t.links+'</h3><p>'+t.linksHelp+'</p></div></div><div class="workflow-links">'+links+'</div>'+(canEdit?'<div class="workflow-link-compose"><input id="workflowLinkLabel" placeholder="'+t.linkName+'"><input id="workflowLinkUrl" type="url" placeholder="https://..."><button onclick="addWorkflowLink()">'+t.addLink+'</button></div>':'')+'</section>';
                var activityPanel='<section class="workflow-tab-panel"><div class="workflow-panel-heading"><div><h3>'+t.history+'</h3><p>'+t.historyHelp+'</p></div></div><ol class="workflow-activity">'+activity+'</ol></section>';
                var panel=activeWorkflowTab==='details'?detailsPanel:activeWorkflowTab==='activity'?activityPanel:commentsPanel;
                document.getElementById('taskDetailBody').innerHTML='<section class="workflow-decision"><div class="workflow-decision-title"><span>'+t.status+'</span><small>'+t.choose+'</small></div><div class="workflow-steps">'+statusHtml+'</div></section><section class="workflow-quick-meta"><label><span>'+t.due+'</span><input id="taskDetailDue" type="date" value="'+escapeHtml(row.dueDate)+'" '+(canEdit?'':'disabled')+' onchange="updateTaskDue(this.value)"></label><button onclick="setWorkflowTab(\'details\')"><span>'+t.assignees+'</span><b>'+workflowAssigneePreview(row)+'</b></button></section><nav class="workflow-tabs" role="tablist"><button role="tab" aria-selected="'+String(activeWorkflowTab==='comments')+'" class="'+(activeWorkflowTab==='comments'?'active':'')+'" onclick="setWorkflowTab(\'comments\')">'+t.comments+' <b>'+row.comments.filter(function(c){return !c.parentId;}).length+'</b></button><button role="tab" aria-selected="'+String(activeWorkflowTab==='details')+'" class="'+(activeWorkflowTab==='details'?'active':'')+'" onclick="setWorkflowTab(\'details\')">'+t.details+'</button><button role="tab" aria-selected="'+String(activeWorkflowTab==='activity')+'" class="'+(activeWorkflowTab==='activity'?'active':'')+'" onclick="setWorkflowTab(\'activity\')">'+t.activity+'</button></nav>'+panel;
            };
            var openTaskDetailV2Base=openTaskDetail;
            openTaskDetail=function(blockIndex,rowIndex,isIdea){activeWorkflowTab='comments';activeReplyCommentId=null;openTaskDetailV2Base(blockIndex,rowIndex,isIdea);};
            var openArtifactWorkflowV2Base=openArtifactWorkflow;
            openArtifactWorkflow=function(kind,index,id){activeWorkflowTab='comments';activeReplyCommentId=null;openArtifactWorkflowV2Base(kind,index,id);};

            // ===== Editable post-its =====
            var activePostitEditorId = null;
            var activePostitEditorRoomId = null;
            var postitEditMode = false;
            function getActivePostitEditorItem() {
                var page=roomPages[activePostitEditorRoomId||currentRoomId];
                return page&&Array.isArray(page.postIts)?page.postIts.find(function(post){return post.id===activePostitEditorId;}):null;
            }
            var editablePostitOpenBase=openPostit;
            openPostit=function(id){
                activePostitEditorId=id; activePostitEditorRoomId=currentRoomId; postitEditMode=false;
                editablePostitOpenBase(id);
                var canEdit=!activeWorkspace||activeWorkspace.role!=='viewer';
                var editButton=document.getElementById('postitReaderEditButton'); if(editButton) editButton.hidden=!canEdit;
                var actions=document.getElementById('postitReaderActions'); if(actions) actions.hidden=true;
                document.querySelector('.postit-reader').classList.remove('editing');
            };
            function editablePostitBlock(block,index){
                var textTypes=['text','h1','h2','h3','bullet','numbered','todo','quote','code'];
                var labels={text:'ข้อความ',h1:'หัวข้อใหญ่',h2:'หัวข้อรอง',h3:'หัวข้อย่อย',bullet:'รายการ',numbered:'รายการลำดับ',todo:'สิ่งที่ต้องทำ',quote:'ข้อความอ้างอิง',code:'โค้ด'};
                if(textTypes.includes(block.type)) return '<label class="postit-edit-block"><span>'+escapeHtml(labels[block.type]||'ข้อความ')+'</span><textarea data-postit-block="'+index+'" rows="'+(block.type==='h1'?2:3)+'">'+escapeHtml(blockToPlainText(block))+'</textarea></label>';
                if(block.type==='image'){var source=safeImageSource(block.url||block.content);return '<div class="postit-edit-preserved"><span>รูปภาพ</span>'+(source?'<img src="'+escapeHtml(source)+'" alt="รูปภาพในโปสต์อิท">':'')+'<small>รูปภาพจะถูกเก็บไว้เหมือนเดิม</small></div>';}
                if(block.type==='table') return '<div class="postit-edit-preserved"><span>แผนงาน</span><p>'+escapeHtml(blockToPlainText(block)||'ตารางติดตามงาน')+'</p><small>เปิดแก้ไขรายละเอียดจากปุ่มสถานะหลังบันทึก</small></div>';
                if(block.type==='embed') return '<label class="postit-edit-block"><span>ลิงก์</span><input data-postit-link="'+index+'" type="url" value="'+escapeHtml(block.url||block.content||'')+'" placeholder="https://..."></label>';
                return '<div class="postit-edit-preserved"><span>องค์ประกอบ</span><small>เก็บองค์ประกอบนี้ไว้เหมือนเดิม</small></div>';
            }
            function startPostitEdit(){
                var item=getActivePostitEditorItem(); if(!item||activeWorkspace&&activeWorkspace.role==='viewer') return;
                postitEditMode=true; var reader=document.querySelector('.postit-reader'); reader.classList.add('editing');
                document.getElementById('postitReaderEditButton').hidden=true;
                document.getElementById('postitReaderActions').hidden=false;
                document.getElementById('postitReaderTitle').innerHTML='<label class="postit-edit-title-label">ชื่อโปสต์อิท<input id="postitEditTitle" maxlength="100" value="'+escapeHtml(item.title||'')+'"></label>';
                document.getElementById('postitReaderBody').innerHTML='<div class="postit-edit-help"><b>แก้ไขโปสต์อิท</b><span>เปลี่ยนข้อความได้โดยไม่กระทบสถานะ ความคิดเห็น หรือผู้รับผิดชอบ</span></div><div class="postit-edit-blocks">'+(item.blocks||[]).map(editablePostitBlock).join('')+'</div>';
                setTimeout(function(){var input=document.getElementById('postitEditTitle');if(input){input.focus();input.select();}},50);
            }
            function savePostitEdit(){
                var item=getActivePostitEditorItem(); if(!item||!postitEditMode) return;
                var title=document.getElementById('postitEditTitle').value.trim(); if(!title) return showToast('กรุณาใส่ชื่อโปสต์อิท');
                item.title=title.substring(0,100);
                document.querySelectorAll('[data-postit-block]').forEach(function(field){var index=Number(field.dataset.postitBlock),block=item.blocks[index];if(block) block.content=field.value;});
                document.querySelectorAll('[data-postit-link]').forEach(function(field){var index=Number(field.dataset.postitLink),block=item.blocks[index];if(block){block.url=field.value.trim();block.content=field.value.trim();}});
                item.savedAt=Date.now(); if(item.workflow){item.workflow.title=item.title;addWorkflowActivity(item.workflow,'แก้ไขเนื้อหาโปสต์อิท');}
                saveActiveWorkspaceData(); postitEditMode=false; renderPostitLibrary(); openPostit(item.id); showToast('บันทึกโปสต์อิทแล้ว');
            }
            function cancelPostitEdit(){var item=getActivePostitEditorItem();postitEditMode=false;if(item)openPostit(item.id);else closePostitReader();}
            function closePostitReader(){postitEditMode=false;activePostitEditorId=null;activePostitEditorRoomId=null;closeModal('postitReaderModal');}
            function editPostitFromCard(event,id){if(event){event.preventDefault();event.stopPropagation();}openPostit(id);setTimeout(startPostitEdit,30);}
            var editablePostitRenderBase=renderPostitLibrary;
            renderPostitLibrary=function(){
                editablePostitRenderBase(); var page=roomPages[currentRoomId],canEdit=!activeWorkspace||activeWorkspace.role!=='viewer'; if(!page||!canEdit)return;
                var items=Array.isArray(page.postIts)?page.postIts.slice().sort(function(a,b){return Number(Boolean(b.pinned))-Number(Boolean(a.pinned))||(b.savedAt||0)-(a.savedAt||0);}):[];
                document.querySelectorAll('#postitGrid .postit-card').forEach(function(card,index){var item=items[index];if(!item)return;var button=card.querySelector('.postit-card-edit');if(!button){button=document.createElement('button');button.type='button';button.className='postit-card-edit';card.appendChild(button);}button.title=postitUi('editPostit');button.setAttribute('aria-label',postitUi('editPostit')+' '+(item.title||''));button.innerHTML='<span>✎</span> '+postitUi('edit');button.onclick=function(event){editPostitFromCard(event,item.id);};});
            };

            // ===== Full-page post-it editor =====
            var postitAutosaveTimer = null;
            function postitUi(key){
                var copy={th:{back:'โปสต์อิททั้งหมด',saved:'บันทึกแล้ว',saving:'กำลังบันทึก...',overview:'สถานะและความคิดเห็น',helpTitle:'แบ่งงานจากไอเดียนี้ได้เลย',helpText:'ชี้ที่หัวข้อหรือข้อความ แล้วกด “มอบหมาย” เพื่อเลือกทีม สถานะ และวันส่ง',add:'＋ เพิ่มข้อความ',assign:'มอบหมาย',edit:'แก้ไข',editPostit:'แก้ไขโปสต์อิท',saveEdit:'บันทึกการแก้ไข',delete:'ลบกรอบเขียน',deleteText:'ลบข้อความนี้?',deleteWork:'ลบข้อความและข้อมูลงานนี้?',cancel:'ยกเลิก',remove:'ลบ',empty:'เริ่มเขียนอะไรสักอย่าง...'},en:{back:'All post-its',saved:'Saved',saving:'Saving...',overview:'Status & comments',helpTitle:'Turn this idea into team tasks',helpText:'Hover a heading or paragraph, then choose “Assign” to select people, status and due date.',add:'＋ Add text',assign:'Assign',edit:'Edit',editPostit:'Edit post-it',saveEdit:'Save changes',delete:'Delete text block',deleteText:'Delete this text?',deleteWork:'Delete this text and its task data?',cancel:'Cancel',remove:'Delete',empty:'Start writing...'}};return copy[currentLang==='en'?'en':'th'][key];
            }
            function refreshPostitFullEditorLanguage(){
                var back=document.querySelector('#postitFullEditor .postit-back-button span'),workflow=document.querySelector('#postitFullEditor .postit-full-workflow'),helpTitle=document.querySelector('#postitFullEditor .postit-inline-help b'),helpText=document.querySelector('#postitFullEditor .postit-inline-help small'),add=document.getElementById('postitAddParagraph'),state=document.getElementById('postitAutosaveState');
                if(back)back.textContent=postitUi('back');if(workflow)workflow.textContent=postitUi('overview');if(helpTitle)helpTitle.textContent=postitUi('helpTitle');if(helpText)helpText.textContent=postitUi('helpText');if(add)add.textContent=postitUi('add');if(state&&!state.classList.contains('saving'))state.innerHTML='<span></span>'+postitUi('saved');
                var item=getActivePostitEditorItem();if(item)renderPostitFullBlocks(item);
            }
            function postitBlockAssignmentButton(block,index,readonly){
                var wf=block.workflow,button=document.createElement('button');button.type='button';button.className='postit-block-assignment'+(wf?' assigned '+closeoutStatus(wf.status):'');
                if(wf){
                    ensureArtifactWorkflow(block,'postit-block',getActivePostitEditorItem());
                    var people=wf.assignees.slice(0,3).map(function(email){var member=closeoutMembers().find(function(item){return normalizeEmail(item.email)===normalizeEmail(email);});return '<i title="'+escapeHtml(member?(member.name||member.email):email)+'">'+escapeHtml(closeoutInitial(member||{name:email}))+'</i>';}).join('');
                    button.innerHTML='<span class="postit-assignee-avatars">'+people+'</span><b>'+closeoutStatusLabel(wf.status)+'</b>';
                    button.setAttribute('aria-label','เปิดผู้รับผิดชอบและสถานะของข้อความนี้');
                }else{button.innerHTML='<span>＋</span><b>'+postitUi('assign')+'</b>';button.setAttribute('aria-label',postitUi('assign'));}
                button.disabled=readonly;button.onclick=function(event){event.preventDefault();event.stopPropagation();openPostitBlockWorkflow(index);};return button;
            }
            function postitBlockDeleteButton(index,readonly){
                var button=document.createElement('button');button.type='button';button.className='postit-block-delete';button.innerHTML='×';button.title=postitUi('delete');button.setAttribute('aria-label',postitUi('delete'));button.disabled=readonly;
                button.onclick=function(event){event.preventDefault();event.stopPropagation();removePostitBlock(index);};return button;
            }
            function finishPostitFullBlock(wrapper,block,index,readonly){wrapper.appendChild(postitBlockAssignmentButton(block,index,readonly));if(!readonly)wrapper.appendChild(postitBlockDeleteButton(index,readonly));return wrapper;}
            function postitFullBlockElement(block,index,readonly){
                var wrapper=document.createElement('div'); wrapper.className='postit-full-block postit-full-block-'+block.type; wrapper.dataset.index=index; wrapper.tabIndex=0;
                if(block.type==='image'){
                    var source=safeImageSource(block.url||block.content); wrapper.innerHTML=source?'<img src="'+escapeHtml(source)+'" alt="รูปภาพในโปสต์อิท">':'<div class="postit-full-placeholder">ไม่พบรูปภาพ</div>'; return finishPostitFullBlock(wrapper,block,index,readonly);
                }
                if(block.type==='divider'){wrapper.innerHTML='<hr>';return finishPostitFullBlock(wrapper,block,index,readonly);}
                if(block.type==='table'){wrapper.innerHTML='<div class="postit-full-embedded"><b>✓ แผนงาน</b><p>'+escapeHtml(blockToPlainText(block)||'ตารางติดตามงาน')+'</p><button type="button">เปิดสถานะและความคิดเห็น →</button></div>';wrapper.querySelector('button').onclick=function(){openCurrentPostitWorkflow();};return finishPostitFullBlock(wrapper,block,index,readonly);}
                if(block.type==='embed'){var raw=String(block.url||block.content||'').trim();var href=/^https?:\/\//i.test(raw)?raw:'https://'+raw;wrapper.innerHTML='<div class="postit-full-link"><span>↗</span><a href="'+escapeHtml(href)+'" target="_blank" rel="noopener">'+escapeHtml(raw||'ลิงก์')+'</a></div>';return finishPostitFullBlock(wrapper,block,index,readonly);}
                var content=document.createElement('div'); content.className='postit-full-content'; content.contentEditable=readonly?'false':'true'; content.dataset.placeholder=block.type==='h1'?(currentLang==='en'?'Heading':'หัวข้อใหญ่'):block.type==='h2'?(currentLang==='en'?'Subheading':'หัวข้อรอง'):block.type==='bullet'?(currentLang==='en'?'List item':'รายการ'):block.type==='todo'?(currentLang==='en'?'To do':'สิ่งที่ต้องทำ'):postitUi('empty'); content.innerHTML=sanitizeEditorHtml(workroomSystemText(block.content||''));
                if(block.type==='todo'){var check=document.createElement('button');check.type='button';check.className='postit-full-check'+(block.checked?' checked':'');check.textContent=block.checked?'✓':'';check.disabled=readonly;check.onclick=function(){block.checked=!block.checked;check.classList.toggle('checked',block.checked);check.textContent=block.checked?'✓':'';markPostitAutosave();};wrapper.appendChild(check);}
                content.addEventListener('input',function(){block.content=content.querySelector('.mention-chip')?sanitizeEditorHtml(content.innerHTML):content.innerText;var postit=getActivePostitEditorItem();if(block.type==='h1'||block.type==='h2'){var syncedTitle=syncPostitTitleFromHeading(postit),titleInput=document.getElementById('postitFullTitle');if(titleInput&&syncedTitle)titleInput.value=syncedTitle;}if(block.workflow)block.workflow.title=postitBlockTaskTitle(block,postit);markPostitAutosave();}); wrapper.appendChild(content); return finishPostitFullBlock(wrapper,block,index,readonly);
            }
            function renderPostitFullBlocks(item){
                var container=document.getElementById('postitFullBlocks'),readonly=!!(activeWorkspace&&activeWorkspace.role==='viewer'); container.innerHTML='';
                (item.blocks||[]).forEach(function(block,index){container.appendChild(postitFullBlockElement(block,index,readonly));});
                document.getElementById('postitAddParagraph').hidden=readonly;
            }
            function openPostitFullEditor(id){
                var page=roomPages[currentRoomId],item=page&&Array.isArray(page.postIts)?page.postIts.find(function(post){return post.id===id;}):null;if(!item)return showToast('ไม่พบกระดาษโปสต์อิท');
                syncPostitTitleFromHeading(item);
                activePostitEditorId=id;activePostitEditorRoomId=currentRoomId;postitEditMode=false;
                document.getElementById('postitLibrary').style.display='none';document.getElementById('normalEditor').style.display='none';document.getElementById('ideaEditor').style.display='none';
                var editor=document.getElementById('postitFullEditor');editor.style.display='block';editor.dataset.color=item.color||'yellow';
                var title=document.getElementById('postitFullTitle');title.value=workroomSystemText(item.title||'');title.readOnly=!!(activeWorkspace&&activeWorkspace.role==='viewer');title.oninput=function(){item.title=title.value.substring(0,100);if(item.workflow)item.workflow.title=item.title;(item.blocks||[]).forEach(function(block){if(block.workflow)block.workflow.title=postitBlockTaskTitle(block,item);});markPostitAutosave();};
                refreshPostitFullEditorLanguage();var state=document.getElementById('postitAutosaveState');state.classList.remove('saving');state.innerHTML='<span></span>'+postitUi('saved');editor.scrollTop=0;setTimeout(function(){if(!title.readOnly)title.focus();},60);
            }
            function markPostitAutosave(){
                var item=getActivePostitEditorItem();if(!item)return;item.savedAt=Date.now();var state=document.getElementById('postitAutosaveState');state.classList.add('saving');state.innerHTML='<span></span>'+postitUi('saving');scheduleWorkspaceSave();clearTimeout(postitAutosaveTimer);postitAutosaveTimer=setTimeout(function(){saveActiveWorkspaceData();state.classList.remove('saving');state.innerHTML='<span></span>'+postitUi('saved');},750);
            }
            function addPostitParagraph(){var item=getActivePostitEditorItem();if(!item||activeWorkspace&&activeWorkspace.role==='viewer')return;item.blocks=item.blocks||[];item.blocks.push({type:'text',content:''});renderPostitFullBlocks(item);markPostitAutosave();setTimeout(function(){var nodes=document.querySelectorAll('#postitFullBlocks .postit-full-content');var last=nodes[nodes.length-1];if(last)last.focus();},30);}
            function removePostitBlock(index){
                var item=getActivePostitEditorItem(),block=item&&(item.blocks||[])[index];if(!block||activeWorkspace&&activeWorkspace.role==='viewer')return;
                var hasContent=String(block.content||block.url||'').replace(/<[^>]*>/g,'').trim(),hasWork=block.workflow&&((block.workflow.assignees||[]).length||(block.workflow.comments||[]).length||block.workflow.dueDate);
                if(hasContent||hasWork)return showPostitDeleteConfirmation(index,!!hasWork);
                confirmRemovePostitBlock(index);
            }
            function showPostitDeleteConfirmation(index,hasWork){
                document.querySelectorAll('.postit-delete-confirm').forEach(function(panel){panel.remove();});
                var wrapper=document.querySelector('#postitFullBlocks .postit-full-block[data-index="'+index+'"]');if(!wrapper)return;
                var panel=document.createElement('div');panel.className='postit-delete-confirm';panel.innerHTML='<span>'+postitUi(hasWork?'deleteWork':'deleteText')+'</span><button type="button" class="cancel">'+postitUi('cancel')+'</button><button type="button" class="confirm">'+postitUi('remove')+'</button>';
                panel.querySelector('.cancel').onclick=function(event){event.stopPropagation();panel.remove();wrapper.focus();};
                panel.querySelector('.confirm').onclick=function(event){event.stopPropagation();confirmRemovePostitBlock(index);};wrapper.appendChild(panel);panel.querySelector('.cancel').focus();
            }
            function confirmRemovePostitBlock(index){
                var item=getActivePostitEditorItem();if(!item||!(item.blocks||[])[index])return;
                item.blocks.splice(index,1);renderPostitFullBlocks(item);markPostitAutosave();showToast('ลบกรอบเขียนแล้ว');
            }
            function openPostitBlockWorkflow(index){var item=getActivePostitEditorItem();if(!item)return;openArtifactWorkflow('postit-block',index,item.id);}
            function openCurrentPostitWorkflow(){if(activePostitEditorId)openArtifactWorkflow('postit',0,activePostitEditorId);}
            function closePostitFullEditor(){clearTimeout(postitAutosaveTimer);if(activePostitEditorId)saveActiveWorkspaceData();activePostitEditorId=null;activePostitEditorRoomId=null;renderEditor();}
            openPostit=function(id){openPostitFullEditor(id);};
            editPostitFromCard=function(event,id){if(event){event.preventDefault();event.stopPropagation();}openPostitFullEditor(id);};

