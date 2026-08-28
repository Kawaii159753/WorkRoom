# WorkRoom Backend (Node.js + TypeScript + PostgreSQL + Socket.IO)

Backend service สำหรับระบบ **WorkRoom** ออกแบบด้วยสถาปัตยกรรม **Modular Clean Architecture**, **RBAC Security**, **Relational Schema (Prisma)** และ **Realtime Collaboration (Socket.IO)**

---

##  Tech Stack & Architecture

- **Runtime & Language**: Node.js, TypeScript (ES2022)
- **Framework**: Express.js
- **Database & ORM**: PostgreSQL 16 + Prisma ORM
- **Realtime**: Socket.IO (Room-based channels, Presence, Live cursor, Entity sync)
- **Authentication**: JWT (HttpOnly Cookie / Bearer Token) + Argon2id Password Hashing
- **Validation**: Zod (Type-safe request body, query, params validation)
- **Security**: Helmet, CORS, Rate Limiting (`express-rate-limit`)
- **Containers**: Docker & Docker Compose (PostgreSQL, Redis)

---

## 📁 โครงสร้างโปรเจกต์ (`backend/`)

```text
backend/
├── docker-compose.yml          # Local PostgreSQL & Redis containers
├── package.json
├── tsconfig.json
├── .env.example
├── prisma/
│   ├── schema.prisma           # Relational schema (Users, Workspaces, Workflows, Comments...)
│   └── seed.ts                 # Database seed data
└── src/
    ├── server.ts               # HTTP & Socket.IO bootstrap with graceful shutdown
    ├── app.ts                  # Express application setup, middlewares & routers
    ├── config/                 # Zod env configuration & Prisma client
    ├── constants/              # Roles (OWNER, EDITOR, VIEWER), Statuses, Error codes
    ├── types/                  # TypeScript interfaces & AuthenticatedRequest
    ├── middleware/             # Auth, Workspace RBAC, Zod Validation, RateLimiter, ErrorHandler
    ├── modules/                # Domain-driven feature modules:
    │   ├── auth/               # Register, Login, Logout, /me
    │   ├── workspaces/         # Workspace CRUD, Member management, Role updates
    │   ├── rooms/              # Sections, Rooms, Canvas & Pages
    │   ├── workflows/          # Workflows (Review, Revision, Approved), Assignees
    │   ├── comments/           # Threaded Comments, Mentions, Resolve/Reopen
    │   └── notifications/      # Notifications list & Mark-as-read
    ├── realtime/               # Socket.IO handlers, Workspace rooms, Presence & Cursor sync
    └── utils/                  # Standardized response formatters & Logger
```

---

## 🚀 ขั้นตอนการเริ่มต้นใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
cd backend
npm install
```

### 2. ตั้งค่า Environment Variables
คัดลอก `.env.example` ไปเป็น `.env`:
```bash
cp .env.example .env
```

### 3. เริ่มต้น Database (Docker Compose)
รัน PostgreSQL และ Redis บนเครื่องของคุณ:
```bash
docker compose up -d
```

หากไม่มี Docker สามารถใช้ local PostgreSQL ที่มากับ Prisma ได้:
```bash
npm run db:local:start
```
จากนั้นคัดลอก TCP URL ที่แสดงไปใส่ `DATABASE_URL` และ `DIRECT_URL` ใน `.env`

### 4. รัน Database Migration & Seed Data
```bash
# Push schema to database and generate Prisma Client
npm run db:push

# หรือสร้าง migration file
npm run db:migrate

# เพิ่มข้อมูลทดสอบเริ่มต้น (Demo Users, Workspaces, Tasks)
npm run db:seed
```

คำสั่ง seed สามารถรันซ้ำได้โดยไม่สร้างข้อมูลตัวอย่างซ้ำ

> **บัญชีสำหรับทดสอบจาก Seed:**
> - อีเมล: `demo@workroom.io` / รหัสผ่าน: `Password123!` (Role: `OWNER`)
> - อีเมล: `chets@workroom.io` / รหัสผ่าน: `Password123!` (Role: `EDITOR`)

### 5. รันเซิร์ฟเวอร์ในโหมด Development
```bash
npm run dev
```
เซิร์ฟเวอร์จะเริ่มทำงานที่ `http://localhost:4000` (Health Check: `http://localhost:4000/health`)

---

## 🔌 สรุป API Endpoints (v1)

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | สมัครสมาชิกใหม่ (Argon2 hash) | ❌ |
| `POST` | `/api/v1/auth/login` | เข้าสู่ระบบ (รับ JWT ใน HttpOnly Cookie หรือ JSON) | ❌ |
| `POST` | `/api/v1/auth/logout` | ออกจากระบบ (ล้าง Cookie) |  |
| `GET` | `/api/v1/auth/me` | ดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบัน |  |

