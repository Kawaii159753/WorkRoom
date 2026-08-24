# WorkRoom

WorkRoom เป็นเว็บสำหรับรวบรวมไอเดีย ทำงานร่วมกัน และพางานไปจนถึงขั้นอนุมัติ หน้าเว็บปัจจุบันทำงานเป็นต้นแบบฝั่ง Frontend และเก็บข้อมูลจำลองใน `localStorage` ดังนั้นงานหลักของผู้พัฒนา Backend คือเปลี่ยนข้อมูลจำลองเหล่านี้ให้เป็นข้อมูลจริงที่ปลอดภัย ซิงก์ระหว่างสมาชิก และกู้คืนได้

## สิ่งที่มีใน Frontend แล้ว

- บัญชีผู้ใช้และหน้าเข้าสู่ระบบ
- Workspace และสมาชิกแบบ Owner, Editor, Viewer
- ห้อง หัวข้อห้อง หน้ากระดาษ และบล็อกเนื้อหา
- ไอเดีย โปสต์อิท ไฟล์/ลิงก์ และ Template
- สถานะงาน: `review`, `revision`, `approved`
- ผู้รับผิดชอบหลายคน วันครบกำหนด และหน้า “งานของฉัน”
- คอมเมนต์ การตอบกลับแบบ Thread, Mention และ Resolve/Reopen
- ลิงก์ที่เกี่ยวข้อง Activity log และการแจ้งเตือน
- ภาษาไทย/อังกฤษ ธีม Light/Dark/Playful และ Responsive UI

> ข้อมูลและสิทธิ์ใน Frontend เป็นเพียง Prototype ห้ามเชื่อค่าจาก Browser โดยตรง Backend ต้องตรวจสิทธิ์ทุกคำขอเสมอ

## งาน Backend ที่ต้องทำ

### 1. Authentication

- สมัครสมาชิก เข้าสู่ระบบ ออกจากระบบ และ Refresh session
- Hash รหัสผ่านด้วย Argon2id หรือ bcrypt ห้ามเก็บรหัสผ่านแบบ Plain text
- รองรับลืมรหัสผ่านและยืนยันอีเมล
- ถ้าจะใช้ Google/Facebook ให้ทำ OAuth ที่ Backend และตรวจ `state`/PKCE
- แนะนำใช้ Session cookie แบบ `HttpOnly`, `Secure`, `SameSite=Lax` แทนการเก็บ Token ใน `localStorage`
- Rate limit หน้า Login, Register, Reset password และ Invite

### 2. Workspace และสิทธิ์

- ผู้ใช้หนึ่งคนอยู่ได้หลาย Workspace
- บทบาทที่รองรับ:
  - `owner`: จัดการ Workspace, สมาชิก, ห้อง และงานทั้งหมด
  - `editor`: สร้างและแก้ไขงานตามห้องที่ได้รับสิทธิ์
  - `viewer`: อ่านและคอมเมนต์ได้ แต่แก้เนื้อหา สถานะ หรือผู้รับผิดชอบไม่ได้
- รองรับสิทธิ์รายห้องผ่าน `allowedRoomIds` หรือใช้ตารางเชื่อมที่เทียบเท่า
- การตรวจสิทธิ์ต้องทำฝั่ง Server ทุก Endpoint และทุก Realtime event
- Owner คนสุดท้ายต้องไม่สามารถลบตัวเองหรือออกจาก Workspace โดยไม่มีการโอนสิทธิ์

### 3. ห้องและหน้ากระดาษ

- CRUD สำหรับ Section, Room, Page และ Block
- รองรับการเรียงลำดับด้วย `position` หรือ fractional ordering
- ชื่อห้องต้องไม่เปลี่ยนตามเนื้อหาในกระดาษ
- ชื่อ Page เปลี่ยนตามบรรทัดแรกตามพฤติกรรม Frontend ปัจจุบัน
- โปสต์อิทใช้หัวข้อ H1/H2 แรกเป็นชื่อหลัก และ Workflow ต้องใช้ชื่อเดียวกัน
- ใช้ Optimistic concurrency เช่น `version` หรือ `updatedAt` เพื่อกันการเขียนทับเมื่อหลายคนแก้พร้อมกัน

