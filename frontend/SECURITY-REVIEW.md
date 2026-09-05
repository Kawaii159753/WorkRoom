# ผลตรวจหน้าเว็บ — 5 กันยายน 2026

ตรวจโค้ดและทดสอบหน้าเว็บในโฟลเดอร์ `frontend` โดยแก้เฉพาะปัญหาที่มีหลักฐาน ทำต่อจากการแก้ XSS รอบแรก ไม่แก้ฐานข้อมูล, Google/FB API, API client, cloud storage หรือระบบสถานะออนไลน์/เคอร์เซอร์ของทีม

**ผลตรวจ:** พบปัญหาเพิ่ม 4 กลุ่มและแก้แล้ว ชุดทดสอบ Chrome ผ่าน 24 กรณี (ชุดเดิม 4 + ชุดขยาย 20) และตรวจ syntax ของ JavaScript ทุกไฟล์ผ่าน ผลนี้ไม่ใช่การรับรองว่าไม่มีช่องโหว่เหลือในทุกสภาพแวดล้อม

## ปัญหาที่แก้รอบนี้

| ปัญหาและระดับ | หลักฐานก่อนแก้ / เงื่อนไข | การแก้และขอบเขตผลกระทบ |
|---|---|---|
| สิทธิ์ดูอย่างเดียวบนหน้าเว็บไม่คงอยู่ — ต่ำ, ความมั่นใจสูง | เปลี่ยนแท็บไอเดียแล้ว `contentEditable` กลับเป็น `true`; Ctrl+Enter ในบล็อก code เพิ่มบล็อกได้; checkbox ไอเดียไม่มีการตรวจสิทธิ์ | กำหนดสิทธิ์ตั้งแต่สร้างช่องเขียนและตรวจซ้ำใน input/keyboard/todo handlers ใน `editor.js`; คง `plaintext-only` ของ code เมื่อใช้ `applyWorkspaceRole` ใน `team.js` |
| แนบรูปผิดเอกสาร/พื้นที่ทำงาน — ปานกลาง, ความมั่นใจสูง | ชะลอ FileReader แล้วเปลี่ยนห้องหรือ workspace ก่อน onload: รูปถูกใส่ปลายทางใหม่; slash menu ใช้ array และตำแหน่งเมนูที่เปลี่ยนแล้ว; drop รับรูปแม้เป็น viewer | จับ workspace, ผู้ใช้, ห้อง และ array ของบล็อกตั้งแต่เริ่ม แล้วตรวจซ้ำก่อนแก้ข้อมูล หากปลายทางหรือสิทธิ์เปลี่ยนจะยกเลิก callback; ใช้ตำแหน่งจริงของบล็อกแทนเมนูที่ปิดไปแล้ว และสั่งบันทึกเมื่อ drop สำเร็จ (`editor.js`, เฉพาะ drop handler ใน `state.js`) |
| รูปโปรไฟล์ไปลงบัญชีใหม่ — ปานกลาง, ความมั่นใจสูง | เริ่มอ่านรูปของบัญชี A แล้วเปลี่ยน currentUser เป็นบัญชี B ก่อน callback: โค้ดเดิมใช้บัญชี B เป็นปลายทาง | callback ใช้ได้เฉพาะเมื่อ currentUser ยังเป็นออบเจ็กต์เดิม (`changeAvatar` ใน `modals.js`); ไม่แก้กระบวนการเข้าสู่ระบบหรือ OAuth |
| ตัวไฮไลต์ code ใช้เวลามากกับข้อความเจาะจง — ปานกลาง, ความมั่นใจสูง | ข้อความ `/*a` ซ้ำรวม 300,000 ตัวอักษร ทำให้ฟังก์ชันเดิมเกินเวลาทดสอบ 2 วินาที; ประมวลผลบน main thread เมื่อเปิด/พิมพ์เอกสาร | บล็อกเกิน 20,000 ตัวอักษรแสดงข้อความที่ escape แล้วโดยไม่ลงสี เนื้อหายังคงครบ อ่าน/แก้/คัดลอกได้ (`highlightCodeText` ใน `editor.js`) |

ข้อจำกัดของ finding เรื่อง viewer: ยืนยันการแก้ข้อมูลในหน่วยความจำผ่าน UI ได้ แต่ไม่ได้ยืนยันว่าข้ามสิทธิ์บนเซิร์ฟเวอร์ได้ `saveActiveWorkspaceData` เดิมมีการกัน viewer อยู่แล้ว การแก้หน้าเว็บนี้ไม่ใช่การเพิ่ม authorization ฝั่ง server

การทดสอบ race ใช้ FileReader จำลองเพื่อควบคุมจังหวะก่อน/หลัง onload ให้ทำซ้ำได้ รูปเป็นไฟล์ทดสอบ ไม่ได้ใช้ไฟล์หรือบัญชีจริง

## พื้นผิวที่ตรวจ

