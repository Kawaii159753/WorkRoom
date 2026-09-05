# WorkRoom 🚀

WorkRoom เป็นแพลตฟอร์มสำหรับการรวบรวมไอเดีย ทำงานร่วมกันแบบเรียลไทม์ (Real-time Spatial Canvas) และจัดการกระบวนการทำงาน (Workflow Pipeline) พัฒนาด้วยสถาปัตยกรรม Fullstack Monorepo ที่แยกส่วน Frontend, Backend และ Secrets Vault ออกจากกันอย่างเป็นระบบ

---

## 📁 โครงสร้างโปรเจกต์ (Monorepo Structure)

```text
WorkRoom/
├── 🎨 frontend/        # Single Page Application (HTML, Vanilla CSS, JS Modules)
│   ├── js/             # Router, Realtime Client, Domain Modules (rooms, team, editor...)
│   ├── css/            # Bento Design System, Theme & Layout
│   └── index.html      # ทางเข้าหลักของ Web Application
│
├── ⚙️ backend/         # REST API & Realtime Server (Node.js, TypeScript, Express, Socket.IO)
│   ├── src/            # Controllers, RBAC Middleware, RoomState OCC, Socket Handlers
│   ├── prisma/         # PostgreSQL Schema & Seeder
│   └── secrets/        # 🔐 Secrets Vault จัดเก็บรหัสความปลอดภัย (Ignored in Git)
│
├── 📊 Diagram/         # Interactive Architecture Canvas (เปิดดูผ่าน Browser)
└── .gitignore          # ป้องกันการ Commit ข้อมูลความลับและ dependencies ขึ้น Git
```

---

## 🚀 การเริ่มต้นใช้งาน (Quick Start)

### 1. ฝั่ง Backend (API & Realtime WebSocket)
```powershell
cd backend
npm install

# ตั้งค่า Credentials (คัดลอก template ใน backend/secrets/ ไปเป็น .env)
# ดูรายละเอียดเพิ่มเติมได้ใน backend/secrets/README.md

npm run db:push     # ซิงก์ Schema ฐานข้อมูล
npm run dev         # เริ่มต้นเซิร์ฟเวอร์ Development (พอร์ต 4000)
```
- **Health Check**: `http://localhost:4000/health`
- **REST API Base URL**: `http://localhost:4000/api/v1`
- **คู่มือระบบ Backend เพิ่มเติม**: อ่านได้ที่ [`backend/README.md`](./backend/README.md)

### 2. ฝั่ง Frontend (Web Application)
- เปิดไฟล์ [`frontend/index.html`](./frontend/index.html) ด้วย **Live Server** บน VS Code
- เซิร์ฟเวอร์จะเชื่อมต่อไปยัง Backend API ที่พอร์ต 4000 อัตโนมัติ

---

## 🔐 ข้อมูลความปลอดภัยและ Secrets Vault

- ข้อมูลความลับทั้งหมดถูกจัดเก็บแยกไว้ใน [`backend/secrets/`](./backend/secrets/) และถูกบล็อกไม่ให้ขึ้น Git 100%
- มีไฟล์ Template ตัวอย่างสำหรับการตั้งค่า:
  - `backend/secrets/database.example.env` (การเชื่อมต่อ Supabase PostgreSQL)
  - `backend/secrets/auth.example.env` (JWT & Cookie Secrets)
  - `backend/secrets/app.example.env` (Port & CORS Origin)
  - `backend/.env.example` (Template รวม)
- ดูคู่มือการจัดการ Secrets ได้ที่ [`backend/secrets/README.md`](./backend/secrets/README.md)

---

## 📊 ผังสถาปัตยกรรมระบบ (Architecture Canvas)

เปิดไฟล์ **[`Diagram/Diagram.html`](./Diagram/Diagram.html)** บนเว็บเบราว์เซอร์ เพื่อดูผังการไหลของข้อมูล ลำดับชั้นคอมโพเนนต์ และโมเดลฐานข้อมูลแบบอินเทอร์แอคทีฟ
