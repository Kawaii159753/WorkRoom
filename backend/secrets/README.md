# WorkRoom Secrets & Credentials Vault 🔐

โฟลเดอร์สำหรับจัดเก็บรหัสผ่าน (Credentials), คีย์ความปลอดภัย (Secret Keys) และตัวแปรสภาพแวดล้อม (Environment Variables) ของโปรเจกต์ WorkRoom โดยแยกออกจากกันอย่างเป็นระบบเพื่อความปลอดภัยระดับสูงสุด

---

## 📂 โครงสร้างไฟล์ในโฟลเดอร์นี้

| ไฟล์ความลับ (Ignored) | ไฟล์ Template (Tracked) | รายละเอียดข้อมูล |
| :--- | :--- | :--- |
| **[`database.env`](./database.env)** | [`database.example.env`](./database.example.env) | รหัสผ่านฐานข้อมูล Supabase PostgreSQL, Connection Strings (Port 6543 / 5432) และ Anon API Key |
| **[`auth.env`](./auth.env)** | [`auth.example.env`](./auth.example.env) | คีย์สำหรับเซ็น JWT Token (`JWT_SECRET`) และ HttpOnly Cookie Session (`COOKIE_SECRET`) |
| **[`app.env`](./app.env)** | [`app.example.env`](./app.example.env) | การตั้งค่าพอร์ตและสภาพแวดล้อมของเซิร์ฟเวอร์ (`PORT`, `NODE_ENV`, `CLIENT_URL`) |

---

## 🚀 กลไกการโหลดค่า Environment Variables (`backend/src/config/env.ts`)

Backend จะค้นหาและโหลดค่าตัวแปรสภาพแวดล้อมโดยอัตโนมัติตามลำดับดังนี้:

1. **`WORKROOM_SECRETS_DIR`**: หากมีการตั้งค่าตัวแปรสภาพแวดล้อมนี้ในระบบปฏิบัติการ หรือกำหนดชี้ไปยังโฟลเดอร์เก็บ Secrets ภายนอก (เช่น โฟลเดอร์ภายนอก Repo) ระบบจะอ่านไฟล์จากตำแหน่งดังกล่าวเป็นลำดับแรก
2. **`backend/secrets/`**: ตำแหน่งมาตรฐานภายในโปรเจกต์
3. **`secrets/` (ที่โฟลเดอร์ราก)**: รองรับกรณีวางโฟลเดอร์ไว้ที่ Root ของโปรเจกต์
4. **`.env` (Fallback)**: ไฟล์ `.env` ภายในโฟลเดอร์ `backend/` สำหรับค่า Default พื้นฐาน

---

## 🔒 มาตรการความปลอดภัย (Security Rules)

> [!CAUTION]
> **ห้าม Commit ไฟล์ `.env` จริงในโฟลเดอร์นี้ขึ้น Git/GitHub โดยเด็ดขาด!**
> โฟลเดอร์ `backend/secrets/*.env` และไฟล์ `.env` ทั้งหมดถูกบล็อกไว้ใน [`.gitignore`](../../.gitignore) เรียบร้อยแล้วเพื่อป้องกันข้อมูลรั่วไหลอย่างสมบูรณ์