| ส่วน | สิ่งที่ตรวจ / ผล |
|---|---|
| Landing, Story, Blog, หน้า Login | ตรวจการเลือก route/hash และ HTML ของข้อมูลหน้าเว็บ; ทดสอบ route รวม hash ที่มี payload, เปิดคู่มือ blog และเปลี่ยนหน้า; ไม่มีจุด XSS เพิ่มที่ยืนยันได้ |
| เอกสารปกติและไอเดีย | ตรวจบล็อกทุกชนิด, sanitizer, code highlighting, title extraction, คีย์บอร์ด, เมนู slash, checkbox, การสลับหน้า; พบและแก้ปัญหาสิทธิ์/async/เวลาไฮไลต์ข้างต้น |
| ห้องและหัวข้อ | ตรวจการประกอบชื่อ/ID ลง HTML และ event handlers, สร้าง/เปลี่ยนชื่อ/ลบ/จัดลำดับจากโค้ด; ทดสอบ renderer และ handler arguments ด้วย ID ที่มีคำสั่งแฝง |
| โปสต์อิทและ workflow | ตรวจ reader, full editor, การ์ด, สถานะ, ผู้รับผิดชอบ, คอมเมนต์/ตอบกลับ, กิจกรรม, ลิงก์, My Tasks และ templates; ทดสอบ HTML อันตรายและการ encode ID |
| การแจ้งเตือนและ mention | ตรวจการแสดงชื่อ, เนื้อหา, รูป, คำเชิญ และการใส่ mention chip; ทดสอบ payload ใน notification และ comment rendering; ไม่ส่ง notification ไปยังระบบจริง |
| ค้นหา | ตรวจการดึงข้อความจากเนื้อหาและแสดงผล/เปิดผลค้นหา; ทดสอบ payload โดยไม่ให้เกิดการรันโค้ด |
| รูปและลิงก์ | ตรวจ file picker/drop, ขนาด/MIME, raster data URL และ URL schemes; ทดสอบปฏิเสธ SVG/HTML/ไฟล์เกินขนาด, javascript/data/file links, HTTPS ปกติ และ race ของการแนบรูป |
| ส่งออกเอกสาร | ตรวจชื่อไฟล์/ชื่อเอกสาร/เนื้อหา HTML ของ Blob; ทดสอบว่า payload ไม่กลายเป็น script/image/event handler ในไฟล์ส่งออก |
| Whiteboard | ตรวจพิกัด/สี/ขนาดผ่าน Canvas API และจุดตรวจ viewer; ไม่มีการนำข้อมูลเส้นวาดไปเป็น HTML หรือโค้ด ไม่ได้ทดสอบโหลดเส้นวาดปริมาณไม่จำกัด |
| ตั้งค่าและโปรไฟล์ | ตรวจ theme/accent/language, toast, modal, การแสดงชื่อ/รูป และ callback ของรูปโปรไฟล์; ทดสอบ 2 ภาษา, 4 theme และขนาดจอ 390/1280 พิกเซล |
| Email login ฝั่ง UI | อ่านเส้นทางส่งฟอร์ม/แสดงข้อผิดพลาด/cache และพบว่าไม่ได้เก็บ password ใน localStorage/sessionStorage ในเส้นทางที่อ่าน; ไม่ทดสอบ API login/logout/session หรือเปลี่ยน auth.js |
| HTML อื่นและการตั้งค่า host | ตรวจ privacy.html, terms.html, mobile-preview.html และ `_headers` จากไฟล์; หน้า privacy/terms เป็นเนื้อหาคงที่, preview ใช้ iframe URL คงที่; ไม่แก้ CSP/headers และยังไม่ยืนยันว่า host จริงส่ง headers ตามไฟล์ |
| ไลบรารีภายนอก | ตรวจเวอร์ชันที่อ้างใน HTML และ advisory ที่เกี่ยวข้องตามหมายเหตุด้านล่าง; ไม่อัปเกรดแพ็กเกจโดยไม่มีหลักฐานว่ารุ่นใช้งานได้รับผลกระทบ |

## การทดสอบและข้อจำกัด

- `test-security.cjs`: regression 4 กรณีของ XSS รอบแรก ผ่านทั้งหมด
- `test-audit.cjs`: 20 กรณีจากไฟล์ HTML และ JS จริง ทดสอบใน Chrome แบบแยกบัญชี/บริบทผ่าน Playwright
- ทดสอบการแสดงผลเชิงพฤติกรรม ไม่ใช่การตรวจภาพหน้าจอทุกตำแหน่งหรือทุกเบราว์เซอร์
- Browser fixture ปิดการเชื่อมต่อภายนอก, ไม่โหลด auth/API/cloud/socket scripts, ใช้บัญชีตัวอย่าง และแทน persistence ด้วยตัวนับ; animation ใช้ stub ที่เรียก translation callbacks เพื่อให้ผลทดสอบคงที่
- ไม่เรียกฐานข้อมูล, Google/FB, ระบบออนไลน์ของทีม หรือเซิร์ฟเวอร์จริง ไม่ได้ทดสอบ CORS, CSRF, session expiry, IDOR, การแบ่งข้อมูล tenant และ authorization ฝั่ง server
- ยังไม่ใช่การทดสอบ payload ทุกแบบหรือ malformed storage ทุกโครงสร้าง และไม่มีการรับรองความปลอดภัยของฟีเจอร์ที่ยังสร้างไม่เสร็จ

รันทดสอบจากโฟลเดอร์ frontend ด้วย Node.js ที่ resolve แพ็กเกจ `playwright` ได้ และติดตั้ง Google Chrome:

```powershell
node test-security.cjs
node test-audit.cjs
```

ไลบรารี: HTML ใช้ GSAP 3.12.5; advisory CVE-2020-28478 ระบุรุ่นที่ได้รับผลกระทบต่ำกว่า 3.6.0 จึงไม่ใช้เป็นเหตุให้อัปเกรดรุ่นนี้ [GitHub Advisory](https://github.com/advisories/GHSA-6g8v-hpgw-h2v7) ตรวจหน้า security ของ [GSAP](https://github.com/greensock/GSAP/security) และ [Lenis](https://github.com/darkroomengineering/lenis/security) ประกอบ แต่การค้นไม่พบ advisory เพิ่มไม่ใช่หลักฐานว่าไม่มีช่องโหว่ ไลบรารี Socket.IO อยู่ในระบบออนไลน์ที่ยกเว้น