### 4. Workflow ปิดงาน

ทุกรายการที่เป็น Idea, File, Post-it, Post-it block หรืองานทั่วไปสามารถมี Workflow ได้

```text
review    = รอความเห็น
revision  = กำลังแก้ไข
approved  = อนุมัติแล้ว
```

ข้อมูลขั้นต่ำของ Workflow:

```json
{
  "id": "workflow-id",
  "workspaceId": "workspace-id",
  "artifactType": "postit-block",
  "artifactId": "artifact-id",
  "title": "ชื่อจากหัวข้อของชิ้นงาน",
  "status": "review",
  "dueDate": null,
  "assigneeIds": [],
  "links": [],
  "createdBy": "user-id",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "version": 1
}
```

ข้อกำหนดสำคัญ:

- สถานะรับเฉพาะ `review`, `revision`, `approved`
- เมื่อเป็น `approved` งานจะออกจากรายการหลัก แต่ยังอยู่ในประวัติงานที่เสร็จแล้ว
- บันทึกว่าใครเปลี่ยนสถานะ จากอะไร เป็นอะไร และเมื่อไร
- ผู้รับผิดชอบต้องเป็นสมาชิกที่ยังมีสิทธิ์ใน Workspace/Room นั้น
- วันครบกำหนดควรเก็บเป็นวันที่แบบ `YYYY-MM-DD`; เวลาอื่นเก็บเป็น UTC

### 5. Comments, Threads และ Mention

- Comment ต้องผูกกับ Workflow หรือ Artifact ที่ชัดเจน
- Reply ใช้ `parentCommentId`; แนะนำให้รองรับเพียงหนึ่งระดับตาม UI ปัจจุบัน
- Resolve/Reopen ต้องเก็บ `resolvedAt` และ `resolvedBy`
- Parse Mention ฝั่ง Server จาก User ID ที่ Frontend ส่งมา ห้ามเชื่อเฉพาะข้อความ `@ชื่อ`
- ป้องกัน XSS ด้วยการเก็บข้อความดิบและ Escape/Sanitize ก่อนแสดงผล
- Viewer คอมเมนต์ได้ แต่ห้ามเปลี่ยนสถานะหรือแก้เนื้อหาหลัก

### 6. Notifications

สร้าง Notification เมื่อ:

- มีคน Mention ผู้ใช้
- มีคนคอมเมนต์หรือ Reply งานที่ผู้ใช้เกี่ยวข้อง
- ผู้ใช้ถูก Assign งาน
- งานเปลี่ยนเป็นขอแก้หรืออนุมัติ
- ผู้ใช้ได้รับคำเชิญเข้า Workspace

Notification ควรมี `type`, `actorId`, `recipientId`, `workspaceId`, `artifactId`, `readAt`, `createdAt` และข้อมูลสำหรับเปิดกลับไปยังงานต้นทาง หลีกเลี่ยงการเก็บข้อความแสดงผลภาษาใดภาษาหนึ่ง ให้เก็บชนิดเหตุการณ์แล้วแปลที่ Frontend

### 7. Realtime และการแก้พร้อมกัน

- ใช้ WebSocket, Socket.IO หรือบริการ Realtime ที่ทีมถนัด
- แยก Channel ตาม Workspace และตรวจ Membership ก่อน Subscribe
- Event ขั้นต่ำ: เนื้อหาเปลี่ยน, Workflow เปลี่ยน, Comment ใหม่, Assignment เปลี่ยน, Notification ใหม่, Presence
- ทุก Event ต้องมี `eventId`, `workspaceId`, `entityId`, `version`, `actorId`, `occurredAt`
- Server ต้องเป็น Source of truth; Client ที่ Version เก่าต้อง Reload/Merge ไม่เขียนทับแบบเงียบ ๆ
- Presence เป็นข้อมูลชั่วคราวและไม่ควรใช้แทนสิทธิ์ผู้ใช้