### Workspaces & Members (`/api/v1/workspaces`)
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/v1/workspaces` | รายชื่อ Workspace ทั้งหมดของผู้ใช้ | Authenticated |
| `POST` | `/api/v1/workspaces` | สร้าง Workspace ใหม่ (ผู้สร้างเป็น `OWNER`) | Authenticated |
| `GET` | `/api/v1/workspaces/:workspaceId` | ดึงข้อมูล Workspace, สมาชิก และห้องทั้งหมด | `OWNER` / `EDITOR` / `VIEWER` |
| `PATCH` | `/api/v1/workspaces/:workspaceId` | แก้ไขข้อมูล Workspace | `OWNER` |
| `POST` | `/api/v1/workspaces/:workspaceId/invites` | เชิญสมาชิกใหม่เข้า Workspace | `OWNER` |
| `PATCH` | `/api/v1/workspaces/:workspaceId/members/:userId` | เปลี่ยน Role สมาชิก (`OWNER`, `EDITOR`, `VIEWER`) | `OWNER` |
| `DELETE` | `/api/v1/workspaces/:workspaceId/members/:userId` | ลบสมาชิกออกจาก Workspace | `OWNER` |

### Rooms & Pages (`/api/v1/rooms`)
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/v1/rooms` | สร้างห้องใหม่ใน Section/Workspace | `OWNER` / `EDITOR` |
| `GET` | `/api/v1/rooms/:roomId` | ดึงข้อมูลห้อง, หน้ากระดาษ (Pages) และ Post-its | Authenticated |

### Workflows & Tasks (`/api/v1/workflows`)
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/v1/workflows?workspaceId=...&assignee=me&status=REVIEW` | กรองและดึงรายการงานตามเงื่อนไข | Authenticated |
| `POST` | `/api/v1/workflows` | สร้าง Workflow ให้กับ Artifact (Post-it / Block) | `OWNER` / `EDITOR` |
| `PATCH` | `/api/v1/workflows/:workflowId` | อัปเดตสถานะ (`REVIEW`, `REVISION`, `APPROVED`), วันครบกำหนด หรือผู้รับผิดชอบ | Authenticated |

### Comments & Mentions (`/api/v1/comments`)
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/v1/comments/workflow/:workflowId` | ดึงรายการ Comment และ Threads ทั้งหมดในงาน | Authenticated |
| `POST` | `/api/v1/comments` | เพิ่ม Comment ใหม่ หรือ Reply Thread (รองรับ Mention) | Authenticated |
| `PATCH` | `/api/v1/comments/:commentId/resolve` | ทำเครื่องหมาย Resolve / Reopen Comment | Authenticated |

### Notifications (`/api/v1/notifications`)
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | ดึงการแจ้งเตือนของผู้ใช้ปัจจุบัน | Authenticated |
| `PATCH` | `/api/v1/notifications/:id/read` | ทำเครื่องหมายอ่านแล้วเฉพาะรายการ | Authenticated |
| `POST` | `/api/v1/notifications/mark-all-read` | ทำเครื่องหมายอ่านแล้วทั้งหมด | Authenticated |

---

## ⚡ Realtime Events (Socket.IO)

เชื่อมต่อ WebSocket ไปที่ `ws://localhost:4000` โดยส่ง JWT ใน Handshake Auth หรือ Cookie:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  withCredentials: true,
  auth: { token: "your-jwt-token" }
});

// เข้าห้อง Workspace
socket.emit("workspace:join", { workspaceId: "workspace-uuid" });

// รับ Event เมื่อสมาชิกคนอื่นเข้าหรือออก
socket.on("presence:user_joined", (data) => console.log("User joined:", data));

// ส่งตำแหน่ง Cursor ของผู้ใช้
socket.emit("cursor:move", { workspaceId: "...", x: 120, y: 350 });

// รับตำแหน่ง Cursor ของสมาชิกคนอื่น
socket.on("cursor:updated", (data) => console.log("Cursor moved:", data));
```

---

## 📋 Roadmap การต่อ Frontend เข้ากับ Backend จริง

1. **สร้าง `js/api.js` ในฝั่ง Frontend**:
   - ทำฟังก์ชัน Wrapper เช่น `apiClient(endpoint, options)` รองรับ Token / Cookie และดักจับ Error Code ตามมาตรฐาน
2. **เปลี่ยนระบบ Auth ใน `js/auth.js`**:
   - เชื่อมฟังก์ชัน `register`, `login`, `logout` และ `checkSession` เข้ากับ `/api/v1/auth/*`
3. **เชื่อม Workspace & Room Data ใน `js/workroom.js`**:
   - เปลี่ยนจากการอ่าน/เขียน `localStorage` มาเรียก `/api/v1/workspaces/:id`
4. **เปิดใช้งาน Realtime Collaboration**:
   - นำ Socket.IO Client เข้ามาต่อใน `js/workroom.js` เพื่อซิงก์ Cursor และการขยับ Post-it แบบ Realtime
