(function () {
    'use strict';

    var steps = Array.prototype.slice.call(document.querySelectorAll('[data-tour-step]'));
    var screens = Array.prototype.slice.call(document.querySelectorAll('[data-tour-screen]'));
    var progress = document.querySelector('.tour-progress span');
    var roomTabs = Array.prototype.slice.call(document.querySelectorAll('[data-room-preview]'));
    var roomPanel = document.getElementById('roomPreview');
    var mobileMenuToggles = Array.prototype.slice.call(document.querySelectorAll('.landing-mobile-menu-toggle'));
    var activeRoomKey = 'ideas';

    function setMobileMenu(toggle, open) {
        var menu = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
        if (!toggle || !menu) return;
        mobileMenuToggles.forEach(function (otherToggle) {
            var otherMenu = document.getElementById(otherToggle.getAttribute('aria-controls'));
            var active = otherToggle === toggle && open;
            otherToggle.setAttribute('aria-expanded', String(active));
            otherToggle.setAttribute('aria-label', active ? 'ปิดเมนูเว็บไซต์' : 'เปิดเมนูเว็บไซต์');
            if (otherMenu) otherMenu.hidden = !active;
        });
        document.body.classList.toggle('landing-mobile-menu-open', open);
    }

    mobileMenuToggles.forEach(function (toggle) {
        var menu = document.getElementById(toggle.getAttribute('aria-controls'));
        if (!menu) return;
        toggle.addEventListener('click', function () {
            setMobileMenu(toggle, toggle.getAttribute('aria-expanded') !== 'true');
        });
        menu.querySelectorAll('button').forEach(function (item) {
            item.addEventListener('click', function () {
                var page = item.getAttribute('data-mobile-page');
                setMobileMenu(toggle, false);
                if (page === 'features' && typeof window.showBento === 'function') {
                    window.showBento();
                    window.setTimeout(function () {
                        var features = document.getElementById('featuresOverview');
                        if (features) features.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 80);
                }
                if (page === 'story' && typeof window.showStory === 'function') window.showStory();
                if (page === 'blog' && typeof window.showBlog === 'function') window.showBlog();
                if (page === 'download' && typeof window.handleAppDownload === 'function') window.handleAppDownload();
            });
        });
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') mobileMenuToggles.forEach(function (toggle) { setMobileMenu(toggle, false); });
    });
    window.addEventListener('resize', function () {
        if (window.innerWidth > 900) mobileMenuToggles.forEach(function (toggle) { setMobileMenu(toggle, false); });
    });
    var landingCopy = {
        th: {
            heroKicker: '<span></span> พื้นที่ทำงานของทีมยุคใหม่', heroTitle: 'เปลี่ยนทุกไอเดีย<br>ให้กลายเป็น<span>งานที่ไปต่อได้</span>', heroDesc: 'WorkRoom รวมการจดไอเดีย วางแผน แบ่งห้อง และทำงานร่วมกับทีมไว้ในพื้นที่เดียว เพื่อให้ทุกคนเห็นภาพเดียวกันตั้งแต่เริ่มคิดจนงานเสร็จ', openApp: 'เปิด WorkRoom <span aria-hidden="true">→</span>', seeHow: 'ดูว่าใช้งานอย่างไร <span aria-hidden="true">↓</span>', trustRooms: '<span>✓</span> ห้องใช้ร่วมกันและห้องส่วนตัว แยกตามหัวข้อ', trustSearch: '<span>✓</span> ค้นหาห้อง เอกสาร ไฟล์ และลิงก์', trustLanguage: '<span>✓</span> ใช้งานได้ทั้งภาษาไทยและอังกฤษ', proofTitle: 'ฟังก์ชันที่มีอยู่จริงใน WorkRoom', proofEditor: 'เขียนเอกสาร เพิ่มรูป<br>และวาดบน whiteboard', proofRooms: 'สร้างห้องใช้ร่วมกันหรือส่วนตัว<br>และจัดไว้ใต้หัวข้อที่เลือก', proofTasks: 'มอบหมายงาน กำหนดวันส่ง<br>และติดตามสถานะ', roomsTitle: 'ดูหน้าการทำงาน<br>ของทุกห้องในแอป', tourTitle: 'เห็นวิธีทำงาน<br>ก่อนตัดสินใจเริ่มใช้', tourDesc: 'เลื่อนลงเพื่อดูว่า WorkRoom ช่วยเปลี่ยนงานที่กระจัดกระจาย ให้กลายเป็นขั้นตอนที่ทีมตามต่อได้อย่างไร', step1Title: 'เขียน เพิ่มรูป และวาดไอเดียในหน้าเดียว', step1Desc: 'ห้อง Ideas รองรับ editor แบบบล็อก รูปภาพ และ whiteboard พร้อมเมนูคำสั่ง / สำหรับเพิ่มเนื้อหาหลายรูปแบบ', step2Title: 'จัดงานด้วยห้องตามประเภทที่มีในแอป', step2Desc: 'สร้างและแก้ไขห้องได้ โดยเลือกเป็นห้องส่วนตัวหรือห้องทีม ส่วนแถบด้านข้างแยกหน้าทั่วไป ห้องส่วนตัว และห้องแผนกให้เห็นชัด', step3Title: 'มอบหมายและติดตามงานจากเนื้อหาใน WorkRoom', step3Desc: 'กำหนดผู้รับผิดชอบ วันส่ง และสถานะงาน พร้อมพูดคุยด้วยความคิดเห็นและ @mention จากนั้นดูรายการที่เกี่ยวข้องได้ใน My tasks', step3List: '<li>ผู้รับผิดชอบและวันส่ง</li><li>สถานะงาน</li><li>ความคิดเห็นและ mention</li>', ctaKicker: '<span></span> พร้อมเมื่อคุณพร้อม', ctaTitleLanding: 'ให้ทุกไอเดียของทีม<br>มีพื้นที่ได้เติบโต', ctaDescLanding: 'เปิด WorkRoom เพื่อทดลองสร้างห้อง จดไอเดีย ใช้ Templates และดูระบบ My tasks ด้วยตัวเอง'
        },
        en: {
            heroKicker: '<span></span> A modern workspace for teams', heroTitle: 'Turn every idea<br>into <span>work that moves forward</span>', heroDesc: 'WorkRoom brings ideas, plans, rooms, and teamwork into one place, so everyone shares the same view from first thought to finished work.', openApp: 'Open WorkRoom <span aria-hidden="true">→</span>', seeHow: 'See how it works <span aria-hidden="true">↓</span>', trustRooms: '<span>✓</span> Shared and private rooms organized by section', trustSearch: '<span>✓</span> Search rooms, documents, files, and links', trustLanguage: '<span>✓</span> Available in Thai and English', proofTitle: 'Features that are actually available in WorkRoom', proofEditor: 'Write documents, add images,<br>and draw on a whiteboard', proofRooms: 'Create shared or private rooms<br>under the section you choose', proofTasks: 'Assign work, set due dates,<br>and track status', roomsTitle: 'See the workspace<br>inside every app room', tourTitle: 'See how it works<br>before you get started', tourDesc: 'Scroll to see how WorkRoom turns scattered work into clear steps that your team can keep moving forward.', step1Title: 'Write, add images, and sketch ideas on one page', step1Desc: 'The Ideas room supports a block editor, images, and a whiteboard, plus a / command menu for adding content blocks.', step2Title: 'Organize work with the room types available in the app', step2Desc: 'Create and edit private or team rooms. The sidebar clearly separates general pages, private rooms, and department rooms.', step3Title: 'Assign and track work from WorkRoom content', step3Desc: 'Set an owner, due date, and status, discuss work with comments and @mentions, then find relevant items in My tasks.', step3List: '<li>Owner and due date</li><li>Task status</li><li>Comments and mentions</li>', ctaKicker: '<span></span> Ready when you are', ctaTitleLanding: 'Give every team idea<br>room to grow', ctaDescLanding: 'Open WorkRoom to create a room, capture ideas, use Templates, and explore My tasks yourself.'
        }
    };
    Object.assign(landingCopy.th, {
        step1List: '<li>Block editor</li><li>รูปภาพ</li><li>Whiteboard</li>', actualScreen: 'ภาพจากแอปจริง',
        screenIdeas: 'ห้องไอเดีย', screenFeatures: 'ฟังก์ชันในภาพ', screenRooms: 'รายการห้องในแถบด้านข้าง',
        screenTypes: 'ประเภทที่เห็นในแอป', screenTasks: 'My tasks และเครื่องมือด้านบน', screenAvailable: 'ฟังก์ชันที่ใช้งานได้'
    });
    Object.assign(landingCopy.en, {
        step1List: '<li>Block editor</li><li>Images</li><li>Whiteboard</li>', actualScreen: 'Actual app screen',
        screenIdeas: 'Ideas room', screenFeatures: 'Features shown', screenRooms: 'Room list in the sidebar',
        screenTypes: 'Room types shown in the app', screenTasks: 'My tasks and top tools', screenAvailable: 'Available features'
    });

    var roomPreviewData = {
        'ideas': { index: '01 / 06', eyebrow: 'IDEAS ROOM', th: ['จดและพัฒนาไอเดีย', 'Block editor · รูปภาพ · Whiteboard', 'หน้าจอจริงของห้อง Ideas ใน WorkRoom'], en: ['Capture and develop ideas', 'Block editor · Images · Whiteboard', 'Actual Ideas room screen in WorkRoom'], image: 'assets/rooms/ideas.png' },
        'my-postits': { index: '02 / 06', eyebrow: 'MY POST-ITS', th: ['รวม Post-it ส่วนตัว', 'เอกสารที่บันทึกมายัง My Post-its จะแสดงในห้องนี้', 'หน้าจอจริงของห้อง My Post-its ใน WorkRoom'], en: ['Collect personal Post-its', 'Documents saved to My Post-its appear in this room', 'Actual My Post-its room screen in WorkRoom'], image: 'assets/rooms/my-postits.png' },
        'team-postits': { index: '03 / 06', eyebrow: 'TEAM POST-ITS', th: ['รวม Post-it สำหรับทีม', 'เอกสารที่บันทึกสำหรับทีมจะแสดงในห้องนี้', 'หน้าจอจริงของห้อง Team Post-its ใน WorkRoom'], en: ['Collect team Post-its', 'Documents saved for the team appear in this room', 'Actual Team Post-its room screen in WorkRoom'], image: 'assets/rooms/team-postits.png' },
        'private-project': { index: '04 / 06', eyebrow: 'PRIVATE ROOM', th: ['เอกสารของโปรเจกต์ส่วนตัว', 'ห้องส่วนตัวพร้อม editor สำหรับเอกสารของเจ้าของพื้นที่', 'หน้าจอจริงของห้อง Private Project ใน WorkRoom'], en: ['Private project documents', 'A private room with an editor for the workspace owner', 'Actual Private Project room screen in WorkRoom'], image: 'assets/rooms/private-project.png' },
        'content-team': { index: '05 / 06', eyebrow: 'DEPARTMENT', th: ['พื้นที่เอกสารของ Content Team', 'ห้องแผนกสำหรับเขียนและเก็บแผนคอนเทนต์', 'หน้าจอจริงของห้อง Content Team ใน WorkRoom'], en: ['Content Team documents', 'A department room for writing and storing content plans', 'Actual Content Team room screen in WorkRoom'], image: 'assets/rooms/content-team.png' },
        'web-development': { index: '06 / 06', eyebrow: 'DEPARTMENT', th: ['พื้นที่เอกสารของ Web Development', 'ห้องแผนกสำหรับเขียนและเก็บเอกสารทางเทคนิค', 'หน้าจอจริงของห้อง Web Development ใน WorkRoom'], en: ['Web Development documents', 'A department room for writing and storing technical documents', 'Actual Web Development room screen in WorkRoom'], image: 'assets/rooms/web-development.png' }
    };

    function activateRoomPreview(key, focusTab) {
        if (!roomPanel || !roomPreviewData[key]) return;
        var data = roomPreviewData[key];
        activeRoomKey = key;
        var image = roomPanel.querySelector('img');
        var activeTab = null;
        roomTabs.forEach(function (tab, index) {
            var active = tab.getAttribute('data-room-preview') === key;
            if (!tab.id) tab.id = 'roomTab' + (index + 1);
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
            if (active) activeTab = tab;
        });
        if (activeTab) roomPanel.setAttribute('aria-labelledby', activeTab.id);
        roomPanel.querySelector('.room-preview-index').textContent = data.index;
        roomPanel.querySelector('.room-preview-meta p').textContent = data.eyebrow;
        var localized = data[document.documentElement.lang === 'en' ? 'en' : 'th'];
        roomPanel.querySelector('.room-preview-meta h3').textContent = localized ? localized[0] : data.title;
        roomPanel.querySelector('.room-preview-meta div > span').textContent = localized ? localized[1] : data.detail;
        image.classList.add('is-changing');
        window.setTimeout(function () {
            image.src = data.image;
            image.alt = localized ? localized[2] : data.alt;
            image.onload = function () { image.classList.remove('is-changing'); };
        }, 160);
        if (focusTab && activeTab) activeTab.focus();
    }

    function updateLandingLanguage(lang) {
        lang = lang === 'en' ? 'en' : 'th';
        var copy = landingCopy[lang];
        document.querySelectorAll('[data-landing-i18n]').forEach(function (element) {
            var value = copy[element.getAttribute('data-landing-i18n')];
            if (typeof value === 'string') element.innerHTML = value;
        });
        activateRoomPreview(activeRoomKey, false);
    }

    document.querySelectorAll('.lang-btn[data-lang]').forEach(function (button) {
        button.addEventListener('click', function () {
            window.setTimeout(function () { updateLandingLanguage(button.getAttribute('data-lang')); }, 0);
        });
    });
    updateLandingLanguage(localStorage.getItem('bentoLang') || document.documentElement.lang || 'th');

    roomTabs.forEach(function (tab, index) {
        tab.addEventListener('click', function () { activateRoomPreview(tab.getAttribute('data-room-preview'), false); });
        tab.addEventListener('keydown', function (event) {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
            event.preventDefault();
            var next = (index + (event.key === 'ArrowRight' ? 1 : -1) + roomTabs.length) % roomTabs.length;
            activateRoomPreview(roomTabs[next].getAttribute('data-room-preview'), true);
        });
    });

    function activateTour(index) {
        steps.forEach(function (step, i) { step.classList.toggle('is-active', i === index); });
        screens.forEach(function (screen, i) { screen.classList.toggle('is-active', i === index); });
        if (progress) progress.style.width = (((index + 1) / Math.max(steps.length, 1)) * 100) + '%';
    }

    if ('IntersectionObserver' in window && steps.length) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) activateTour(Number(entry.target.getAttribute('data-tour-step')) || 0);
            });
        }, { rootMargin: '-34% 0px -48% 0px', threshold: 0 });
        steps.forEach(function (step) { observer.observe(step); });
    }

    document.querySelectorAll('a[href="#productTour"]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            var target = document.getElementById('productTour');
            if (!target) return;
            event.preventDefault();
            if (window.__lenis && typeof window.__lenis.scrollTo === 'function') {
                window.__lenis.scrollTo(target, { offset: -60, duration: 1.15 });
            } else {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    if (window.gsap && !window.__liteMotion) {
        gsap.from('.product-hero-copy > *', { y: 32, opacity: 0, duration: .85, stagger: .09, delay: .18, ease: 'power3.out' });
        gsap.from('.product-hero-visual', { y: 42, opacity: 0, rotateY: 5, duration: 1.15, delay: .32, ease: 'power3.out' });
        gsap.utils.toArray('.proof-items > div').forEach(function (card, index) {
            gsap.from(card, { y: 34, opacity: 0, duration: .7, delay: index * .08, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 90%' } });
        });
    }

    function handleAppDownload() {
        var isMobile = window.matchMedia('(max-width: 900px)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        var modal = document.getElementById('downloadAppModal');

        if (modal) {
            var desktopView = modal.querySelector('.download-desktop-view');
            var mobileView = modal.querySelector('.download-mobile-view');
            if (desktopView) desktopView.style.display = isMobile ? 'none' : 'block';
            if (mobileView) mobileView.style.display = isMobile ? 'block' : 'none';
        }

        if (!isMobile) {
            triggerPCDownload('windows');
            return;
        }

        // Keep the download chooser independent from Landing/Login/WorkRoom visibility.
        if (modal && modal.parentElement !== document.body) document.body.appendChild(modal);

        if (typeof window.openModal === 'function') {
            window.openModal('downloadAppModal');
        } else if (modal) {
            modal.classList.add('active');
        }
    }

    function triggerPCDownload(platform) {
        platform = platform || 'windows';
        var downloads = (window.WORKROOM_CONFIG && window.WORKROOM_CONFIG.downloads) || {};
        var downloadUrl = platform === 'mac' ? downloads.mac : downloads.windows;
        if (!downloadUrl) {
            var unavailable = document.documentElement.lang === 'en'
                ? 'The signed desktop installer is not available yet.'
                : 'ตัวติดตั้ง Desktop ที่ผ่านการลงนามยังไม่พร้อมให้ดาวน์โหลด';
            if (typeof window.showToast === 'function') window.showToast(unavailable);
            else alert(unavailable);
            return;
        }
        var fileName = platform === 'mac' ? 'KawaiiRoomie.dmg' : 'KawaiiRoomie-Setup.exe';
        var link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (typeof window.showToast === 'function') {
            window.showToast(document.documentElement.lang === 'en' ? 'Downloading ' + fileName : 'กำลังดาวน์โหลด ' + fileName);
        }
    }

    function showStoreComingSoon(storeName) {
        var msg = document.documentElement.lang === 'en'
            ? '🚀 WorkRoom on ' + storeName + ' is coming soon!'
            : '🚀 WorkRoom บน ' + storeName + ' กำลังจะเปิดให้บริการเร็วๆ นี้!';
        if (typeof window.showToast === 'function') {
            window.showToast(msg);
        } else {
            alert(msg);
        }
    }

    window.handleAppDownload = handleAppDownload;
    window.triggerPCDownload = triggerPCDownload;
    window.showStoreComingSoon = showStoreComingSoon;
}());
