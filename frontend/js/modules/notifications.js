/**
 * WorkRoom Notification Center
 */
            // ========== NOTIFICATIONS ==========
            function toggleNotif(e) {
                e.stopPropagation();
                let d = document.getElementById('notifDropdown');
                d.classList.toggle('show');
                var button = document.querySelector('.bell-btn');
                if (button) button.setAttribute('aria-expanded', String(d.classList.contains('show')));
                renderNotif();
                if (d.classList.contains('show')) {
                    notifications.forEach(function (item) { item.read = true; });
                    saveMailbox();
                    updateBellBadge();
                }
            }

            function renderNotif() {
                let list = document.getElementById('notifList');
                var visibleNotifications = notifications.filter(function (item) {
                    return item.type === 'team_invite' || readSetting('settings-notifTag', true);
                });
                if (visibleNotifications.length === 0) { list.innerHTML = '<div class="notif-dropdown-empty">' + escapeHtml(uiText('wrNoNotifications')) + '</div>'; return; }
                list.innerHTML = visibleNotifications.map(function (item) {
                    if (item.type === 'team_invite') {
                        var actions = item.status === 'pending'
                            ? '<div class="invite-actions"><button class="invite-accept" onclick="event.stopPropagation();respondToInvite(\'' + escapeHtml(item.id) + '\',true)">' + escapeHtml(uiText('wrAccept')) + '</button><button class="invite-decline" onclick="event.stopPropagation();respondToInvite(\'' + escapeHtml(item.id) + '\',false)">' + escapeHtml(uiText('wrDecline')) + '</button></div>'
                            : '<div class="invite-notification-meta">' + escapeHtml(item.status === 'accepted' ? uiText('wrAccepted') : uiText('wrDeclined')) + '</div>';
                        return '<div class="invite-notification"><div class="invite-notification-title"><strong>' + escapeHtml(item.fromName)
                            + '</strong> ' + escapeHtml(uiText('wrInviteMessage')) + ' “' + escapeHtml(item.workspaceName) + '”</div><div class="invite-notification-meta">'
                            + escapeHtml(item.time || uiText('wrJustNow')) + ' · ' + escapeHtml(item.role === 'editor' ? uiText('wrEditPermission') : uiText('wrViewPermission')) + '</div>' + actions + '</div>';
                    }
                    if (item.type === 'mention') {
                        return '<div class="invite-notification ' + (item.read ? '' : 'unread') + '">'
                            + '<div class="invite-notification-title"><strong>@' + escapeHtml(item.fromName || uiText('wrMemberFallback'))
                            + '</strong> ' + escapeHtml(uiText('wrMentionedYou')) + ' “' + escapeHtml(item.roomName || uiText('wrWorkroomFallback')) + '”</div>'
                            + '<div class="invite-notification-meta">' + escapeHtml(item.workspaceName || '')
                            + (item.time ? ' · ' + escapeHtml(item.time) : '') + '</div></div>';
                    }
                    return '<div class="notif-dropdown-item ' + (item.read ? '' : 'unread') + '"><div class="notif-dropdown-text">'
                        + escapeHtml(item.text || '') + '</div><div class="notif-dropdown-time">' + escapeHtml(item.time || '') + '</div></div>';
                }).join('');
            }

            function updateBellBadge() {
                let badge = document.getElementById('bellBadge');
                let unread = notifications.filter(function (item) {
                    return !item.read && (item.type === 'team_invite' || readSetting('settings-notifTag', true));
                }).length;
                badge.classList.toggle('show', unread > 0);
            }
            function clearNotif() {
                notifications = notifications.filter(function (item) { return item.type === 'team_invite' && item.status === 'pending'; });
                saveMailbox();
                renderNotif();
                updateBellBadge();
                showToast(notifications.length ? 'เก็บคำเชิญที่ยังรอการตอบรับไว้' : 'ล้างการแจ้งเตือนแล้ว');
            }
