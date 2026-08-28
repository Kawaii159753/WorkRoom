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
        function setMarketingFooterVisible(visible) {
            var footer = document.getElementById('marketingFooter');
            if (footer) footer.hidden = !visible;
        }

        function showBlog(skipHistory = false) {
            setMarketingFooterVisible(true);
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
            prepareBlogGuides();

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

        var BLOG_GUIDES = {
            th: [
                {intro:'ใช้ขั้นตอนสั้นๆ นี้เพื่อเปลี่ยนไอเดียที่เพิ่งนึกออกให้กลับมาทำต่อได้',steps:['จดหนึ่งไอเดียต่อหนึ่งโปสต์อิทและตั้งหัวข้อให้ค้นเจอ','สร้างโปสต์อิทไว้ในห้องที่สัมพันธ์กับงานตั้งแต่ต้น','เพิ่มผู้รับผิดชอบ สถานะ และวันส่งเมื่อไอเดียเริ่มเป็นงาน'],tip:'ปัจจุบันยังย้ายโปสต์อิทข้ามห้องโดยตรงไม่ได้ จึงควรเลือกห้องให้เหมาะสมก่อนบันทึก'},
                {intro:'โปสต์อิทดิจิทัลจะมีประโยชน์เมื่อแต่ละใบมีหน้าที่ชัดเจน',steps:['เขียนประโยคแรกเป็นชื่อที่สื่อความหมาย','แยกรายละเอียดและรายการที่ต้องทำเป็นคนละบรรทัด','ใช้สถานะและความคิดเห็นเฉพาะเมื่อโปสต์อิทถูกนำไปทำงานต่อ'],tip:'ถ้าหนึ่งใบมีหลายประเด็น ให้แยกเป็นหลายใบเพื่อมอบหมายได้ง่าย'},
                {intro:'PARA เป็นเพียงแนวทางหนึ่งสำหรับคิดโครงสร้างห้อง ไม่ใช่ระบบจัดหมวดอัตโนมัติของ WorkRoom',steps:['ใช้ห้องโปรเจกต์กับสิ่งที่มีผลลัพธ์และวันจบ','ใช้ห้องแผนกกับความรับผิดชอบที่ต้องดูแลต่อเนื่อง','เก็บข้อมูลอ้างอิงไว้กับงานที่เกี่ยวข้องและปิดงานที่เสร็จแล้ว'],tip:'คุณตั้งชื่อและจัดห้องเองได้ตามทีม ไม่จำเป็นต้องใช้ PARA ทุกส่วน'},
                {intro:'WorkRoom เริ่มจากโจทย์ว่าทีมควรเห็นไอเดีย งาน และการตัดสินใจในบริบทเดียวกัน',steps:['ลดจำนวนหน้าที่ซ้ำกัน','ทำให้โปสต์อิทเปลี่ยนเป็นงานที่มอบหมายได้','เก็บความคิดเห็นและสถานะไว้กับสิ่งที่กำลังรีวิว'],tip:'ต้นแบบนี้เน้นความชัดเจนก่อนจำนวนฟีเจอร์'},
                {intro:'Whiteboard เหมาะกับช่วงที่คำอธิบายยังไม่ชัดเท่าภาพ',steps:['ร่างความสัมพันธ์หรือหน้าจอแบบเร็วๆ','เขียนสรุปใต้ภาพเพื่อให้คนอื่นเข้าใจตรงกัน','สร้างงานย่อยจากส่วนที่ทีมตกลงจะทำ'],tip:'ใช้ Whiteboard เพื่อคิดร่วมกัน แล้วสรุปผลเป็นข้อความหรืองานเสมอ'},
                {intro:'ห้องไอเดียถูกออกแบบให้ไอเดียไม่จบแค่การจด',steps:['ตั้งชื่อจากประโยคแรกให้ค้นหาได้','เชื่อมรายละเอียด ไฟล์ และหน้าวาดที่เกี่ยวข้อง','มอบหมายคนและกำหนดสถานะเมื่อพร้อมลงมือ'],tip:'ไอเดียที่ยังไม่พร้อมทำสามารถเก็บไว้โดยไม่ต้องกำหนดวันส่ง'},
                {intro:'ตัวอย่างโครงสร้างห้องแผนกสำหรับทีมคอนเทนต์',steps:['สร้างห้องสำหรับบรีฟและแผนคอนเทนต์','แนบรูปภาพหรือเชื่อมลิงก์ไฟล์ภายนอกไว้กับโปสต์อิทของงานนั้น','ใช้ความคิดเห็นสำหรับรีวิวและเปลี่ยนเป็นอนุมัติเมื่อจบ'],tip:'WorkRoom รุ่นนี้รองรับรูปภาพและลิงก์ ยังไม่รองรับการอัปโหลดไฟล์ทั่วไปโดยตรง'},
                {intro:'ทีมเล็กสามารถเริ่มจากเวิร์กโฟลว์เดียวโดยไม่สร้างโครงสร้างซับซ้อน',steps:['แบ่งห้องตามโปรเจกต์หรือหน้าที่หลัก','มอบหมายเจ้าของงานและวันส่งที่จำเป็น','ใช้หน้ากำลังทำของฉันเพื่อตรวจงานประจำวัน'],tip:'เริ่มจากสามสถานะ รอความเห็น กำลังแก้ไข และอนุมัติแล้ว'},
                {intro:'Mood Board มีประโยชน์ที่สุดเมื่ออยู่ใกล้งานที่ต้องใช้มัน',steps:['สร้างหน้าสำหรับทิศทางภาพของโปรเจกต์','เพิ่มภาพอ้างอิงพร้อมคำอธิบายว่าชอบอะไร','เชื่อมไปยังไฟล์งานและเก็บข้อสรุปจากการรีวิว'],tip:'อย่าเก็บเฉพาะภาพ ควรบันทึกเหตุผลการเลือกด้วย'},
                {intro:'ไอเดียที่แวบเข้ามาควรถูกจับไว้ก่อน แล้วค่อยจัดระเบียบภายหลัง',steps:['จดประโยคสั้นที่ยังเข้าใจได้เมื่อกลับมาอ่าน','ใส่ไว้ในกล่องรับไอเดียหรือห้องชั่วคราว','ทบทวนและย้ายไปยังโปรเจกต์ที่เหมาะสม'],tip:'การจดเร็วไม่จำเป็นต้องสวยหรือสมบูรณ์'},
                {intro:'รายการยาวอ่านยาก การแบ่งกลุ่มช่วยให้เห็นสิ่งที่เกี่ยวข้องกัน',steps:['รวมรายการที่มีเป้าหมายเดียวกัน','ตั้งชื่อกลุ่มด้วยผลลัพธ์ที่ต้องการ','เลือกเฉพาะกลุ่มสำคัญมาทำก่อน'],tip:'จำนวนรายการต่อกลุ่มไม่ใช่กฎตายตัว ให้ใช้เท่าที่สแกนแล้วเข้าใจง่าย'},
                {intro:'พื้นที่ทำงานที่เรียบช่วยลดเวลาหาของและตัดสินใจได้เร็วขึ้น',steps:['ลบห้องหรือหน้าที่ไม่ใช้งาน','รวมไฟล์ซ้ำและเก็บลิงก์ไว้กับงานต้นทาง','ปิดงานที่อนุมัติแล้วและเก็บไว้ในประวัติ'],tip:'ทำความสะอาดทีละโปรเจกต์แทนการจัดทั้งระบบพร้อมกัน'}
            ],
            en: [
                {intro:'Turn a fresh idea into something you can find and continue later.',steps:['Capture one idea per post-it with a searchable title','Create the post-it in the room connected to the work','Add an owner, status, and due date when it becomes actionable'],tip:'Post-its cannot yet be moved directly between rooms, so choose the room before saving.'},
                {intro:'Digital post-its work best when each card has one clear purpose.',steps:['Use the first sentence as a meaningful title','Separate context from actionable items','Add workflow details only when the note becomes work'],tip:'Split a card when it contains several independently assignable tasks.'},
                {intro:'PARA is an optional way to think about room structure, not an automatic WorkRoom feature.',steps:['Use project rooms for work with a defined outcome','Use department rooms for ongoing responsibilities','Keep references beside related work and close completed items'],tip:'Name and organize rooms around your team; you do not need to apply every part of PARA.'},
                {intro:'WorkRoom starts from one principle: ideas, work, and decisions should share context.',steps:['Reduce pages that repeat the same purpose','Let a post-it become an assignable task','Keep feedback and status beside the item under review'],tip:'The prototype prioritizes clarity before feature count.'},
                {intro:'Use a whiteboard when a quick sketch explains more than a paragraph.',steps:['Sketch the flow or relationship','Add a short written conclusion','Create tasks from the parts the team agrees to build'],tip:'Always turn the outcome of a whiteboard session into a clear note or task.'},
                {intro:'The idea room is designed to help ideas move beyond capture.',steps:['Use the first line as a searchable title','Connect supporting files and sketches','Assign people and status when the idea is ready for action'],tip:'Ideas that are not ready can remain unassigned and without a due date.'},
                {intro:'A practical department-room setup for a content team.',steps:['Create one place for briefs and the content plan','Attach images or link external files from the related post-it','Use comments for review and approve when finished'],tip:'This version supports images and links, not direct uploads of general files.'},
                {intro:'A small team can begin with one workflow and minimal structure.',steps:['Organize rooms around projects or key responsibilities','Assign an owner and only necessary due dates','Use My Tasks for the daily view'],tip:'Begin with Waiting for feedback, Revising, and Approved.'},
                {intro:'A mood board is most useful when it stays close to the work it guides.',steps:['Create a page for the project visual direction','Add references with a note about what matters','Link deliverables and capture review decisions'],tip:'Save the reason for each reference, not only the image.'},
                {intro:'Capture a passing idea first and organize it later.',steps:['Write one sentence you can understand later','Place it in an inbox or temporary room','Review it and move it to the right project'],tip:'Fast capture does not need to be polished.'},
                {intro:'Small groups make long lists easier to scan.',steps:['Group items that support the same outcome','Name each group after its intended result','Choose only the priority group to work on first'],tip:'Group size is not a strict rule; optimize for readability.'},
                {intro:'A focused workspace reduces searching and repeated decisions.',steps:['Remove rooms and pages no longer in use','Combine duplicates and keep links with source work','Close approved work and retain it in history'],tip:'Clean one project at a time instead of reorganizing everything.'}
            ]
        };

        function prepareBlogGuides() {
            document.querySelectorAll('.blog-card').forEach(function(card, index) {
                card.dataset.guideIndex = String(index);
                card.tabIndex = 0;
                card.setAttribute('role', 'button');
                card.onclick = function() { openBlogGuide(index); };
                card.onkeydown = function(event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openBlogGuide(index); } };
            });
        }

        function openBlogGuide(index) {
            var card = document.querySelectorAll('.blog-card')[index];
            var guide = BLOG_GUIDES[currentLang === 'en' ? 'en' : 'th'][index];
            if (!card || !guide) return;
            document.getElementById('blogGuideTitle').textContent = card.querySelector('.blog-card-title').textContent.trim();
            document.getElementById('blogGuideIntro').textContent = guide.intro;
            document.getElementById('blogGuideSteps').innerHTML = guide.steps.map(function(step){ return '<li>' + step + '</li>'; }).join('');
            document.getElementById('blogGuideTip').textContent = (currentLang === 'en' ? 'Tip: ' : 'คำแนะนำ: ') + guide.tip;
            var modal = document.getElementById('blogGuideModal');
            modal.querySelector('.blog-guide-close').setAttribute('aria-label', currentLang === 'en' ? 'Close' : 'ปิด');
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
            modal.querySelector('.blog-guide-close').focus();
        }

        function closeBlogGuide() {
            var modal = document.getElementById('blogGuideModal');
            if (!modal) return;
            modal.hidden = true;
            document.body.style.overflow = '';
        }

        function showStory(skipHistory = false) {
            setMarketingFooterVisible(true);
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
            setMarketingFooterVisible(false);
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
            setMarketingFooterVisible(false);
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
            setMarketingFooterVisible(true);
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
            showWorkroom();
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
