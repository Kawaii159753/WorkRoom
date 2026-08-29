# WorkRoom (Fullstack Monorepo Architecture)

WorkRoom เป็นเว็บแอปพลิเคชันสำหรับการรวบรวมไอเดีย ทำงานร่วมกันแบบเรียลไทม์ (Real-time Spatial Canvas) และจัดการกระบวนการอนุมัติงาน (Workflow Pipeline) 
โปรเจกต์นี้ถูกออกแบบและจัดระเบียบตามมาตรฐาน **Senior Fullstack Monorepo Architecture** โดยแยกสัดส่วนระหว่าง Frontend, Backend, Database และ Secrets Vault อย่างชัดเจน

---

## 📁 โครงสร้างโปรเจกต์ (Monorepo Structure)

```text
WorkRoom-main/
├── 🎨 frontend/             # ส่วนหน้าบ้าน (Single Page Application)
│   ├── js/
│   │   ├── api.js           # 🌐 REST API & Socket.IO Realtime Client
│   │   ├── app.js           # 🧭 App Router & Custom Magnetic Cursor Engine
│   │   ├── auth.js          # 🔐 Authentication Controller (Google/Facebook/Email)
│   │   ├── bento.js         # 🎬 GSAP 2.5D Scroll Animation & Lenis Smooth Scroll
│   │   ├── i18n.js          # 🌍 Bilingual Translation Dictionary (TH/EN)
│   │   ├── workroom.js      # 🚀 Master Architecture Registry
│   │   └── modules/         # 📦 10 Domain Modules (แยกหน้าที่ชัดเจน)
│   │       ├── state.js     # 🧠 Central Reactive Store & LocalStorage / Server Sync
│   │       ├── rooms.js     # 🚪 Room & Section Management (CRUD, Privacy, D&D)
│   │       ├── team.js      # 👥 Workspace Switcher, Members & RBAC Roles
│   │       ├── notifications.js # 🔔 Notification Center & Badge Alerts
│   │       ├── modals.js    # 🪟 Modals, Dialogs, Settings, Account & Toasts
│   │       ├── comments.js  # 💬 Mention Engine (@user) & Threaded Discussions
│   │       ├── search.js    # 🔍 Universal Workspace Search
│   │       ├── editor.js    # 📝 Document Editor, Blocks Rendering & Slash Menu (/)
│   │       ├── whiteboard.js # 🎨 Whiteboard Canvas Engine & Drawing Tools
│   │       └── workflows.js # 📊 Task Pipelines, Post-its, My Tasks & Templates
│   ├── css/                 # 🎨 สไตล์ชีตทั้งหมด (base, bento, workroom, pages)
│   ├── assets/              # 🖼️ รูปภาพและไอคอน SVG
│   └── index.html           # 📄 ทางเข้าหลักของหน้าเว็บ (SPA Entrypoint)
│
├── ⚙️ backend/              # ส่วนหลังบ้าน (Node.js, Express, TypeScript, Prisma, Socket.IO)
│   ├── src/
│   │   ├── server.ts        # Bootstrap Express HTTP Server & Socket.IO
│   │   ├── app.ts           # App Config, Helmet, CORS, RateLimiter, Routes
│   │   ├── modules/         # Modular Domain Controllers (auth, workspaces, rooms, workflows, etc.)
│   │   ├── middleware/      # Auth JWT, RBAC Role Checking, Zod Validation, Error Handler
│   │   └── config/          # Prisma Singleton & Auto-load Environment Config
│   ├── prisma/
│   │   ├── schema.prisma    # PostgreSQL Relational Schema (14 ตารางหลัก)
│   │   └── seed.ts          # Demo Data Seeder (demo@workroom.io, My First Team)
│   └── secrets/             # 🔐 โฟลเดอร์เก็บรหัสผ่านโดยเฉพาะ (Ignored in Git)
│       ├── database.env     # Supabase Connection Strings & Keys
│       ├── auth.env         # JWT Secrets & Cookie Secret
│       ├── app.env          # Server Port & Runtime URLs
│       └── README.md        # คู่มือการจัดการรหัสความปลอดภัย
│
├── 📊 Diagram/              # เอกสารและผังภาพสถาปัตยกรรมระบบ (Interactive Architecture Canvas)
│   ├── Diagram.html         # High-resolution Interactive System Diagram (เปิดดูบน Browser)
│   └── README.md            # คู่มือการใช้งาน Diagram
│
└── .gitignore               # ป้องกันการ Commit ข้อมูลความลับและไฟล์ที่ไม่จำเป็นขึ้น Git
```

