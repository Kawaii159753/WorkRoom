# WorkRoom (Fullstack Monorepo Architecture)

WorkRoom เป็นเว็บแอปพลิเคชันสำหรับการรวบรวมไอเดีย ทำงานร่วมกันแบบเรียลไทม์ (Real-time Spatial Canvas) และจัดการกระบวนการอนุมัติงาน (Workflow Pipeline) 
โปรเจกต์นี้ถูกออกแบบและจัดระเบียบตามมาตรฐาน **Senior Fullstack Monorepo Architecture** โดยแยกสัดส่วนระหว่าง Frontend, Backend, Database และ Secrets Vault อย่างชัดเจน

---

## 📁 โครงสร้างโปรเจกต์ (Monorepo Structure)

```text
d:\Dev\TeChin/
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

# 3. ซิงก์ Schema ขึ้น Supabase และใส่ข้อมูลทดสอบ
npm run db:push
npm run db:seed

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

หลังรันคำสั่ง `npm run db:seed` บนฐานข้อมูล Supabase จะมีบัญชีทดสอบพร้อมล็อกอินทันที:

| Email | Password | Role | รายละเอียด |
|---|---|---|---|
| `demo@workroom.io` | `Password123!` | `OWNER` | บัญชีผู้ดูแลหลัก (สร้างห้อง จัดการสมาชิก และสิทธิ์ทั้งหมด) |
| `chets@workroom.io` | `Password123!` | `EDITOR` | บัญชีสมาชิกทีม (สร้างและแก้ไขเนื้อหาในห้องที่ได้รับสิทธิ์) |

---

## 🏛️ สถาปัตยกรรมความปลอดภัย (Security & Zero-Trust)

1. **Secrets Vault Isolation**: รหัสผ่านและคีย์ทั้งหมดถูกแยกเก็บใน [`backend/secrets/`](./backend/secrets/) พร้อมติด [`.gitignore`](./.gitignore) ป้องกันการรั่วไหลขึ้น Git 100%
2. **Password Hashing**: รหัสผ่านของผู้ใช้ถูกแฮชด้วย **Argon2id** (ปลอดภัยกว่า bcrypt มาตรฐาน)
3. **Session Management**: ใช้ JWT Token ร่วมกับ **HttpOnly Cookie** เพื่อป้องกันการโจมตีประเภท XSS
4. **Server-side RBAC**: ตรวจสอบสิทธิ์ `OWNER`, `EDITOR`, `VIEWER` ในระดับ Server-side ทุก Request
5. **Data Protection**: Prisma Query ป้องกัน SQL Injection 100% และ Zod ตรวจสอบ Request Payload ก่อนเข้าถึง Controller

---

## 📊 ผังสถาปัตยกรรมระบบ (Architecture Canvas)
คุณสามารถเปิดไฟล์ **[`Diagram/Diagram.html`](./Diagram/Diagram.html)** บนเว็บเบราว์เซอร์ เพื่อดูผังการไหลของข้อมูล ลำดับชั้นคอมโพเนนต์ และโมเดลฐานข้อมูลแบบอินเทอร์แอคทีฟความละเอียดสูงได้ตลอดเวลาครับ
