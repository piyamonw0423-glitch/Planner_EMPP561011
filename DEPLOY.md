# Deploy — Maintenance Dashboard

แอปนี้เป็น **persistent Node server** (Next.js `next start`) — เหมาะกับ Render / Railway / Fly.io
(ไม่เหมาะกับ Vercel serverless เพราะ dashboard ~6MB เกินเพดาน 4.5MB และ import ~166s เกิน timeout)

ฐานข้อมูลอยู่บน **Neon (cloud) อยู่แล้ว** และ **เว็บที่ deploy จะใช้ DB ตัวเดียวกับเครื่อง local**
→ ข้อมูล + บัญชี admin ที่มีอยู่จะขึ้นทันทีหลัง deploy

---

## ขั้นตอน (แนะนำ Render — มี free tier)

### 1) ดัน code ขึ้น GitHub (ทำครั้งเดียว)
สร้าง repo เปล่าใน GitHub (เช่นชื่อ `maintenance-dashboard`, ตั้งเป็น **Private**) แล้วในโฟลเดอร์ `maintenance-dashboard`:

```bash
git remote add origin https://github.com/<your-username>/maintenance-dashboard.git
git push -u origin main
```

### 2) สร้าง Web Service บน Render
1. ไป https://render.com → New → **Web Service** → เชื่อม GitHub repo ข้างบน
2. ตั้งค่า:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** Free (หรือ Starter ถ้าไม่อยากให้หลับ)

### 3) ใส่ Environment Variables (สำคัญ)
คัดลอกค่าจากไฟล์ `.env` บนเครื่อง (ไฟล์นี้ไม่ถูก push ขึ้น git โดยตั้งใจ):

| Key | ค่า |
|-----|-----|
| `DATABASE_URL` | (ค่าเดียวกับใน .env — Neon connection string) |
| `NEXTAUTH_SECRET` | (ค่าเดียวกับใน .env) |
| `NEXTAUTH_URL` | URL ที่ Render ให้ เช่น `https://maintenance-dashboard.onrender.com` |

> `trustHost` เปิดไว้ในโค้ดแล้ว จึงไม่ต้องตั้ง `AUTH_TRUST_HOST`

### 4) Deploy
กด Create — Render จะ build (~2-3 นาที) แล้วได้ URL สาธารณะ:
- หน้าเว็บสาธารณะ: `https://<app>.onrender.com/` (redirect ไป `/tower`)
- Admin login: `https://<app>.onrender.com/login`

---

## เรื่อง Import ข้อมูล (Data refresh)
Import ชุดใหญ่ (65k แถว, ~3 นาที) อาจ timeout ถ้าทำผ่านเว็บบน host
**วิธีที่ชัวร์:** รัน import จากเครื่อง local (เขียนลง Neon ตัวเดียวกัน) แล้วเว็บที่ deploy จะเห็นข้อมูลใหม่ทันที
- ผ่านหน้า local `http://localhost:3000/tower` → Settings → วาง URL ชีต → โหลด

## Auto-update
ทุกครั้งที่ `git push` → Render/Railway จะ build + deploy ใหม่อัตโนมัติ

## Railway (ทางเลือก, ~$5/เดือน, ไม่หลับ)
เหมือน Render: New Project → Deploy from GitHub → ใส่ env 3 ตัวข้างบน → Railway ตรวจ Next.js อัตโนมัติ