### 8. File upload

- อัปโหลดผ่าน Object storage เช่น S3/R2/Supabase Storage และใช้ Signed URL
- ตรวจชนิดไฟล์จากเนื้อไฟล์จริง ไม่เชื่อ MIME/นามสกุลจาก Browser
- จำกัดขนาดไฟล์และชื่อไฟล์ พร้อมสแกน Malware หากเปิดให้ลูกค้าอัปโหลด
- เก็บ Metadata: เจ้าของ, Workspace, ขนาด, MIME, Storage key, checksum และเวลาสร้าง
- ผู้ใช้ต้องผ่าน Permission check ก่อนดาวน์โหลด ดูตัวอย่าง หรือลบไฟล์
- ลบแบบ Soft delete ก่อน และมีงานเบื้องหลังลบไฟล์จริงภายหลัง

## โครงสร้างฐานข้อมูลที่แนะนำ

อย่างน้อยควรมีตาราง/Collection ต่อไปนี้:

- `users`
- `sessions` หรือ `refresh_tokens`
- `workspaces`
- `workspace_members`
- `sections`
- `rooms`
- `room_members` หรือ `room_permissions`
- `pages`
- `blocks`
- `postits`
- `workflows`
- `workflow_assignees`
- `comments`
- `workflow_links`
- `activity_logs`
- `notifications`
- `files`

ทุกข้อมูลของงานควรมี `workspace_id` เพื่อป้องกันข้อมูลข้าม Workspace และช่วยทำ Index/Query ได้เร็ว ควรมี Foreign key, Unique constraint และ Index สำหรับ `workspace_id`, `room_id`, `assignee_id`, `status`, `due_date`, `created_at`

## API ขั้นต่ำที่ Frontend ต้องใช้

ชื่อ Route ปรับตาม Framework ได้ แต่ความสามารถต้องครบ:

```text
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me

GET    /workspaces
POST   /workspaces
GET    /workspaces/:workspaceId
PATCH  /workspaces/:workspaceId

GET    /workspaces/:workspaceId/members
POST   /workspaces/:workspaceId/invites
PATCH  /workspaces/:workspaceId/members/:userId
DELETE /workspaces/:workspaceId/members/:userId

GET    /workspaces/:workspaceId/rooms
POST   /workspaces/:workspaceId/rooms
PATCH  /rooms/:roomId
DELETE /rooms/:roomId

GET    /rooms/:roomId/pages
POST   /rooms/:roomId/pages
PATCH  /pages/:pageId
DELETE /pages/:pageId
PUT    /pages/:pageId/blocks

GET    /workspaces/:workspaceId/tasks?assignee=me&status=review
POST   /artifacts/:artifactType/:artifactId/workflow
PATCH  /workflows/:workflowId
PUT    /workflows/:workflowId/assignees

GET    /workflows/:workflowId/comments
POST   /workflows/:workflowId/comments
POST   /comments/:commentId/replies
PATCH  /comments/:commentId/resolution

GET    /notifications
PATCH  /notifications/:notificationId/read
POST   /files/upload-url
```

