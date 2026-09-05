# WorkRoom Architecture Diagrams 📊

โฟลเดอร์สำหรับจัดเก็บผังสถาปัตยกรรมและโครงสร้างโค้ด (Fullstack Architecture & Design System Diagrams) ของโปรเจกต์ **WorkRoom (TeChin)**

---

## 📂 ไฟล์ในโฟลเดอร์นี้

- **[`Diagram.html`](./Diagram.html)**: Interactive Visual Architecture Canvas (v3.3.0 Fullstack Monorepo) ประกอบด้วยผังงาน 5 ส่วนหลัก:
  1. **Fullstack Monorepo High-Level Topology**: การเชื่อมโยง Client SPA, Cloud Persistence Engine, Express API Server, Secrets Vault, และ Supabase PostgreSQL Pooler
  2. **Frontend Modular Architecture (`frontend/js/modules/`)**: ผังแสดง 10 Domain Modules + `cloud-storage.js`, `api.js`, และ `app.js` Live Cursor Engine
  3. **Secrets Vault & Security Architecture (`backend/secrets/`)**: สถาปัตยกรรมการเก็บรหัสผ่านแยกตามประเภท พร้อมระบบ Template (`*.example.env`) และ `WORKROOM_SECRETS_DIR` Auto-Discovery
  4. **Database Schema & Relational Models (Prisma + Supabase)**: ผังโครงสร้างตารางข้อมูล PostgreSQL 17 ตารางหลัก รวมถึง `RoomState` (OCC Engine)
  5. **Real-time Collaboration & Concurrency Engine**: การทำงานประสานกันผ่าน Socket.IO (Room Channels, 30 FPS Live Cursors) และ Optimistic Concurrency Control ป้องกัน Lost Update

---

## 🚀 วิธีเปิดใช้งาน

ดับเบิลคลิกเปิดไฟล์ **[`Diagram.html`](./Diagram.html)** บนเว็บเบราว์เซอร์ (Chrome, Edge, Safari, Firefox) เพื่อดูผังโครงสร้างสถาปัตยกรรมระดับ High-resolution พร้อมแถบ Navigation สำหรับคลิกเลื่อนไปยังส่วนต่างๆ ได้ทันที
