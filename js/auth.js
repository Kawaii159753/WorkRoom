// ============================================================
        //  SOCIAL LOGIN: GOOGLE + FACEBOOK (OAuth จริง)
        // ============================================================
        //  ✏️ ขั้นตอนก่อนใช้งานจริง (แก้ไฟล์นี้ 2 จุด):
        //
        //  1) GOOGLE — https://console.cloud.google.com/apis/credentials
        //     • สร้าง OAuth Client ID (ชนิด Web application)
        //     • ในช่อง "Authorized JavaScript origins" ใส่ที่อยู่เว็บ เช่น
        //       http://localhost:5500 (ทดสอบ) หรือ https://yourdomain.com (จริง)
        //     • คัดลอก Client ID มาใส่ในตัวแปร GOOGLE_CLIENT_ID ด้านล่าง
        //
        //  2) FACEBOOK — https://developers.facebook.com/apps
        //     • สร้าง App แล้วเปิด product "Facebook Login"
        //     • ตั้งค่า "Valid OAuth Redirect URIs" = ที่อยู่เว็บของคุณ
        //     • คัดลอก App ID มาใส่ในตัวแปร FACEBOOK_APP_ID ด้านล่าง
        // ============================================================

        const GOOGLE_CLIENT_ID = ''; // TODO: ใส่ Google Client ID เช่น '1234567890-abc.apps.googleusercontent.com'
        const FACEBOOK_APP_ID = ''; // TODO: ใส่ Facebook App ID เช่น '1234567890123456'
        let fbInitialized = false; // กัน FB.init ซ้ำ
        let googlePromptTimer = null;

        function socialToast(msg) {
            // ใช้ showToast เดิมของแอพถ้ามี (เป็น global function)
            if (typeof showToast === 'function') return showToast(msg);
            var t = document.getElementById('toast');
            if (!t) return;
            t.textContent = msg;
            t.classList.add('show');
            setTimeout(function () { t.classList.remove('show'); }, 3000);
        }

        function loadSocialScript(src, id) {
            return new Promise(function (resolve, reject) {
                if (document.getElementById(id)) return resolve();
                var s = document.createElement('script');
                s.id = id;
                s.src = src;
                s.async = true;
                s.onload = resolve;
                s.onerror = function () { reject(new Error('โหลด SDK ล้มเหลว')); };
                document.head.appendChild(s);
            });
        }

        function setSocialLoading(btn, loading) {
            if (!btn) return;
            if (loading) {
                btn.dataset.original = btn.innerHTML;
                btn.disabled = true;
                btn.classList.add('loading');
                btn.innerHTML = '<span class="sbtn-spinner"></span><span class="sbtn-label">กำลังเชื่อมต่อ...</span>';
            } else {
                btn.disabled = false;
                btn.classList.remove('loading');
                if (btn.dataset.original) btn.innerHTML = btn.dataset.original;
            }
        }

        let currentUser = null; // เก็บข้อมูลผู้ใช้ปัจจุบัน (เผื่อ feature อื่นในอนาคต เช่น logout)
        let loginDestination = 'app'; // 'app' = ล็อกอินแล้วเข้าแอป, 'landing' = ล็อกอินแล้วกลับหน้าแรก

        // โหลดผู้ใช้ที่ล็อกอินค้างไว้จาก localStorage (ไม่ต้องล็อกอินซ้ำ)
        function getSavedUser() {
            try {
                var raw = localStorage.getItem('workroomUser');
                if (!raw) return null;
                var u = JSON.parse(raw);
                return (u && typeof u === 'object' && (u.name || u.email)) ? u : null;
            } catch (e) {
                return null;
            }
        }

        // อัปเดตปุ่ม "เข้าสู่ระบบ" ในเมนูบน: ล็อกอินแล้ว → "ออกจากระบบ"
        function updateNavLogin() {
            var user = currentUser || getSavedUser();
            var loggedIn = !!user;
            var t = (typeof translations !== 'undefined' && translations[currentLang]) ? translations[currentLang] : {};
            document.querySelectorAll('.nav-login').forEach(function (btn) {
                btn.onclick = null;
                // หยุดแอนิเมชัน i18n ที่ค้างอยู่ ไม่ให้เขียนทับสถานะปุ่มตอนรีเฟรชหน้า
                if (typeof gsap !== 'undefined') {
                    gsap.killTweensOf(btn);
                    gsap.set(btn, { opacity: 1 });
                }
                if (loggedIn) {
                    btn.removeAttribute('data-i18n');
                    btn.textContent = t.logout || 'ออกจากระบบ';
                    btn.onclick = function () { logout(); return false; };
                } else {
                    btn.setAttribute('data-i18n', 'navLogin');
                    btn.textContent = t.navLogin || 'เข้าสู่ระบบ';
                    btn.onclick = function () { showLoginPage(); return false; };
                }
            });
        }

        // ออกจากระบบ
        function logout() {
            currentUser = null;
            try { localStorage.removeItem('workroomUser'); } catch (e) { }
            // ถ้ากำลังอยู่ในหน้าแอป ให้กลับมาหน้าแรก
            var inApp = document.getElementById('mainApp').style.display === 'block';
            if (inApp && typeof showBento === 'function') showBento(true);
            updateNavLogin();
            socialToast('ออกจากระบบแล้ว 👋');
        }

        // ตรวจสอบว่ารูปโปรไฟล์เป็น URL https จริงๆ (กัน CSS/HTML injection)
        function safePicture(url) {
            if (!url || typeof url !== 'string') return null;
            if (/^https?:\/\//i.test(url)) return url;
            if (/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(url)) return url;
            return null;
        }

        function renderUserProfile(user) {
            user = user || {};
            currentUser = user;
            var name = user.name || user.email || 'สมาชิก';
            var initial = (name.trim().charAt(0) || '?').toUpperCase();
            var pic = safePicture(user.picture);

            // ---- การ์ดโปรไฟล์ในแถบข้าง (sidebar) ----
            var card = document.getElementById('userCard');
            if (card) {
                var avatar = document.getElementById('userAvatar');
                var nameEl = document.getElementById('userName');
                var emailEl = document.getElementById('userEmail');
                var badge = document.getElementById('userBadge');

                avatar.innerHTML = '';
                avatar.style.background = '';
                if (pic) {
                    avatar.dataset.initial = initial;
                    avatar.style.background = '#2a2a2a';
                    var img = document.createElement('img');
                    img.src = pic;
                    img.alt = 'avatar';
                    img.onerror = function () {
                        avatar.innerHTML = '';
                        avatar.style.background = '';
                        avatar.textContent = avatar.dataset.initial || '?';
                    };
                    avatar.appendChild(img);
                } else {
                    avatar.textContent = initial;
                }

                if (nameEl) nameEl.textContent = name;
                if (emailEl) emailEl.textContent = user.email || '';
                var providerMap = { google: 'Google', facebook: 'Facebook', email: 'อีเมล' };
                if (badge) {
                    badge.textContent = providerMap[user.provider] || 'บัญชี';
                    badge.className = 'user-provider provider-' + (user.provider || 'email');
                }
                card.style.display = 'flex';
            }

            // ---- อวตารที่หัวแถบด้านบน (header) ----
            var hAvatar = document.getElementById('headerAvatar');
            if (hAvatar) {
                hAvatar.style.backgroundImage = '';
                hAvatar.style.backgroundSize = '';
                hAvatar.style.backgroundPosition = '';
                if (pic) {
                    hAvatar.style.backgroundImage = 'url("' + pic + '")';
                    hAvatar.style.backgroundSize = 'cover';
                    hAvatar.style.backgroundPosition = 'center';
                    hAvatar.textContent = '';
                } else {
                    hAvatar.textContent = initial;
                }
            }

            if (typeof initCollaboration === 'function' && user.email) {
                initCollaboration(user);
            }
        }

        function completeLogin(user) {
            user = user || {};
            currentUser = user;
            // จำผู้ใช้ไว้ เพื่อไม่ต้องล็อกอินซ้ำ
            try {
                localStorage.setItem('workroomUser', JSON.stringify(user));
            } catch (e) { }
            var name = user.name || user.email || 'สมาชิก';
            if (loginDestination === 'landing') {
                // จากปุ่ม "เข้าสู่ระบบ" ในเมนูบน → กลับหน้าแรก แล้วปุ่มเปลี่ยนเป็น "ออกจากระบบ"
                if (typeof showBento === 'function') showBento(true);
                updateNavLogin();
            } else {
                // จากปุ่ม CTA → เข้าใช้งานแอป
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                renderUserProfile(user);
                updateNavLogin();
            }
            socialToast('ยินดีต้อนรับ ' + name + ' 🎉');
        }

        // ---------- GOOGLE (Identity Services) ----------
        function handleGoogleCredential(response) {
            try {
                var base64 = response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                var payload = JSON.parse(decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')));
                setSocialLoading(document.querySelector('.btn-google'), false);
                completeLogin({ name: payload.name, email: payload.email, picture: payload.picture, provider: 'google' });
            } catch (err) {
                socialToast('เข้าสู่ระบบ Google ไม่สำเร็จ');
                setSocialLoading(document.querySelector('.btn-google'), false);
            }
        }

        function loginWithGoogle() {
            if (!GOOGLE_CLIENT_ID) {
                return socialToast('ยังไม่ได้ตั้งค่า GOOGLE_CLIENT_ID (ดูวิธีในโค้ด)');
            }
            var btn = document.querySelector('.btn-google');
            setSocialLoading(btn, true);
            loadSocialScript('https://accounts.google.com/gsi/client', 'gsi-client')
                .then(function () {
                    window.google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: handleGoogleCredential
                    });
                    window.google.accounts.id.prompt(function (notification) {
                        if (notification.isNotDisplayed()) {
                            console.warn('[GIS] ' + notification.getNotDisplayedReason());
                            setSocialLoading(btn, false);
                            socialToast('ไม่สามารถแสดงหน้าล็อกอิน Google ได้ (' + notification.getNotDisplayedReason() + ')');
                        }
                    });
                    // เซฟตี้: เลิก loading อัตโนมัติถ้าผู้ใช้ปิดป็อปอัปโดยไม่เลือก
                    clearTimeout(googlePromptTimer);
                    googlePromptTimer = setTimeout(function () {
                        if (btn.disabled) setSocialLoading(btn, false);
                    }, 45000);
                })
                .catch(function (err) {
                    setSocialLoading(btn, false);
                    socialToast(err && err.message ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
                });
        }

        // ---------- FACEBOOK (JS SDK) ----------
        function loginWithFacebook() {
            if (!FACEBOOK_APP_ID) {
                return socialToast('ยังไม่ได้ตั้งค่า FACEBOOK_APP_ID (ดูวิธีในโค้ด)');
            }
            var btn = document.querySelector('.btn-facebook');
            setSocialLoading(btn, true);
            if (!document.getElementById('fb-root')) {
                var fbRoot = document.createElement('div');
                fbRoot.id = 'fb-root';
                document.body.appendChild(fbRoot);
            }
            loadSocialScript('https://connect.facebook.net/th_TH/sdk.js', 'fb-sdk')
                .then(function () {
                    if (!window.FB || !window.FB.init) throw new Error('โหลด Facebook SDK ล้มเหลว');
                    if (!fbInitialized) {
                        window.FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v22.0' });
                        fbInitialized = true;
                    }
                    window.FB.login(function (response) {
                        if (!response.authResponse) {
                            setSocialLoading(btn, false);
                            socialToast('ยกเลิกการเข้าสู่ระบบ Facebook');
                            return;
                        }
                        window.FB.api('/me', { fields: 'name,email,picture.width(200).height(200)' }, function (user) {
                            setSocialLoading(btn, false);
                            if (!user || user.error) return socialToast('ดึงข้อมูล Facebook ไม่สำเร็จ');
                            completeLogin({
                                name: user.name,
                                email: user.email,
                                picture: user.picture ? user.picture.data.url : null,
                                provider: 'facebook'
                            });
                        });
                    }, { scope: 'email' });
                })
                .catch(function (err) {
                    setSocialLoading(btn, false);
                    socialToast(err && err.message ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
                });
        }

        function socialLogin(provider) {
            if (provider === 'google') loginWithGoogle();
            else if (provider === 'facebook') loginWithFacebook();
        }