---

## 🚀 การเริ่มต้นใช้งาน (Getting Started)

### 1. ฝั่ง Backend (API & Realtime WebSocket)
เซิร์ฟเวอร์รันบน **Node.js (TypeScript)** และเชื่อมต่อฐานข้อมูล **Supabase PostgreSQL**:

```powershell
# 1. เข้าโฟลเดอร์ backend
cd d:\Dev\TeChin\backend

# 2. ติดตั้ง Dependencies
npm install

# 3. ซิงก์ Schema ขึ้นฐานข้อมูล
npm run db:push

# หากเป็นฐานข้อมูลทดสอบที่แยกจาก production เท่านั้น:
$env:ALLOW_DEMO_SEED='true'; npm run db:seed

# 4. เริ่มต้นเซิร์ฟเวอร์ในโหมด Development (พอร์ต 4000)
npm run dev
```

- **Health Check API**: `http://localhost:4000/health`
- **REST API Base URL**: `http://localhost:4000/api/v1`
- **Realtime Socket**: `ws://localhost:4000`

---

### 2. ฝั่ง Frontend (Web Application)
หน้าเว็บเป็นแบบ Single Page Application (SPA) ที่แยกโค้ดเป็นโมดูลย่อยเรียบร้อยแล้ว:

> [!IMPORTANT]
> **การเปิดหน้าเว็บ:** 
> ให้คลิกขวาที่ไฟล์ **[`frontend/index.html`](./frontend/index.html)** แล้วเลือก **"Open with Live Server"** บน VS Code
> *(ห้ามเปิด Live Server จากโฟลเดอร์ Root)*

---

## 🔐 ข้อมูลผู้ใช้ทดสอบเริ่มต้น (Seed Accounts)

คำสั่ง seed ถูกปิดไว้โดยค่าเริ่มต้นเพื่อป้องกันบัญชีรหัสผ่านคงที่หลุดเข้า production หากตั้ง `ALLOW_DEMO_SEED=true` บนฐานข้อมูลทดสอบที่แยกออกมา จะมีบัญชีต่อไปนี้:

| Email | Password | Role | รายละเอียด |
|---|---|---|---|
| `demo@workroom.io` | `Password123!` | `OWNER` | บัญชีผู้ดูแลหลัก (สร้างห้อง จัดการสมาชิก และสิทธิ์ทั้งหมด) |
| `chets@workroom.io` | `Password123!` | `EDITOR` | บัญชีสมาชิกทีม (สร้างและแก้ไขเนื้อหาในห้องที่ได้รับสิทธิ์) |

---

## 🏛️ สถาปัตยกรรมความปลอดภัย (Security & Zero-Trust)

1. **Secrets Vault Isolation**: เก็บรหัสผ่านและคีย์ใน environment variables หรือ [`backend/secrets/`](./backend/secrets/) และห้าม commit ไฟล์ดังกล่าวขึ้น Git
2. **Password Hashing**: รหัสผ่านของผู้ใช้ถูกแฮชด้วย **Argon2id** (ปลอดภัยกว่า bcrypt มาตรฐาน)
3. **Session Management**: ใช้ JWT Token ร่วมกับ **HttpOnly Cookie** เพื่อป้องกันการโจมตีประเภท XSS
4. **Server-side RBAC**: ตรวจสอบสิทธิ์ `OWNER`, `EDITOR`, `VIEWER` ในระดับ Server-side ทุก Request
5. **Data Protection**: ใช้ Prisma query API และ Zod validation เพื่อลดความเสี่ยง SQL injection และ malformed input โดยยังต้อง review raw query และ authorization ทุก endpoint

---

## 🧑‍💻 งานที่ผู้พัฒนา Backend ต้องดำเนินการ

ส่วนนี้เป็นเอกสารส่งต่องานให้ผู้รับผิดชอบหลังบ้าน โปรดอัปเดต README ทุกครั้งที่ API, schema, authentication หรือขั้นตอน deploy เปลี่ยนแปลง

