// WorkRoom themes are account preferences for the app surface only.
// Marketing, story, blog, and login pages always keep their original styling.
        function setWorkroomThemeActive(active) {
            if (active && typeof restoreTheme === 'function') {
                restoreTheme();
                return;
            }
            document.body.classList.remove('playful-theme', 'light-theme');
        }

// ===== BLOG PAGE FUNCTIONS =====
        function showBlog(skipHistory = false) {
            setWorkroomThemeActive(false);
            resetLenis();
            if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
            window.scrollTo(0, 0);
            document.getElementById('page-bento').style.display = 'none';
            document.getElementById('page-workroom').style.display = 'none';
            document.getElementById('page-story').style.display = 'none';
            document.getElementById('page-blog').style.display = 'block';
            document.body.style.overflow = '';
            document.body.style.background = '';

            document.querySelectorAll('.nav-links a').forEach(el => {
                if (el.getAttribute('data-i18n') === 'navBlog') {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            });

            var cursorEl = document.getElementById('cursor');
            var cursorDotEl = document.getElementById('cursorDot');
            if (window.innerWidth > 640 && cursorEl && cursorDotEl && window.__customCursorActive) {
                document.body.style.cursor = 'none';
                cursorEl.style.display = 'block';
                cursorDotEl.style.display = 'block';

                document.querySelectorAll('.blog-card, .glow-btn, .lang-toggle, .footer-social').forEach(function (el) {
                    el.addEventListener('mouseenter', function () { cursorEl.classList.add('hover'); });
                    el.addEventListener('mouseleave', function () { cursorEl.classList.remove('hover'); });
                });
            } else if (cursorEl) {
                // เคอร์เซอร์กำหนดเองไม่พร้อมใช้งาน → ใช้เคอร์เซอร์ปกติของระบบเสมอ (กันเคอร์เซอร์หาย)
                document.body.style.cursor = '';
                cursorEl.style.display = 'none';
                cursorDotEl.style.display = 'none';
            }

            if (!skipHistory) {
                history.pushState({ page: 'blog' }, '', '#blog');
            }

            // GSAP animations for blog
            gsap.from('.blog-hero-title', { y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', delay: 0.2 });
            gsap.from('.blog-hero-desc', { y: 40, opacity: 0, duration: 1, delay: 0.4, ease: 'power3.out' });
            gsap.from('.blog-filter', { y: 30, opacity: 0, duration: 0.8, delay: 0.6, ease: 'power3.out' });

            gsap.utils.toArray('.blog-card').forEach((card, i) => {
                gsap.from(card, {
                    y: 50, opacity: 0, scale: 0.95, duration: 0.7, delay: i * 0.06,
                    ease: 'power3.out',
                    scrollTrigger: { trigger: card, start: 'top 92%', toggleActions: 'play none none none' }
                });
            });

            setTimeout(function () {
                if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
            }, 100);
        }

        function filterBlog(category) {
            document.querySelectorAll('.blog-filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === category);
            });
            document.querySelectorAll('.blog-card').forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.classList.remove('hidden');
                    gsap.fromTo(card, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
                } else {
                    card.classList.add('hidden');
                }
            });
        }

        function showStory(skipHistory = false) {
            setWorkroomThemeActive(false);
            resetLenis();
            if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
            window.scrollTo(0, 0);
            document.getElementById('page-bento').style.display = 'none';
            document.getElementById('page-workroom').style.display = 'none';
            document.getElementById('page-blog').style.display = 'none';
            document.getElementById('page-story').style.display = 'block';
            document.body.style.overflow = '';
            document.body.style.background = '';

            document.querySelectorAll('.nav-links a').forEach(el => {
                if (el.getAttribute('data-i18n') === 'navStory') {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            });

            var cursorEl = document.getElementById('cursor');
            var cursorDotEl = document.getElementById('cursorDot');
            if (window.innerWidth > 640 && cursorEl && cursorDotEl && window.__customCursorActive) {
                document.body.style.cursor = 'none';
                cursorEl.style.display = 'block';
                cursorDotEl.style.display = 'block';

                document.querySelectorAll('.team-card, .value-card, .glow-btn, .lang-toggle, .footer-social, .origin-sticky').forEach(function (el) {
                    el.addEventListener('mouseenter', function () { cursorEl.classList.add('hover'); });
                    el.addEventListener('mouseleave', function () { cursorEl.classList.remove('hover'); });
                });
            } else if (cursorEl) {
                // เคอร์เซอร์กำหนดเองไม่พร้อมใช้งาน → ใช้เคอร์เซอร์ปกติของระบบเสมอ (กันเคอร์เซอร์หาย)
                document.body.style.cursor = '';
                cursorEl.style.display = 'none';
                cursorDotEl.style.display = 'none';
            }

            if (!skipHistory) {
                history.pushState({ page: 'story' }, '', '#story');
            }

            setTimeout(function () {
                if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
            }, 100);
        }

        function showWorkroom(skipHistory = false) {
            // Workroom uses its own nested scroll containers. Stop the page-level
            // smooth scroller so it cannot consume mouse-wheel input over them.
            window.__lenisPaused = true;
            if (window.__lenis) window.__lenis.stop();
            if (typeof pauseCustomCursor === 'function') pauseCustomCursor();
            document.getElementById('page-bento').style.display = 'none';
            document.getElementById('page-story').style.display = 'none';
            document.getElementById('page-blog').style.display = 'none';
            document.getElementById('page-workroom').style.display = 'block';
            document.body.style.overflow = 'hidden';
            document.body.style.background = '#d4d8dc';
            document.body.style.cursor = '';

            var cursorEl = document.getElementById('cursor');
            var cursorDotEl = document.getElementById('cursorDot');
            if (cursorEl) cursorEl.style.display = 'none';
            if (cursorDotEl) cursorDotEl.style.display = 'none';

            // ล็อกอินแล้ว → เข้าใช้งานแอปตรงๆ / ยังไม่ล็อกอิน → ขึ้นหน้าล็อกอินก่อน แล้วเข้าแอปต่อหลังล็อกอิน
            var savedUser = currentUser || getSavedUser();
            if (savedUser) {
                setWorkroomThemeActive(true);
                currentUser = savedUser;
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                renderUserProfile(currentUser);
            } else {
                setWorkroomThemeActive(false);
                loginDestination = 'app';
                document.getElementById('loginPage').style.display = 'flex';
                document.getElementById('mainApp').style.display = 'none';
            }

            if (!skipHistory) {
                history.pushState({ page: 'workroom' }, '', '#workroom');
            }

            setTimeout(function () {
                window.dispatchEvent(new Event('resize'));
                if (typeof currentRoomId !== 'undefined' && currentRoomId === 'room-1') {
                    var canvas = document.getElementById('ideaCanvas');
                    var wrap = document.querySelector('.idea-canvas-wrap');
                    if (canvas && wrap) {
                        var rect = wrap.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            canvas.width = rect.width;
                            canvas.height = rect.height;
                            if (typeof renderWhiteboard === 'function') renderWhiteboard();
                        }
                    }
                    if (typeof renderIdeaBlocks === 'function') renderIdeaBlocks();
                }
            }, 80);
        }

        // สำหรับปุ่ม "เข้าสู่ระบบ" ในเมนูบน: ขึ้นหน้าล็อกอินอย่างเดียว (หลังล็อกอินจะกลับหน้าแรก)
        function showLoginPage(skipHistory = false) {
            setWorkroomThemeActive(false);
            window.__lenisPaused = true;
            if (window.__lenis) window.__lenis.stop();
            if (typeof pauseCustomCursor === 'function') pauseCustomCursor();
            document.getElementById('page-bento').style.display = 'none';
            document.getElementById('page-story').style.display = 'none';
            document.getElementById('page-workroom').style.display = 'block';
            document.body.style.overflow = 'hidden';
            document.body.style.background = '#d4d8dc';
            document.body.style.cursor = '';

            var cursorEl = document.getElementById('cursor');
            var cursorDotEl = document.getElementById('cursorDot');
            if (cursorEl) cursorEl.style.display = 'none';
            if (cursorDotEl) cursorDotEl.style.display = 'none';

            loginDestination = 'landing';
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('mainApp').style.display = 'none';

            if (!skipHistory) {
                history.pushState({ page: 'workroom' }, '', '#workroom');
            }

            setTimeout(function () {
                if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
            }, 100);
        }

        function showBento(skipHistory = false) {
            setWorkroomThemeActive(false);
            resetLenis();
            if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
            window.scrollTo(0, 0);
            document.getElementById('page-workroom').style.display = 'none';
            document.getElementById('page-story').style.display = 'none';
            document.getElementById('page-blog').style.display = 'none';
            document.getElementById('page-bento').style.display = 'block';
            document.body.style.overflow = '';
            document.body.style.background = '';
            if (typeof initCursor === 'function') initCursor();

            document.querySelectorAll('.nav-links a').forEach(el => {
                if (el.getAttribute('data-i18n') === 'navStory') {
                    el.classList.remove('active');
                }
            });

            var cursorEl = document.getElementById('cursor');
            var cursorDotEl = document.getElementById('cursorDot');
            if (window.innerWidth > 640 && cursorEl && cursorDotEl && window.__customCursorActive) {
                document.body.style.cursor = 'none';
                cursorEl.style.display = 'block';
                cursorDotEl.style.display = 'block';
            } else if (cursorEl) {
                // เคอร์เซอร์กำหนดเองไม่พร้อมใช้งาน → ใช้เคอร์เซอร์ปกติของระบบเสมอ (กันเคอร์เซอร์หาย)
                document.body.style.cursor = '';
                cursorEl.style.display = 'none';
                cursorDotEl.style.display = 'none';
            }

            if (!skipHistory) {
                if (history.state && history.state.page === 'workroom') {
                    history.back();
                    return;
                } else {
                    history.replaceState({ page: 'bento' }, '', '#');
                }
            } else {
                // ล้าง hash (เช่น #workroom) ออกจาก URL เพื่อไม่ให้รีเฟรชแล้วเด้งกลับเข้าหน้าแอป
                try {
                    history.replaceState({ page: 'bento' }, '', '#');
                } catch (e) { }
            }

            setTimeout(function () {
                if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
            }, 100);
        }

        function downloadApp() {
            // TODO: เปลี่ยนเป็น URL ของไฟล์ดาวน์โหลดจริง (ตัวติดตั้งแอป / Google Play / App Store)
            var link = document.createElement('a');
            link.href = 'index.html';
            link.download = 'WorkRoom';
            document.body.appendChild(link);
            link.click();
            link.remove();
        }

        window.addEventListener('popstate', function (event) {
            if (event.state && event.state.page === 'workroom') {
                showWorkroom(true);
            } else if (event.state && event.state.page === 'story') {
                showStory(true);
            } else if (event.state && event.state.page === 'blog') {
                showBlog(true);
            } else {
                showBento(true);
            }
        });

        // Bind dynamic active class when clicked
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function () {
                const key = this.getAttribute('data-i18n');
                document.querySelectorAll('.nav-links a').forEach(el => {
                    if (el.getAttribute('data-i18n') === key) {
                        el.classList.add('active');
                    } else {
                        el.classList.remove('active');
                    }
                });
            });
        });

        // Scroll to features section on bento page
        function scrollToFeatures(e) {
            e.preventDefault();
            e.stopPropagation();
            var bentoPage = document.getElementById('page-bento');
            var alreadyOnBento = bentoPage && bentoPage.style.display !== 'none';
            var featuresEl = document.getElementById('features');
            if (!featuresEl) return;

            if (!alreadyOnBento) {
                document.getElementById('page-workroom').style.display = 'none';
                document.getElementById('page-story').style.display = 'none';
                document.getElementById('page-blog').style.display = 'none';
                bentoPage.style.display = 'block';
                document.body.style.overflow = '';
                document.body.style.background = '';
                history.replaceState({ page: 'bento' }, '', '#');
            }

            // หยุด Lenis ไม่ให้ control scroll
            window.__lenisPaused = true;
            if (window.__lenis) window.__lenis.stop();
            window.scrollTo(0, 0);

            var waitTime = alreadyOnBento ? 100 : 400;
            setTimeout(function () {
                var targetY = featuresEl.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({ top: targetY, behavior: 'smooth' });
                setTimeout(function () {
                    // กลับมาเปิด Lenis + sync ตำแหน่ง scroll ปัจจุบัน
                    window.__lenisPaused = false;
                    if (window.__lenis) {
                        window.__lenis.scrollTo(window.scrollY, { immediate: true });
                        window.__lenis.start();
                    }
                    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
                }, 1200);
            }, waitTime);
        }

        // Helper: รีเซ็ต Lenis ให้กลับมาทำงานปกติ
        var __scrollToFeaturesTimer = null;
        function resetLenis() {
            if (__scrollToFeaturesTimer) {
                clearTimeout(__scrollToFeaturesTimer);
                __scrollToFeaturesTimer = null;
            }
            window.__lenisPaused = false;
            if (window.__lenis) {
                window.__lenis.start();
            }
        }

        // IntersectionObserver: toggle ฟีเจอร์ active class ตาม viewport
        var featuresSection = document.getElementById('features');
        var featuresNavLink = document.querySelector('[data-i18n="navFeatures"]');
        if (featuresSection && featuresNavLink) {
            var featuresObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        featuresNavLink.classList.add('active');
                    } else {
                        featuresNavLink.classList.remove('active');
                    }
                });
            }, { threshold: 0.3 });
            featuresObserver.observe(featuresSection);
        }

        function initRoute() {
            if (window.location.hash === '#workroom') {
                showWorkroom(true);
            } else if (window.location.hash === '#story') {
                showStory(true);
            } else if (window.location.hash === '#blog') {
                showBlog(true);
            } else {
                showBento(true);
            }

            // อัปเดตปุ่ม "เข้าสู่ระบบ"/"ออกจากระบบ" ในเมนูบนตามสถานะผู้ใช้ที่บันทึกไว้
            updateNavLogin();
        }

        // รอ DOMContentLoaded เพื่อให้ initCursor ตั้งค่าสถานะเคอร์เซอร์เสร็จก่อนค่อยเปิดหน้าแรก
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initRoute);
        } else {
            initRoute();
        }
