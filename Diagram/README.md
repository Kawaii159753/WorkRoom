# WorkRoom Architecture Diagrams

โฟลเดอร์สำหรับจัดเก็บผังสถาปัตยกรรมและโครงสร้างโค้ด (Fullstack Architecture & Design System Diagrams) ของโปรเจกต์ **WorkRoom (TeChin)**

## 📂 ไฟล์ในโฟลเดอร์นี้

- **[`Diagram.html`](file:///d:/Dev/TeChin/Diagram/Diagram.html)**: Interactive Visual Architecture Canvas (v3.2.0 Fullstack Monorepo) ประกอบด้วยผังงานสำคัญ:
  1. `Fullstack Monorepo High-Level Topology` (การเชื่อมโยง Client SPA, API Server, Secrets Vault, และ Supabase PostgreSQL)
  2. `Frontend Modular Architecture (frontend/js/modules/)` (ผังแสดง 10 Domain Modules ที่แยกหน้าที่กันอย่างชัดเจน)
  3. `Secrets Vault & Security Architecture (backend/secrets/)` (สถาปัตยกรรมการเก็บรหัสผ่านแยกตามประเภท database.env, auth.env, app.env พร้อมระบบ Auto-Loading)
  4. `Database Schema & Relational Models (Prisma + Supabase)` (ผังโครงสร้างตารางข้อมูล PostgreSQL 14 ตารางหลัก)

## 🚀 วิธีเปิดใช้งาน
คุณสามารถดับเบิลคลิกเปิดไฟล์ `Diagram.html` บนเว็บเบราว์เซอร์ใดก็ได้ (Chrome, Edge, Safari, Firefox) เพื่อดูผังโครงสร้างสถาปัตยกรรมระดับ High-resolution