### P0 — ต้องเสร็จก่อนเปิดใช้งานกับข้อมูลจริง

#### 1. จัดเตรียม Backend และฐานข้อมูล Production

- Deploy `backend/` บนบริการที่รองรับ Node.js และ WebSocket เช่น Render, Railway, Fly.io หรือ VPS
- ใช้ PostgreSQL Production แยกจากฐานข้อมูล Development
- รัน migration ด้วย `npm run db:migrate:deploy` ห้ามใช้ `db:push` กับ Production
- ตั้งค่า HTTPS ทั้ง Frontend, API และ Socket.IO
- เชื่อม `/api/v1` และ Socket.IO จากโดเมน Frontend ไปยัง Backend จริง ปัจจุบัน Frontend คาดหวัง API ที่ origin เดียวกันเมื่อไม่ใช่ localhost
- ตั้ง health check ไปที่ `GET /health`

Environment variables ที่จำเป็น:

```env
NODE_ENV=production
PORT=4000
CLIENT_URL=https://ชื่อโดเมนจริง.example
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=สุ่มอย่างน้อย-32-ตัวอักษร
COOKIE_SECRET=สุ่มคนละค่ากับ-JWT_SECRET
JWT_EXPIRES_IN=7d
ALLOW_DEMO_SEED=false
```

ข้อกำหนดสำคัญ:

- `CLIENT_URL` ต้องเป็น HTTPS origin แบบตรงตัว ไม่มี path และระบุหลาย origin โดยคั่นด้วย comma ได้
- ห้ามใช้ค่าตัวอย่างจาก `.env.example` ใน Production
- ห้ามเปิด `ALLOW_DEMO_SEED=true` กับฐานข้อมูล Production หรือฐานข้อมูลที่แชร์กัน
- ห้ามส่ง secret, JWT หรือ connection string ไปที่ Frontend

#### 2. เปลี่ยน Workspace State ให้บันทึกแยกตามห้อง

Frontend รุ่นเดิมส่งข้อมูลหลายห้องรวมกันใน JSON ก้อนเดียวผ่าน:

- `GET /api/v1/workspaces/:workspaceId/state`
- `PUT /api/v1/workspaces/:workspaceId/state`

เพื่อป้องกันข้อมูลห้อง Private รั่ว ระบบปัจจุบันกรองข้อมูลสำหรับสมาชิกที่ไม่ใช่ Owner และอนุญาตให้เฉพาะ Owner เขียน JSON ก้อนนี้ ดังนั้น Editor ยังไม่สามารถบันทึก cloud state รวมได้อย่างปลอดภัย

ผู้พัฒนา Backend ต้อง:

1. ย้าย document, page, post-it, whiteboard และ workflow ไปเก็บตาม `roomId`
2. ตรวจ `assertRoomAccess()` ทุกครั้งก่อนอ่านข้อมูลห้อง
3. ตรวจสิทธิ์แก้ไขแยกจากสิทธิ์ดู โดยใช้ Owner/Editor หรือ `RoomPermission.canEdit`
4. ห้ามรับ `workspaceId`, `roomId` หรือ `userId` จาก client แล้วเชื่อถือทันที ต้องตรวจความสัมพันธ์ในฐานข้อมูล
5. ใช้ optimistic concurrency ด้วย `version` เพื่อป้องกันอุปกรณ์สองเครื่องเขียนทับกัน
6. เพิ่ม integration test ว่าสมาชิกที่ไม่มีสิทธิ์ไม่สามารถอ่านหรือแก้ห้อง Private ได้

เมื่อ API แบบแยกห้องพร้อมแล้ว จึงค่อยเปลี่ยน Frontend จาก `WorkRoomCloud.saveState()` ไปใช้ endpoint รายห้อง และยกเลิก legacy whole-workspace state

#### 3. ทำ Social Login ฝั่ง Server

ปุ่ม Google/Facebook ถูกซ่อนไว้ชั่วคราว เพราะห้ามเชื่อถือชื่อ อีเมล หรือ token ที่ถอดรหัสจาก browser โดยไม่ตรวจลายเซ็น

ก่อนเปิดปุ่ม Social Login ต้องมีขั้นตอนต่อไปนี้:

