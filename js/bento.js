// ===== LENIS SMOOTH SCROLL =====
            window.__lenis = window.__liteMotion ? null : new Lenis({
                lerp: 0.1,
                smoothWheel: true,
                syncTouch: false,
                wheelMultiplier: 0.9
            });
            var lenis = window.__lenis;
            window.__lenisPaused = false;

            if (lenis) {
                lenis.on('scroll', ScrollTrigger.update);
                gsap.ticker.add((time) => { if (!window.__lenisPaused) lenis.raf(time * 1000); });
                gsap.ticker.lagSmoothing(500, 33);
            }

            // ===== CUSTOM CURSOR =====
            const cursor = document.getElementById('cursor');
            const cursorDot = document.getElementById('cursorDot');
            let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;
            let cursorEnabled = false;
            let cursorInitialized = false;
            let cursorRafId = 0;

            function initCursor() {
                if (window.innerWidth <= 640 || window.__liteMotion || !cursor || !cursorDot) return;
                cursorEnabled = true;
                window.__customCursorActive = true;
                if (!cursorInitialized) {
                    cursorInitialized = true;
                    document.addEventListener('mousemove', (e) => {
                        mouseX = e.clientX;
                        mouseY = e.clientY;
                        cursorDot.style.transform = 'translate3d(' + mouseX + 'px,' + mouseY + 'px,0) translate(-50%,-50%)';
                    }, { passive: true });
                    document.querySelectorAll('.bento-card, .wall-card, .hero-sticky, .glow-btn, .lang-toggle').forEach(el => {
                        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
                        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
                    });
                }

                function animateCursor() {
                    if (!cursorEnabled) { cursorRafId = 0; return; }
                    cursorX += (mouseX - cursorX) * 0.15;
                    cursorY += (mouseY - cursorY) * 0.15;
                    cursor.style.transform = 'translate3d(' + cursorX + 'px,' + cursorY + 'px,0) translate(-50%,-50%)';
                    cursorRafId = requestAnimationFrame(animateCursor);
                }
                if (!cursorRafId) cursorRafId = requestAnimationFrame(animateCursor);
            }

            function pauseCustomCursor() {
                cursorEnabled = false;
                if (cursorRafId) cancelAnimationFrame(cursorRafId);
                cursorRafId = 0;
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initCursor);
            } else {
                initCursor();
            }

            // กันเคอร์เซอร์หาย: ย่อ/ขยายหน้าต่างข้ามขนาดจอเล็ก-ใหญ่ ให้เคอร์เซอร์ยังคงแสดงเสมอ
            window.addEventListener('resize', function () {
                var mobile = window.innerWidth <= 640;
                if (mobile) {
                    pauseCustomCursor();
                    window.__customCursorActive = false;
                    if (cursor) cursor.style.display = 'none';
                    if (cursorDot) cursorDot.style.display = 'none';
                    document.body.style.cursor = '';
                } else if (!cursorEnabled) {
                    initCursor();
                    // ถ้ากลับมาหน้าจอใหญ่แล้วอยู่บนหน้า landing/story/blog ให้ซ่อนเคอร์เซอร์ปกติ
                    var wr = document.getElementById('page-workroom');
                    if (wr && wr.style.display !== 'block') {
                        document.body.style.cursor = 'none';
                    }
                }
            });

            // ===== PARTICLES =====
            const particlesContainer = document.getElementById('particles');
            for (let i = 0; i < (window.__liteMotion ? 8 : 40); i++) {
                const p = document.createElement('div');
                p.className = 'particle';
                p.style.left = Math.random() * 100 + '%';
                p.style.animationDuration = (8 + Math.random() * 12) + 's';
                p.style.animationDelay = (Math.random() * 10) + 's';
                p.style.width = (2 + Math.random() * 3) + 'px';
                p.style.height = p.style.width;
                p.style.opacity = 0.2 + Math.random() * 0.5;
                particlesContainer.appendChild(p);
            }

            // ===== FLOATING NOTES =====
            const noteColors = ['#ffe066', '#ff8fa3', '#74c0fc', '#8ce99a', '#ffa94d', '#d0bfff', '#ffc2cd', '#a5d8ff'];
            const noteTexts = { en: ['Idea!', 'Note', 'Do it', 'Important', 'New', 'Nice', 'Urgent', 'Think', 'Plan', 'Build', 'Try', 'Grow'], th: ['ไอเดีย!', 'โน้ต', 'ทำเลย', 'สำคัญ', 'ใหม่', 'ดี', 'ด่วน', 'คิด', 'วางแผน', 'สร้าง', 'ลอง', 'เติบโต'] };

            const fl = document.getElementById('floatLayer');
            for (let i = 0; i < (window.__liteMotion ? 6 : 24); i++) {
                const d = document.createElement('div');
                d.className = 'bento-note float-note-item';
                d.style.background = noteColors[Math.floor(Math.random() * noteColors.length)];
                d.style.left = (Math.random() * 88) + '%';
                d.style.top = (Math.random() * 88) + '%';
                const s = 55 + Math.random() * 65;
                d.style.width = s + 'px';
                d.style.height = s + 'px';
                d.style.opacity = 0.6 + Math.random() * 0.3;
                d.dataset.noteIndex = i;
                d.textContent = noteTexts[currentLang][i % noteTexts[currentLang].length];
                d.dataset.speed = (0.05 + Math.random() * 0.15).toFixed(3);
                fl.appendChild(d);
            }

            // Update floating notes text when language changes
            const originalSetLang = setLang;
            setLang = function (lang) {
                originalSetLang(lang);
                document.querySelectorAll('.float-note-item').forEach((el, i) => {
                    el.textContent = noteTexts[lang][i % noteTexts[lang].length];
                });
                if (typeof updateNavLogin === 'function') updateNavLogin();
            };

            // ===== WALL BENTO CARDS =====
            const wb = document.getElementById('wallBento');
            const wallCardsData = [
                { cls: 'wc-yellow w-2 h-2', icon: '📝', titleKey: 'wcPostIt', descKey: 'wcPostItDesc' },
                { cls: 'wc-pink', icon: '🎨', titleKey: 'wcDecorate', descKey: 'wcDecorateDesc' },
                { cls: 'wc-blue', icon: '🏢', titleKey: 'wcRooms', descKey: 'wcRoomsDesc' },
                { cls: 'wc-orange w-2', icon: '💡', titleKey: 'wcBrainstormRoom', descKey: 'wcBrainstormRoomDesc' },
                { cls: 'wc-green w-2', icon: '👥', titleKey: 'wcInvite', descKey: 'wcInviteDesc' },
            ];

            wallCardsData.forEach((c, i) => {
                const d = document.createElement('div');
                d.className = 'wall-card ' + c.cls;
                d.dataset.speed = (0.02 + (i % 3) * 0.02).toFixed(3);
                d.innerHTML = '<div class="wc-icon">' + c.icon + '</div><div class="wc-title">' + translations[currentLang][c.titleKey] + '</div><div class="wc-desc">' + translations[currentLang][c.descKey] + '</div>';
                wb.appendChild(d);
            });

            // ===== GSAP SCROLLTRIGGER PARALLAX =====
            gsap.registerPlugin(ScrollTrigger);

            (window.__liteMotion ? [] : gsap.utils.toArray('[data-speed]')).forEach(el => {
                const speed = parseFloat(el.dataset.speed);
                gsap.to(el, {
                    y: () => speed * 400,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true,
                        invalidateOnRefresh: true
                    }
                });
            });

            // ===== HERO STICKY 3D TILT =====
            const hs = document.getElementById('heroSticky');
            if (hs && !window.__liteMotion) {
                hs.addEventListener('mousemove', (e) => {
                    const r = hs.getBoundingClientRect();
                    const x = (e.clientX - r.left) / r.width - 0.5;
                    const y = (e.clientY - r.top) / r.height - 0.5;
                    gsap.to(hs, {
                        rotateY: x * 25,
                        rotateX: -y * 25,
                        scale: 1.05,
                        duration: 0.5,
                        ease: 'power2.out'
                    });
                });
                hs.addEventListener('mouseleave', () => {
                    gsap.to(hs, {
                        rotateY: 0,
                        rotateX: 0,
                        scale: 1,
                        duration: 0.8,
                        ease: 'elastic.out(1, 0.5)'
                    });
                });
            }

            // ===== ENTRANCE ANIMATIONS =====
            gsap.utils.toArray('.bento-card').forEach((card, i) => {
                gsap.from(card, {
                    y: 80,
                    opacity: 0,
                    rotateX: 10,
                    duration: 1,
                    delay: i * 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 90%',
                        toggleActions: 'play none none none'
                    }
                });
            });

            gsap.utils.toArray('.wall-card').forEach((card, i) => {
                gsap.from(card, {
                    y: 50,
                    opacity: 0,
                    scale: 0.9,
                    duration: 0.7,
                    delay: i * 0.07,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 92%',
                        toggleActions: 'play none none none'
                    }
                });
            });

            gsap.from('.sec-float-content h2', {
                y: 60,
                opacity: 0,
                duration: 1.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.sec-float-content',
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                }
            });

            gsap.from('.sec-float-content p', {
                y: 40,
                opacity: 0,
                duration: 1,
                delay: 0.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.sec-float-content',
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                }
            });

            gsap.from('.glow-btn', {
                y: 30,
                opacity: 0,
                scale: 0.9,
                duration: 0.8,
                delay: 0.4,
                ease: 'back.out(1.7)',
                scrollTrigger: {
                    trigger: '.glow-btn',
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                }
            });

            // Initialize language on load
            setLang(currentLang);

            // ===== STORY PAGE GSAP ANIMATIONS =====
            // Origin sticky 3D tilt
            const os = document.getElementById('originSticky');
            if (os && !window.__liteMotion) {
                os.addEventListener('mousemove', (e) => {
                    const r = os.getBoundingClientRect();
                    const x = (e.clientX - r.left) / r.width - 0.5;
                    const y = (e.clientY - r.top) / r.height - 0.5;
                    gsap.to(os, { rotateY: x * 20, rotateX: -y * 20, scale: 1.05, duration: 0.5, ease: 'power2.out' });
                });
                os.addEventListener('mouseleave', () => {
                    gsap.to(os, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1,0.5)' });
                });
            }

            // Story entrance animations
            if (document.querySelector('.story-hero-title')) gsap.from('.story-hero-title', { y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', delay: 0.2 });
            if (document.querySelector('.story-badge')) gsap.from('.story-badge', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' });
            if (document.querySelector('.story-hero-desc')) gsap.from('.story-hero-desc', { y: 40, opacity: 0, duration: 1, delay: 0.4, ease: 'power3.out' });

            gsap.utils.toArray('.timeline-item').forEach((item, i) => {
                var timelineContent = item.querySelector('.timeline-content');
                var timelineDot = item.querySelector('.timeline-dot');
                if (timelineContent) gsap.from(timelineContent, {
                    x: i % 2 === 0 ? -40 : 40, opacity: 0, duration: 0.8, delay: i * 0.1,
                    ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none none' }
                });
                if (timelineDot) gsap.from(timelineDot, {
                    scale: 0, opacity: 0, duration: 0.5, delay: i * 0.1 + 0.2,
                    ease: 'back.out(1.7)', scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none none' }
                });
            });

            gsap.utils.toArray('.team-card').forEach((card, i) => {
                gsap.from(card, {
                    y: 50, opacity: 0, scale: 0.9, duration: 0.7, delay: i * 0.08, ease: 'power3.out',
                    scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' }
                });
            });

            gsap.utils.toArray('.value-card').forEach((card, i) => {
                gsap.from(card, {
                    y: 40, opacity: 0, duration: 0.7, delay: i * 0.1, ease: 'power3.out',
                    scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' }
                });
            });

            if (document.querySelector('.cta-title')) gsap.from('.cta-title', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.sec-cta', start: 'top 80%' } });
            if (document.querySelector('.cta-desc')) gsap.from('.cta-desc', { y: 40, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out', scrollTrigger: { trigger: '.sec-cta', start: 'top 80%' } });

            // Story cursor hover effects
            (function () {
                var c = document.getElementById('cursor');
                if (!c) return;
                document.querySelectorAll('.team-card, .value-card, .footer-social').forEach(function (el) {
                    el.addEventListener('mouseenter', function () { c.classList.add('hover'); });
                    el.addEventListener('mouseleave', function () { c.classList.remove('hover'); });
                });
            })();