API ต้องตอบ Error รูปแบบเดียวกัน เช่น:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to update this task",
    "fieldErrors": {}
  }
}
```

## การเชื่อม Frontend ปัจจุบัน

จุดที่ต้องค่อย ๆ เปลี่ยนจาก `localStorage` เป็น API อยู่ใน:

- `js/auth.js`: บัญชีและสถานะเข้าสู่ระบบจำลอง
- `js/workroom.js`: Workspace, ห้อง, หน้า, งาน, Comment, Notification และการบันทึกทั้งหมด
- `workspaceDataKey(...)`, `readJson(...)`, `writeJson(...)`, `saveActiveWorkspaceData(...)`: เป็นชั้นจัดเก็บชั่วคราวที่ควรถูกแทนด้วย Repository/API client

แนวทางที่ปลอดภัย:

1. สร้าง `apiClient` และ Authentication ก่อน
2. เปลี่ยนการโหลด/บันทึก Workspace โดยรักษารูปข้อมูลที่ UI ใช้อยู่
3. แยก API ตาม Entity แทนการส่ง Workspace ทั้งก้อนทุกครั้ง
4. เพิ่ม Realtime หลัง CRUD และ Permission ผ่านการทดสอบแล้ว
5. ทำ Script นำข้อมูลจาก `localStorage` เฉพาะกรณีต้องรักษาข้อมูลทดสอบเดิม
6. เมื่อ Server ทำงานครบ ให้หยุดใช้ `localStorage` กับข้อมูลสำคัญ เหลือเพียง Theme, Language และค่าหน้าจอที่ไม่อ่อนไหว

## Security checklist

- ตรวจ Authentication และ Authorization ฝั่ง Server ทุกคำขอ
- Validate Schema ของ Body, Params และ Query
- ใช้ Parameterized query/ORM ป้องกัน SQL injection
- Escape/Sanitize เนื้อหาจาก Editor และ Comment ป้องกัน Stored XSS
- ตั้ง CORS เฉพาะ Origin ที่ใช้งานจริง
- ป้องกัน CSRF หากใช้ Cookie session
- Rate limit และ Audit การ Login, Invite, Role change, Delete, Approve
- ห้ามส่ง Password hash, Storage key หรือข้อมูลสมาชิกที่ไม่มีสิทธิ์กลับไปยัง Client
- เก็บ Secret ใน Environment variables และแยก Development/Staging/Production
- Backup ฐานข้อมูลและทดสอบ Restore จริง

## Definition of Done ก่อนเปิดใช้ทีมจริง

- [ ] สมัคร เข้าสู่ระบบ ออกจากระบบ และกู้รหัสผ่านได้
- [ ] Owner, Editor, Viewer ถูกบังคับใช้จริงจาก Server
- [ ] สมาชิกสองคนเห็นข้อมูลเดียวกันโดยไม่ Refresh หน้า
- [ ] การแก้พร้อมกันไม่ทำให้ข้อมูลคนอื่นหายโดยไม่มีคำเตือน
- [ ] Assign, Mention, Comment และเปลี่ยนสถานะสร้าง Notification ถูกคน
- [ ] งาน Approved หายจากรายการหลักและเปิดจากประวัติได้
- [ ] วันครบกำหนดและ Timezone แสดงถูกต้อง
- [ ] Upload/Download/Delete ไฟล์ผ่าน Permission check
- [ ] ทดสอบมือถือ คีย์บอร์ด และ Browser หลัก
- [ ] ทดสอบข้อมูลข้าม Workspace ว่าไม่รั่ว
- [ ] มี Migration, Seed, Logging, Monitoring, Backup และ Restore
- [ ] ผ่าน Unit test, Integration test และ End-to-end test ของเส้นทางปิดงาน

## สิ่งที่ยังไม่ควรเพิ่มก่อน Backend เสร็จ

ชุดฟังก์ชันฝั่งงานเป็นทีมเพียงพอสำหรับเวอร์ชันแรกแล้ว ไม่ควรเพิ่ม Calendar ขนาดใหญ่ Automation ซับซ้อน หรือ Dashboard เพิ่มก่อน Authentication, Database, Permission, Realtime, File storage และการทดสอบด้านบนเสร็จ เพราะจะเพิ่มจุดผิดพลาดและทำให้ API เปลี่ยนบ่อยโดยไม่จำเป็น