1. Frontend รับ authorization code หรือ provider credential
2. ส่ง credential ไป Backend ผ่าน HTTPS
3. Backend ตรวจ signature, issuer, audience, expiry และ nonce กับ Google/Facebook
4. Backend เชื่อม provider account กับ `User` ในฐานข้อมูล
5. Backend สร้าง session cookie แบบ `HttpOnly`, `Secure` และกำหนด `SameSite` ให้ตรงกับรูปแบบ deployment
6. เพิ่ม test สำหรับ token ปลอม, token หมดอายุ, audience ผิด และ account linking ซ้ำ

ห้ามนำ `completeLogin()` มาใช้กับข้อมูล Social Login ที่ไม่มี `user.id` จาก Backend

#### 4. เพิ่ม Session Management ที่ยกเลิกได้

JWT ปัจจุบันหมดอายุตาม `JWT_EXPIRES_IN` แต่ยังไม่มี server-side revocation ผู้พัฒนา Backend ควรเพิ่ม:

- ตาราง `Session` หรือ refresh-token rotation
- เก็บ token แบบ hash ไม่เก็บ token plaintext
- Logout เครื่องปัจจุบันและ Logout ทุกอุปกรณ์
- ยกเลิก session เมื่อเปลี่ยนรหัสผ่าน ลบบัญชี หรือพบพฤติกรรมผิดปกติ
- จำกัดจำนวน session ต่อบัญชีและบันทึก `createdAt`, `lastUsedAt`, device label โดยไม่บันทึกข้อมูลเกินความจำเป็น

### P1 — ต้องทำก่อนเปิด Public Beta

#### 5. สร้าง API ที่หน้า Frontend แสดงไว้ให้ทำงานจริง

ตรวจและเชื่อมฟังก์ชันต่อไปนี้กับฐานข้อมูลจริง ห้ามให้ UI สำเร็จเฉพาะใน `localStorage`:

- สร้าง แก้ไข ลบ และเรียงลำดับห้อง/หัวข้อ
- Page และ block editor
- Post-it ส่วนตัวและ Post-it ทีม
- Whiteboard strokes
- สมาชิก คำเชิญ และสิทธิ์รายห้อง
- Workflow, My tasks, due date และ assignee
- Comments, replies, mentions และ notifications
- Search โดยต้องค้นเฉพาะข้อมูลที่ผู้ใช้มีสิทธิ์เห็น
- Account settings, เปลี่ยนรูป และลบบัญชี

ทุก mutating endpoint ต้องมี Zod schema, authentication, server-side authorization, body-size limit และ test สำหรับ IDOR/BOLA

#### 6. File Upload

- ใช้ object storage แยกจาก API server
- Allowlist MIME type และตรวจ magic bytes ไม่เชื่อเฉพาะนามสกุลหรือ `Content-Type`
- จำกัดขนาด จำนวนไฟล์ และอัตราการอัปโหลด
- สุ่ม storage key ฝั่ง Server ห้ามใช้ชื่อไฟล์ผู้ใช้เป็น path
- ป้องกัน path traversal และห้ามเสิร์ฟไฟล์อัปโหลดจาก origin ที่สามารถรัน script ได้
- ใช้ signed URL สำหรับไฟล์ Private และตรวจสิทธิ์ก่อนออก URL
- พิจารณาสแกน malware ก่อนเผยแพร่ไฟล์ให้สมาชิกคนอื่น

#### 7. Desktop Installer

ไฟล์ `.exe` และ `.dmg` ตัวอย่างเดิมไม่ใช่ installer จริง ระบบจึงไม่แจกไฟล์เหล่านั้นแล้ว ก่อนเปิดดาวน์โหลดต้อง:

- Build installer จริงจาก source ที่ตรวจสอบได้
- Code-sign Windows installer และ notarize แอป macOS
- สร้าง SHA-256 checksum และเก็บ artifact แบบ versioned
- ตั้ง URL ใน `window.WORKROOM_CONFIG.downloads.windows` และ `.mac`
- ทดสอบว่า URL ใช้ HTTPS และไม่ redirect ไปโดเมนที่ไม่ควบคุม

### P2 — Security hardening ระยะถัดไป

- เปลี่ยน inline `onclick` ทั้งหมดเป็น `addEventListener()` แล้วนำ `script-src-attr 'unsafe-inline'` ออกจาก CSP
- ลดการใช้ `localStorage`; ห้ามเก็บ password, access token, private key หรือข้อมูลลับใน browser storage
- ย้าย recovery copy ที่มีเนื้อหางานไปเก็บแบบเข้ารหัสฝั่ง Server หรือทำ offline encryption ด้วยกุญแจที่ไม่ได้ฝังใน JavaScript
- Proxy หรือจัดเก็บ avatar/image ใน storage ที่ควบคุมเอง เพื่อลดการติดตามผู้ใช้ผ่านรูปจากโดเมนภายนอก
- เพิ่ม audit log สำหรับการเปลี่ยน role, สิทธิ์ห้อง, login, logout และการลบข้อมูล
- ตั้ง upstream rate limit/WAF และ monitoring โดยไม่บันทึก password, cookie หรือ Authorization header
- เพิ่ม backup/restore drill และกำหนด retention policy

---

## 🔌 API Contract ที่ Frontend ใช้อยู่

| Method | Endpoint | สิทธิ์ขั้นต่ำ | หน้าที่ |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public + rate limit | สมัครบัญชีและตั้ง session cookie |
| `POST` | `/api/v1/auth/login` | Public + rate limit | เข้าสู่ระบบ |
| `POST` | `/api/v1/auth/logout` | Cookie origin check | ล้าง session cookie |
| `GET` | `/api/v1/auth/me` | Authenticated | คืนข้อมูลบัญชีปัจจุบัน |
| `GET/POST` | `/api/v1/workspaces` | Authenticated | รายการ/สร้าง workspace |
| `GET` | `/api/v1/workspaces/:workspaceId` | Member | รายละเอียด workspace และห้องที่มองเห็น |
| `GET` | `/api/v1/workspaces/:workspaceId/state` | Member | อ่าน legacy state ที่กรองตามสิทธิ์ |
| `PUT` | `/api/v1/workspaces/:workspaceId/state` | Owner | บันทึก legacy state รวม |
| `POST` | `/api/v1/rooms` | Owner/Editor | สร้างห้อง |
| `GET` | `/api/v1/rooms/:roomId` | ผู้มีสิทธิ์ในห้อง | อ่านห้องและเนื้อหา |
| `GET/POST/PATCH` | `/api/v1/workflows` | ตาม route และ workspace role | งานและสถานะ |
| `GET/POST/PATCH` | `/api/v1/comments` | Workspace member; resolve มีข้อจำกัดเพิ่ม | ความคิดเห็นและ mention |
| `GET/POST/PATCH` | `/api/v1/notifications` | เจ้าของ notification | การแจ้งเตือน |

รูปแบบ response สำเร็จ:

```json
{ "success": true, "data": {} }
```

รูปแบบ error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters or request body",
    "fieldErrors": {}
  }
}
```

---

## ✅ Definition of Done สำหรับงาน Backend

ก่อนส่งงานทุกครั้งต้องผ่านรายการต่อไปนี้:

```powershell
cd backend
npm audit
npm test
npm run build
```

- ไม่มี TypeScript build error
- Unit และ integration tests ผ่าน
- Dependency audit ไม่มีช่องโหว่ High/Critical ที่ยังไม่ได้ประเมินและบันทึกเหตุผล
- Endpoint ใหม่มี validation, authentication และ authorization test
- ทดสอบ Owner, Editor, Viewer และผู้ใช้ที่ไม่ใช่สมาชิก
- ทดสอบ malformed input, UUID ผิด, payload เกินขนาด, request ซ้ำ และ concurrency conflict
- ไม่ส่ง password hash, cookie, JWT, database error หรือ stack trace กลับ Frontend
- อัปเดต Prisma migration, `.env.example`, API contract และ README
- ระบุ breaking change และขั้นตอน rollback
- ตรวจว่า Frontend ใช้งานได้ทั้ง Desktop และ Mobile หลังเชื่อม API

---

## 📊 ผังสถาปัตยกรรมระบบ (Architecture Canvas)
คุณสามารถเปิดไฟล์ **[`Diagram/Diagram.html`](./Diagram/Diagram.html)** บนเว็บเบราว์เซอร์ เพื่อดูผังการไหลของข้อมูล ลำดับชั้นคอมโพเนนต์ และโมเดลฐานข้อมูลแบบอินเทอร์แอคทีฟความละเอียดสูงได้ตลอดเวลาครับ
