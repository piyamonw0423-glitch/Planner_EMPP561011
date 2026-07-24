# PROJECT_CONTEXT.md — Maintenance Operating System (MBOS)

> **เอกสารนี้คือ Single Source of Truth ของโครงการ** ไม่ใช่บันทึกบทสนทนา
> เขียนไว้สำหรับ Claude Code / นักพัฒนา **ที่ไม่มีความทรงจำเกี่ยวกับ session ก่อนหน้าเลย (Zero Memory)**
> อ่านไฟล์นี้ให้จบก่อนเริ่มทำงานทุกครั้ง แล้วจะเข้าใจโครงการทั้งหมดและทำงานต่อได้ทันที
>
> - **อัปเดตล่าสุด:** 2026-07-24 (ตัวเลขทุกตัวใน §6 / §11 / ภาคผนวก A **ตรวจสอบกับฐานข้อมูลจริงแล้ว** ณ วันนี้)
> - **ผู้สร้างโครงการ:** Piyamon W. (รหัส EMPlanner 5-0423) — POWER PLANT, Maintenance Department (NPP / npp.co.th)
> - **Repository:** GitHub `piyamonw0423-glitch/Planner_EMPP561011` (branch หลัก = `main`) · commit ล่าสุด `ae69d41`
> - **Production:** https://maintenance-operating-system.onrender.com/tower (Render, free tier)
> - **Local dev:** http://localhost:3000/tower (`npm run dev`)
> - **ภาษาในการสื่อสารกับเจ้าของโครงการ:** ภาษาไทย (technical term เป็นอังกฤษได้)

### แผนผังโฟลเดอร์ (สำคัญ — มี 3 ระดับ อย่าสับสน)
```
Dashboard Maint/                        ← working directory หลัก (ไม่ใช่ git repo)
├── maintenance-dashboard/              ← ★ GIT REPO (push ตัวนี้ → Render deploy)
│   ├── PROJECT_CONTEXT.md              ← ไฟล์นี้
│   ├── AGENTS.md = CLAUDE.md           ← "This is NOT the Next.js you know"
│   ├── prototype/dashboard.html        ← ★ UI ทั้งหมด แก้ที่นี่เท่านั้น
│   ├── src/ · prisma/ · scripts/
├── slides/                             ← ★ สไลด์ อยู่ "นอก" git repo (ไม่ถูก push)
│   ├── build5.js → Maintenance_KM_5slides.pptx   ← เด็คหลัก
│   ├── build.js  → Maintenance_Tracking_System_KM_2026.pptx (12 หน้า)
│   └── shot_dashboard.png              ← screenshot จริงที่ฝังในสไลด์ 3
Dashboard Maint report/                 ← โฟลเดอร์เก่า (dashboard_3.html = STALE ห้ามแก้)
```

---

## สารบัญ
1. Executive Summary
2. Product Vision
3. Business Problem
4. Business Objectives
5. Product Architecture
6. Complete Module Documentation
7. Product Features
8. Business Value
9. Current Limitations
10. Future Roadmap
11. ThinkAble Competition Strategy
12. Presentation Design System
13. Design Principles
14. Key Decisions
15. Things That Must Never Change
16. Current Outstanding Tasks
17. Recommended Next Steps
18. Repository Guidelines
19. Glossary
20. Handover Notes
- **ภาคผนวก A** — ข้อมูลจริงทุก Snapshot (verified) ← *ใช้อ้างอิงตัวเลขทุกครั้ง*
- **ภาคผนวก B** — ประวัติการเปลี่ยนแปลงเอกสาร

---

## 1. Executive Summary

**Maintenance Operating System (MBOS)** คือ **ระบบปฏิบัติการงานบำรุงรักษา** — เว็บแอปพลิเคชันที่ทำหน้าที่เป็น **ศูนย์กลางการบริหารจัดการและวิเคราะห์ข้อมูลงานซ่อมบำรุงอย่างครบวงจร** สำหรับโรงไฟฟ้า (Power Plant, PP561011)

โครงการนี้ **ต่อยอดจาก Looker Studio Dashboard เดิม** ที่ทำได้แค่ "ดูรายงาน" ให้กลายเป็น **ระบบที่ใช้งานได้จริง (operational system)** ที่ผู้ใช้อัปเดตสถานะงาน วางแผน วิเคราะห์ และเก็บประวัติได้ในที่เดียว

**ปัญหาทางธุรกิจที่แก้:** เดิมข้อมูลงานซ่อมบำรุง (Work Order) ถูกดูผ่าน Dashboard ที่แก้ไขไม่ได้ + ทำรายงานด้วย Excel มือ + ไม่มีการเก็บประวัติย้อนหลัง + แต่ละแหล่งนิยาม "Backlog" ไม่ตรงกัน ทำให้ตัดสินใจบนข้อมูลคนละชุด

**วิสัยทัศน์:** เป็น **One Stop Service** ของงานบำรุงรักษา — ครบทุกประเภทงาน (CM → PM → Predictive) และครบวงจร end-to-end (แจ้ง → วางแผน → ปฏิบัติ → ปิด → วิเคราะห์) โดยเชื่อม Maximo แบบ Real-time ในอนาคต

**เหตุผลที่องค์กรควรมี:**
- สร้าง **"ความรู้ใหม่" ที่เดิมไม่มี** — ประวัติ Backlog ย้อนหลัง (ตอบได้ว่าเดือนที่แล้ว backlog เท่าไร แนวโน้มขึ้น/ลง)
- **ต้นทุนระบบ = 0 บาท** (ใช้ free tier ทั้งหมด) → ROI คุ้มทันที
- ทั้งองค์กรใช้ **นิยามข้อมูลชุดเดียวกัน** ตัดสินใจจากข้อมูลจริง
- **ขยายผล (Replicate) ได้** — แผนก/โรงไฟฟ้าอื่นนำสถาปัตยกรรมนี้ไปใช้ซ้ำได้

**สถานะปัจจุบัน (2026-07):** ใช้งานจริงบน production · 11 โมดูล · 5 ผู้ใช้ · ข้อมูลจริง ~10,940 Work Orders · 12 snapshots ย้อนหลัง (เม.ย.–ก.ค. 2026)

---

## 2. Product Vision

### MBOS คืออะไร
- **Business Platform / Operating System** สำหรับงานบำรุงรักษา — ไม่ใช่แค่หน้าจอแสดงผล แต่เป็นระบบที่ "ทำงาน" ได้ (อัปเดตสถานะ วางแผน มีสิทธิ์ตามบทบาท มีบันทึกผู้แก้ไข เก็บประวัติ)
- **ศูนย์รวมข้อมูล (Single Source of Truth)** ของงาน Corrective Maintenance และ Shutdown
- **ชั้น Analytics + Knowledge Management** ที่วางทับข้อมูลดิบ เพื่อสร้างความรู้เชิงลึก (เทรนด์ backlog, reliability, repeat failure)

### MBOS ไม่ใช่อะไร
- **ไม่ใช่ Dashboard ทั่วไป** ที่ดูอย่างเดียวแล้วจบ
- **ไม่ใช่ระบบ Real-time** (ปัจจุบันข้อมูลอัปเดตแบบ near-daily ผ่านการ import — Real-time คือ Roadmap อนาคตเมื่อเชื่อม Maximo API)
- **ไม่ใช่ CMMS ทดแทน Maximo** — MBOS เป็นชั้น analytics/KM ที่ *เสริม* ระบบต้นทาง ไม่ใช่แทนที่
- **ไม่ใช่ระบบที่ AI ตัดสินใจแทนมนุษย์** — AI Engineer เป็นผู้ช่วยเสนอแนะ **มนุษย์เป็นผู้ตัดสินใจสุดท้ายเสมอ**

### วิสัยทัศน์ระยะยาว
CM + Shutdown (วันนี้) → เพิ่ม PM (Preventive) → Predictive Maintenance (พยากรณ์การเสีย) → **Digital Twin** ของระบบบำรุงรักษาทั้งโรง โดยข้อมูลไหลจาก Maximo แบบ Real-time

### กลุ่มผู้ใช้งานเป้าหมาย (5 บทบาท)
| บทบาท | ใช้ทำอะไร |
|---|---|
| **Planner** | อัปเดตสถานะ WO + วางแผน Calendar + Shutdown |
| **Engineer** | วิเคราะห์ Reliability / Equipment / Repeat Failure |
| **Section Head** | ดู workload + backlog ของทีมตัวเอง |
| **Manager** | ติดตาม KPI + แนวโน้ม ตัดสินใจ |
| **ผู้บริหาร** | เปิดดูภาพรวมได้เองทุกเมื่อ ไม่ต้องรอรายงาน |

### คุณค่าทางธุรกิจที่ต้องการสร้าง
ลดงานทำรายงานมือ · ตัดสินใจจากข้อมูลจริง+ประวัติ · เห็นสัญญาณ backlog ล่วงหน้าเพื่อจัดกำลังคน · ลดการพึ่งพาผู้รับเหมา · สร้างคลังความรู้กลางขององค์กร

---

## 3. Business Problem (Pain Points)

ทั้งหมดนี้คือปัญหาจริงที่ถูกพูดถึงตลอดโครงการ:

1. **Dashboard เดิม (Looker) ดูได้อย่างเดียว** — เห็นปัญหาบนจอ แต่แก้ไข/อัปเดตสถานะในระบบไม่ได้ ต้องไปทำงานต่อในไฟล์อื่นอยู่ดี → เป็น "รายงาน" ไม่ใช่ "ระบบทำงาน"
2. **ไม่มีการเก็บประวัติย้อนหลัง** — เห็นแค่ backlog ณ ปัจจุบัน เปรียบเทียบย้อนหลัง/ดูแนวโน้มไม่ได้ → วางแผนจากภาพวันนี้เท่านั้น ไม่รู้ว่าสถานการณ์ดีขึ้นหรือแย่ลง
3. **ทำรายงานด้วยมือ / Excel** — เสียเวลาซ้ำซ้อน ข้อมูลไม่ทันเหตุการณ์ แต่ละคนถือไฟล์คนละเวอร์ชัน
4. **นิยาม Backlog ไม่ตรงกัน** — เว็บเดิมนับ 2,626 แต่ Looker นับ 1,517 → ประชุมกันบนตัวเลขคนละชุด สื่อสารผิด
5. **ข้อมูลกระจัดกระจาย** — ไม่มีศูนย์รวม, ไม่มีสิทธิ์ตามบทบาท, ไม่มี log ว่าใครแก้อะไร
6. **ความรู้อยู่ในหัวคน/ไฟล์ส่วนตัว** — คนใหม่เข้ามาต้องเริ่มนับหนึ่ง

**ทำไมกระบวนการเดิมไม่มีประสิทธิภาพ:** ข้อมูลถูกสร้างทุกวัน แต่ "ความรู้" หายไปทุกวัน เพราะไม่มีการเก็บ snapshot ไว้เป็นความรู้ขององค์กร

---

## 4. Business Objectives

> 7 ข้อแรกเป็นวัตถุประสงค์ที่เจ้าของโครงการกำหนด (มีโมดูลรองรับจริงทุกข้อ) · 2 ข้อหลังเป็นจุดแข็งที่ควรชูเพิ่ม

| # | วัตถุประสงค์ | เหตุผลที่ต้องมี | Success Metric |
|---|---|---|---|
| 1 | **วัดผลงาน** ผ่านข้อมูล Work Order | ติดตามประสิทธิภาพงานซ่อม | Close Rate, จำนวน WO ปิดต่อสัปดาห์ |
| 2 | **แดชบอร์ดภาพรวม** งานคงค้าง+แผนประจำวัน | เห็นภาพรวมในหน้าเดียว | เวลาเข้าถึงข้อมูล < 1 นาที |
| 3 | **บริหารกำลังคน** จัดคนตรงงาน | ใช้ทรัพยากรคุ้มค่า | workload สมดุลระหว่างทีม |
| 4 | **ผู้ช่วย AI วิเคราะห์การซ่อม** (กำลังพัฒนา) | ให้คำแนะนำเชิงวิศวกรรมเบื้องต้น | จำนวน WO ที่ใช้ AI ช่วยวางแผน |
| 5 | **วางแผนช่วงหยุดเดินเครื่อง (SD/BD)** | จัดกลุ่มงาน shutdown ล่วงหน้า | ครบถ้วนของแผน shutdown |
| 6 | **ติดตามอุปกรณ์เสียซ้ำซาก** (Reliability Insight) | เพิ่มความเสถียรเครื่องจักร | จำนวน chronic asset ที่ได้ RCA |
| 7 | **วางแผนงานล่วงหน้า (Facilitate Service)** | ลดพึ่งพาผู้รับเหมาภายนอก | สัดส่วนงานที่ทำเองเพิ่มขึ้น |
| 8 | **ใช้งานหลายคน + สิทธิ์ตามบทบาท** | สิ่งที่ Excel/Looker ทำไม่ได้ | จำนวนผู้ใช้จริง (นำร่อง 20–30 → 50–100+) |
| 9 | **เก็บประวัติอัตโนมัติ (Snapshot รายวัน)** | สร้างความรู้ใหม่ที่เดิมไม่มี | จำนวน snapshot ต่อเนื่อง (ปัจจุบัน 12) |

**ผู้ปฏิบัติงานยังเป็นผู้ตัดสินใจสุดท้ายเสมอ** (สำคัญมากสำหรับข้อ 4)

---

## 5. Product Architecture

### 5.1 สถาปัตยกรรมปัจจุบัน
```
[Google Sheet]  (แท็บ "Follow up backlog CM " gid=1813264978)
      │  gviz CSV query API (select ... where BL = date 'YYYY-MM-DD')
      ▼
[Import pipeline]  runGvizIncrementalImport / runIncrementalCsvImport
      │  - ดึงเฉพาะ Data_Date ที่ยังไม่มีใน DB (non-destructive, idempotent)
      │  - parse → upsert snapshot → rebuild WorkOrder (latest-per-wo)
      ▼
[Neon Postgres]  (cloud, us-east-1 — ใช้ร่วมกันทั้ง local + production)
      │  - WorkOrderSnapshot: 1 row ต่อ (wo × dataDate) เก็บทุกวัน
      │  - WorkOrder: latest-per-wo (rebuild ด้วย SQL DISTINCT ON)
      │  - WorkOrderUpdate: overlay ที่ Planner แก้ (survive re-import)
      │  - AppData: blob ที่เดิมอยู่ localStorage (facilitate/remark/equip master)
      │  - User / ActivityLog / ImportBatch
      ▼
[Next.js App]  (Render)
      │  /tower route.ts → getDraftState() → inject <script>window.__MT_SEED__=...
      ▼
[prototype/dashboard.html]  (client-side render, Chart.js) — THE UI
```

### 5.2 Current Data Flow (สำคัญ)
1. Admin กด **Refresh/Import** ในเว็บ (หรือรัน `npm run import` จากเครื่อง) → import Data_Date ใหม่จาก Google Sheet
2. Import เก็บเป็น **snapshot ใหม่** (ไม่ทับของเก่า) → rebuild WorkOrder table
3. ผู้ใช้เปิด `/tower` → server อ่าน snapshot ของ Data_Date ที่เลือก (default = ล่าสุด) + คำนวณ `meta.snapshotTrend` (aggregate ต่อ Data_Date) → ฝังเป็น `__MT_SEED__`
4. `prototype/dashboard.html` อ่าน `__MT_SEED__` → `RAW_DATA` → render ทุกโมดูลฝั่ง client
5. Planner แก้สถานะ WO → POST `/api/wo-update` → เก็บใน WorkOrderUpdate + ActivityLog

**เหตุผลของ Architecture:**
- **เก็บทุก snapshot (ไม่ dedup ข้ามวัน)** → ตอบโจทย์ "ประวัติ backlog ย้อนหลัง" ซึ่งเป็นคุณค่าหลัก
- **Import แบบ non-destructive** → ป้องกันข้อมูลหาย (เคยเกิดเหตุลบข้อมูล ดู §14)
- **Prototype เป็น HTML ก้อนเดียว served ผ่าน route** → พัฒนา UI เร็ว (client-side) โดยไม่ต้องแตกเป็น component หลายไฟล์ (trade-off: ไม่ scale ถึง 100k — ดู §9)

### 5.3 สถาปัตยกรรมอนาคต
```
[Maximo]  ──REST/OData API──►  [Import worker บน cloud]  ──►  [Neon]  ──►  [Next.js server-side aggregation]  ──►  [UI]
                                (GitHub Actions cron / Render worker)         (query สรุปแทนส่งทุกแถว → รองรับ 100k+)
```

### 5.4 การเชื่อมต่อผ่าน Maximo API
- **เป้าหมาย Phase 2:** ดึง WO จาก Maximo (ระบบ CMMS ต้นทางของโรง) แบบอัตโนมัติ → ข้อมูล near real-time / real-time
- ต้องได้ **สิทธิ์ + credential ของ Maximo API** จากผู้ดูแลระบบต้นทาง (ค่าใช้จ่าย/สิทธิ์ฝั่งองค์กร ไม่ใช่ฝั่ง MBOS)
- Import worker ควรรันบน **GitHub Actions (ฟรี)** หรือ Render worker เพื่อไม่บล็อกผู้ใช้ (import ก้อนใหญ่ช้าบน Render free)

### 5.5 แนวคิด Engineering AI
- โมดูล **AI Engineer** — LLM วิเคราะห์ WO ให้ข้อมูล: work type, risk, ต้อง shutdown ไหม, isolation, hot work, confined space, LOTO, scaffold, ประเมิน man-hour, safety checklist
- **ปัจจุบันใช้ Google Gemini (ฟรี) แบบ BYO key** — ผู้ใช้ต้องวาง Gemini API Key เอง (ดู §6 โมดูล 9)
- **AI รู้แค่จาก Description ของ WO + ความรู้วิศวกรรมทั่วไป** ไม่รู้ SOP/Permit จริงของโรง → เป็นผู้ช่วยร่างเท่านั้น มนุษย์ตัดสินใจสุดท้าย

### 5.6 แนวคิด Digital Twin (Phase 5, วิสัยทัศน์)
- รวมข้อมูล asset + reliability + predictive → แบบจำลองสถานะสุขภาพเครื่องจักรทั้งโรง เพื่อจำลอง/พยากรณ์ก่อนตัดสินใจซ่อม เป็นเป้าหมายปลายทาง (ยังไม่มีแผน implement ระยะสั้น)

---

## 6. Complete Module Documentation

> โมดูลทั้งหมดอยู่ใน `prototype/dashboard.html` (client-side) · แต่ละหน้ามี `data-page` และ render function
> **ข้อมูลจริง ณ snapshot ล่าสุด 2026-07-21 (10,940 WO) — ตรวจสอบกับ DB แล้ว 2026-07-24:**
> Total Backlog **2,000** (Planning 1,505 + Pending Start 495) · In Progress 612 · Completed 535 · Closed 7,793
> (snapshot ก่อนหน้า 2026-07-14 = 10,706 WO · Backlog 2,018 = Planning 1,517 + Pending 501 · In Progress 608 · Completed 445 · Closed 7,635 · ทีม: ECC Emergency 3,146 / MECH 2,802 / AUTO 2,584 / ELEC 1,771)
> **ดูตารางเต็มทั้ง 12 snapshot ที่ [ภาคผนวก A](#ภาคผนวก-a--ข้อมูลจริงทุก-snapshot-verified-2026-07-24)**

### โมดูล 1 — Dashboard (Overview) · `overviewPage` · `renderOverview()`
- **วัตถุประสงค์:** ภาพรวม KPI + เทรนด์ Backlog + แยกทีม + Status A–J
- **คุณค่า:** เห็นทั้งระบบในหน้าเดียว, เทรนด์ย้อนหลังจริงจาก snapshot, drill-down คลิกดูรายการได้
- **ผู้ใช้:** ทุกบทบาท (โดยเฉพาะ Manager/ผู้บริหาร)
- **สถานะ:** ใช้งานจริง (flagship)
- **องค์ประกอบสำคัญ:** KPI tiles (`renderOvSummaryTiles`), กราฟ **WO CUMULATIVE TREND** (`renderCumulativeTrend` + `drawCumulChartJS`) มีแท็บ **"ตาม Data_Date"** (default) / รายสัปดาห์ / รายเดือน / รายปี + **ตัวเลขบนกราฟ** (plugin `cumulValueLabels`), การ์ดทีม (`buildCard`), Status A–J donut (`renderOvAjDashboard`), Backlog Aging, WORK ORDER & CLOSED TREND + BACKLOG TREND (`trendBuckets`)
- **Dependencies:** `window.__MT_SEED__.meta.snapshotTrend` (server), `statusGroup()`, `isOpen()`, `isNotStarted()`, `isPlanningBacklog()`, `issueDate()`
- **ข้อจำกัด:** กราฟมุมรายสัปดาห์/เดือน/ปี เป็นการประมาณจาก snapshot ปัจจุบัน (มุม Data_Date เท่านั้นที่เป็นค่าจริงต่อ snapshot)

### โมดูล 2 — Work Order Performance + Planner Board · `dashboardPage` · `refreshAll()`
- **วัตถุประสงค์:** ที่ทำงานจริงของ Planner — KPI ส่วนตัว, workload ทีม, Kanban, Today's Plan, Activity log, **อัปเดตสถานะ WO**
- **คุณค่า:** อัปเดตในระบบ + log ผู้แก้ไข (ไม่ใช่แค่ดู), กรองตาม Supervisor/Plant/Ref Code
- **ผู้ใช้:** Planner (แก้ได้), ทุกคน (ดู)
- **สถานะ:** ใช้งานจริง
- **Dependencies:** `getWpFilteredRows()`, `/api/wo-update` (สิทธิ์ PLANNER+), `USER_UPDATES`
- **ข้อจำกัด:** Kanban/Donut ใช้ `classifyStatus()` จาก `statusAJ` (ข้อความ) — ถ้า field ไม่สมบูรณ์อาจตกกลุ่ม

### โมดูล 3 — Work Orders · `workOrdersPage` · `drawWoTable()`
- **วัตถุประสงค์:** ตารางค้นหา/กรอง WO ทั้งหมด + Export Excel
- **คุณค่า:** กรอง 8 มิติ (Plant/Team/Priority/Status/Overdue/Supervisor/**Work Ref Code**/Search) + export ครบ
- **สถานะ:** ใช้งานจริง · **ข้อจำกัด:** ตารางโชว์ 500 แถวแรก (แต่ export ครบทุกแถว)

### โมดูล 4 — Calendar · `calendarPage` · `renderCalendar()`
- **วัตถุประสงค์:** ปฏิทินงานราย เดือน/ปี + Capacity dashboard
- **คุณค่า:** เห็น workload ตามวัน, กรองครบ (มี Work Ref Code) · **ข้อจำกัด:** capacity นับจำนวนงาน ยังไม่ผูกชั่วโมงคนจริง

### โมดูล 5 — Shutdown Plan · `shutdownPage` · `renderShutdownPlan()`
- **วัตถุประสงค์:** จัดกลุ่มงานช่วงหยุดเดินเครื่อง (tag SD/ANSD/QSD/WS) + Export
- **คุณค่า:** วางแผน shutdown, tag + หมายเหตุเอง, ผูกกับ status WS · มีคอลัมน์ Asset + ปุ่ม **Export Excel** (`exportShutdownExcel`, ใช้ `_sdMatchedRows`)
- **ข้อจำกัด:** tag/หมายเหตุเก็บใน AppData (user-entered) แยกจาก WO lifecycle

### โมดูล 6 — Equipment · `equipmentPage` · `renderEquipment()`
- **วัตถุประสงค์:** มุมอุปกรณ์ (asset-centric) + ตารางซ่อมซ้ำ 30 วัน + ธง RCA
- **คุณค่า:** ออกแบบรองรับข้อมูลใหญ่ (Map + pagination), เห็น Total/Open/Overdue ต่ออุปกรณ์
- **ข้อจำกัด:** ไม่มี Asset Master จริง (สร้างจาก WO), `riCategory()` จำแนกด้วย keyword

### โมดูล 7 — Facilitate Service · `facilitatePage` · `renderFacilitateCenter()`
- **วัตถุประสงค์:** วางแผน 5 บริการสนับสนุน (Scaffolding/Insulation/HP Clean/Crane/Welding) + งานจ้างภายนอก (Outsource) + Export
- **คุณค่า:** ตอบ objective ลดพึ่งพาผู้รับเหมา
- **ข้อจำกัด:** ข้อมูลกรอกเอง (AppData/localStorage) ยังไม่เชื่อม WO อัตโนมัติ

### โมดูล 8 — Alert Center · `alertCenterPage` · `renderAlertCenter()`
- **วัตถุประสงค์:** แจ้งเตือนเชิงรุก 4 ระดับ: P1 Overdue / เกิน Target ยังไม่ปิด / Waiting Shutdown / Backlog >90 วัน
- **คุณค่า:** proactive, คลิกไปหน้า WO detail ได้ · **ข้อจำกัด:** เกณฑ์ fix (90 วัน) ปรับใน UI ไม่ได้

### โมดูล 9 — AI Engineer · `aiEngineerPage` · `runAiAnalysis()`
- **วัตถุประสงค์:** LLM วิเคราะห์งานซ่อม (Risk/Shutdown/Isolation/Hot Work/Confined Space/LOTO/Scaffold/Man-hour/Safety Checklist)
- **คุณค่า:** ผู้ช่วยวิศวกรรมเชิงลึก safety-first
- **สถานะ:** ใช้งานได้ (ต้องมี key) · **ใช้ Google Gemini `gemini-2.0-flash` (ฟรี) แบบ BYO key**
- **การใช้:** เข้าหน้า → ใส่รหัส admin (ด่าน `aiLogin` ใช้ `ADMIN_PASSCODE`) → วาง **Gemini API Key** (ฟรีจาก aistudio.google.com/app/apikey, ไม่ต้องผูกบัตร) → เลือก WO → วิเคราะห์
- **Dependencies:** Gemini API (`generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=...`), `responseMimeType: application/json`, key เก็บใน `localStorage['mt_ai_api_key']`
- **ข้อจำกัด:** ต้องมี key (แต่ฟรี) · AI รู้แค่จาก Description ของ WO · man-hour เป็นการประมาณ · ต้องให้วิศวกรรีวิวเสมอ

### โมดูล 10 — Reliability Insight · `reliabilityPage` · `renderReliabilityInsight()`
- **วัตถุประสงค์:** Repeat Failure + จำแนกประเภทซ่อม (Bearing/Motor/Valve/Pipe/Pump/Seal/Overhaul) + Chronic Asset + RCA
- **คุณค่า:** ความลึกเชิงวิศวกรรม (โดนใจนักวิชาการ), หา chronic asset, แนะ RCA
- **ข้อจำกัด:** จำแนกด้วย regex keyword ภาษาอังกฤษ (`RI_INCLUDE`/`RI_EXCLUDE`/`riCategory`) — คำอธิบายภาษาไทยบางส่วนอาจหลุด

### โมดูล 11 — User Management + Password · `/dashboard/settings/users` + `/dashboard/settings/password`
- **วัตถุประสงค์:** Admin จัดการผู้ใช้ (สร้าง/เปลี่ยน role/เปิด-ปิดใช้งาน/**ตั้งรหัสใหม่**) · ผู้ใช้เปลี่ยนรหัสตัวเอง
- **Server actions:** `createUser`, `updateUserRole`, `setUserActive`, `resetUserPassword` (ADMIN), `changeMyPassword` (any signed-in) — ที่ `src/app/actions/users.ts`
- **ข้อจำกัด:** ดูรหัสผ่านเดิมไม่ได้ (bcrypt hash ทางเดียว — โดยตั้งใจ)

---

## 7. Product Features

### Implemented (พัฒนาแล้ว ใช้งานจริง)
- 11 โมดูล (§6)
- **Data_Date Snapshots** — เก็บประวัติทุก import (12 snapshots: 2026-04-07 → 2026-07-21)
- **Multi-user + Role (ADMIN/PLANNER/VIEWER)** + registration + admin approval (`isActive`)
- **นิยาม Backlog ตามหลักการ** (Planning / Pending Start / In Progress แยกกัน — ดู §14/§19)
- **WO CUMULATIVE TREND — มุม "ตาม Data_Date"** + ตัวเลขบนกราฟ
- **Export Excel** (Work Orders, Shutdown Plan, Facilitate)
- **AI Engineer** (Gemini ฟรี, BYO key)
- **Password management** — admin reset, self-change, 30-day session, browser autocomplete
- **Import** — gviz incremental (non-destructive) + local `npm run import`
- **Alert Center** (4 SEV) · **Reliability/Repeat Failure/RCA**

### Planned (วางแผนไว้ ใกล้ตัว ฟรี)
- **Auto-refresh ทุกเที่ยงคืน** ผ่าน GitHub Actions cron (0 บาท) — ยังไม่ได้ตั้ง
- **Server-side aggregation** — ให้ DB สรุปแทนส่งทุกแถวเข้า browser → รองรับ 100,000+ rows
- **เปิด AI Engineer ให้ผู้ใช้ทุกคน** (ปัจจุบันต้องมี key ราย browser)
- ใส่ screenshot Product ลงสไลด์นำเสนอ (Dashboard ใส่แล้ว, Reliability ค้าง)

### Future (แผนระยะยาว)
- **เชื่อม Maximo API → Real-time**
- **PM (Preventive Maintenance)** เพิ่มขอบเขตงาน
- **Predictive Maintenance** (พยากรณ์การเสีย จาก reliability + AI)
- **Digital Twin**
- Asset Master จริง (ผูก Equipment/Facilitate กับ WO อัตโนมัติ)

---

## 8. Business Value

- **การปฏิบัติงาน:** อัปเดตสถานะ + วางแผนในระบบเดียว ไม่ต้องส่งไฟล์ไปมา · ลดงานทำรายงานมือ · ลดข้อมูลผิดพลาด/หลายเวอร์ชัน
- **ผู้บริหาร:** เปิดดูภาพรวม + KPI + แนวโน้มได้เองทุกเมื่อ ไม่ต้องรอรายงาน · ตัดสินใจจากข้อมูลจริง
- **ฝ่ายวิศวกรรม:** เจาะ Reliability/Repeat Failure/Chronic Asset ได้เอง · AI ช่วยร่างแผนงานเชิงวิศวกรรม (safety-first)
- **Planner:** เห็น workload/backlog แยกทีม จัดคนตรงงาน · วางแผน SD/BD · Facilitate ลดพึ่งผู้รับเหมา
- **การเงิน:** **ต้นทุนระบบ = 0 บาท** (free tier) → ไม่มี payback period ให้คำนวณ คุ้มทันที · เฟสถัดไป (Real-time เต็มรูปแบบ) ประเมิน ~3,000–12,000 บาท/ปี ≈ 30–120 บาท/คน/ปี (ที่ผู้ใช้ 100 คน)
- **Productivity / KM:** สร้าง "ความรู้ใหม่" (ประวัติ backlog ย้อนหลัง) ที่เดิมไม่มี · คลังความรู้กลาง คนใหม่ใช้ได้ทันที · ขยายผล (replicate) ไปแผนก/โรงอื่นได้

---

## 9. Current Limitations (ตรงไปตรงมา ไม่กล่าวเกินจริง)

1. **Client-side rendering** — `/tower` ส่ง WO ทุกแถวเข้า browser (`RAW_DATA`) แล้วคำนวณฝั่ง client · 10k แถว ≈ payload ~5MB (ยังไหว) แต่ **100k แถวจะโหลดไม่ขึ้น** → ต้องทำ server-side aggregation ก่อน scale จริง
2. **ยังไม่ Real-time** — ข้อมูลอัปเดตด้วยการกด Refresh / รัน import (near-daily) · Real-time ต้องรอเชื่อม Maximo API
3. **AI Engineer ต้องมี Gemini key ราย browser** — แต่ละคนต้องสร้าง+วาง key เอง (แม้ฟรี) · ยังไม่มี server-side key กลาง (เพราะจะมีค่าใช้จ่าย/หลุด 0 บาท)
4. **ขอบเขตงาน = CM + Shutdown เท่านั้น** — ยังไม่มี PM / Predictive
5. **Reliability/Equipment จำแนกด้วย keyword ภาษาอังกฤษ** — คำอธิบายภาษาไทยบางส่วนอาจ classify ไม่ครบ
6. **คุณภาพข้อมูลต้นทาง** — บางแถว `targetStart` มาหลัง `actualFinish` หรือเป็นวันอนาคต (จึงต้องมี `issueDate()` ช่วย normalize ในกราฟ cumulative)
7. **Facilitate/Shutdown tags/remarks/Equipment master** เก็บใน AppData (กรอกเอง) ยังไม่ผูก WO อัตโนมัติ
8. **Render free tier** — spin down เมื่อไม่มี traffic (เข้าครั้งแรกช้า ~30 วิ), RAM/CPU จำกัด, import ก้อนใหญ่บน server ช้า (จึงมี `npm run import` รันจากเครื่อง)
9. **Neon free tier** — พื้นที่จำกัด ~0.5GB; ถ้าเก็บ snapshot ขนาดใหญ่หลายวันอาจต้อง prune หรืออัปเกรด

---

## 10. Future Roadmap

| Phase | ชื่อ | เนื้อหา | เหตุผลที่วางไว้ตรงนี้ |
|---|---|---|---|
| **Phase 1** | **ระบบปัจจุบัน** | CM + Shutdown · 11 โมดูล · Multi-user · Snapshot ประวัติ · ต้นทุน 0 บาท | ทำเสร็จแล้ว ใช้งานจริง — เป็นฐานที่ทุก phase ต่อยอด |
| **Phase 2** | **Real-time** | เชื่อม Maximo API · Auto-refresh (GitHub Actions ฟรี) · server-side aggregation รองรับ 100k+ | ต้องมีข้อมูลสด+รองรับ scale ก่อน จึงจะต่อยอด AI/Predictive ได้อย่างมีความหมาย |
| **Phase 3** | **Engineering AI** | เปิด AI Engineer เต็มรูปแบบบน production · ผู้ช่วยวางแผนงานเชิงวิศวกรรม | ต้นแบบพร้อมแล้ว (Gemini) เปิดใช้เต็มเมื่อข้อมูลสด + มี asset master |
| **Phase 4** | **Predictive Maintenance** | พยากรณ์การเสีย จาก Reliability + AI + ประวัติ | ต้องมีข้อมูลย้อนหลังมากพอ + real-time ก่อน จึงพยากรณ์ได้แม่น |
| **Phase 5** | **Digital Twin** | แบบจำลองสุขภาพเครื่องจักรทั้งโรง | ปลายทางวิสัยทัศน์ — รวมทุก phase ก่อนหน้า |

> เฟส 1 (+ ส่วนฟรีของเฟส 2 เช่น auto-refresh) ทำได้บนต้นทุน 0 บาท · ส่วนที่ต้องขอสนับสนุนคือ Maximo API + real-time infrastructure

---

## 11. ThinkAble Competition Strategy

> โครงการนี้ส่งประกวด **ThinkAble** (งาน Knowledge Management ของโรงไฟฟ้า)

- **กลุ่มผู้ฟัง:** ผู้บริหาร + นักวิชาการมากประสบการณ์ (สาย IT/วิศวกรรม) → เด็คต้อง **มีเนื้อ ไม่ฟุ้ง**
- **เกณฑ์กรรมการ (คาดการณ์):** การจัดการความรู้ · นวัตกรรม · การนำไปใช้จริง · **การพัฒนาต่อเนื่อง (Continuous Improvement)** · การขยายผล (Replication)
- **กลยุทธ์เล่าเรื่อง (Storytelling):**
  1. Hook: *"ข้อมูลถูกสร้างขึ้นทุกวัน — แต่ความรู้หายไปทุกวัน"*
  2. ปัญหา → ทางออก (ต่อยอดจากการรายงานทั่วไป → ระบบที่ใช้งานได้จริง)
  3. Product จริง (screenshot Dashboard/Reliability)
  4. **หมัดเด็ด: ผลลัพธ์ที่วัดได้ — กราฟ Backlog เพิ่มขึ้น ~30% ใน 3.5 เดือน** = ความรู้ใหม่ที่เดิมไม่มี
     > ⚠️ **ตัวเลขนี้ต้องอัปเดตทุกครั้งที่ import snapshot ใหม่** — ค่าล่าสุด (verified 2026-07-24):
     > **1,539 (2026-04-07) → 2,000 (2026-07-21) = +30.0%**
     > สไลด์ `build5.js` ปัจจุบันยังเขียน **+31% (1,539→2,018)** ซึ่งอ้าง snapshot 2026-07-14 (เก่ากว่า 1 สัปดาห์)
     > → ถ้า rebuild สไลด์ ให้แก้เป็น +30% หรือใช้ช่วง 1,539→2,018 พร้อมระบุวันที่กำกับ ห้ามปล่อยให้ตัวเลขขัดกับเว็บที่กรรมการอาจเปิดดู
  5. ปิดด้วย **โรดแมป One Stop Service** + ขอสนับสนุนต่อยอด
- **กลยุทธ์เพิ่มโอกาสชนะ:** ชู "ต้นทุน 0 บาท" + "ขยายผลได้" (ตรงเกณฑ์ KM) · ใช้ **ข้อเท็จจริงที่วัดได้จริง** (ไม่ปั้นตัวเลข ROI)
- **ประเด็นที่ควรเน้น:** ความรู้ใหม่ (ประวัติ backlog) · ใช้งานจริงทั้งองค์กร · 0 บาท · ความลึกวิศวกรรม (Reliability/AI) · โรดแมปชัด
- **ประเด็นที่ควรหลีกเลี่ยง:** อย่าเคลมว่า Real-time (ยังไม่ใช่) · อย่าเคลมว่า AI แม่นยำ/ตัดสินใจแทนคน · อย่าตำหนิเครื่องมือเดิม (Looker) บนสไลด์ (เก็บใน speaker note) · **อย่ามีสไลด์ "ข้อเสีย/จุดอ่อน" — แปลงเป็นโรดแมป**
- **คำถามกรรมการที่อาจเจอ + แนวตอบ:**
  - *"Scale ได้แค่ไหน?"* → "10,706 เสถียร แผนถัดไปทำ server-side aggregation รองรับ 100,000+"
  - *"Real-time ไหม?"* → "ปัจจุบัน near-daily รอ Maximo API ก็ real-time ได้ทันที สถาปัตยกรรมรองรับแล้ว"
  - *"AI เชื่อได้แค่ไหน?"* → "เป็นผู้ช่วยเสนอแนะ **ผู้ปฏิบัติงานตัดสินใจสุดท้ายเสมอ** ออกแบบ safety-first"
  - *"ทำไมไม่ใช้ Maximo ตรงๆ?"* → "นี่คือชั้น analytics + KM ที่ Maximo ไม่มี และเชื่อมกลับได้"
  - *"0 บาทจริงเหรอ?"* → "ตัวระบบ 0 บาทจริง (free tier); AI เป็นฟีเจอร์เสริมใช้ key ฟรีของผู้ใช้เอง ไม่กระทบงบ"

---

## 12. Presentation Design System

- **ตำแหน่งไฟล์จริง:** `C:\Users\ACER\Desktop\NPS\Backlog\Y2026\Dashboard Maint\slides\`
  — **อยู่นอก git repo** (พี่น้องกับ `maintenance-dashboard/`) จึง **ไม่ถูก push ขึ้น GitHub** และไม่มี backup บน cloud ⚠️
- **ไฟล์สไลด์:**
  - `Maintenance_KM_5slides.pptx` — **เด็คหลักปัจจุบัน** (5 หน้า, ฝัง `shot_dashboard.png` จริงในสไลด์ 3) · build ด้วย `build5.js`
  - `Maintenance_KM_Executive.pptx` — เด็ค 5 หน้าเวอร์ชันก่อน (เก็บไว้เป็น backup — **ห้ามลบ**)
  - `Maintenance_Tracking_System_KM_2026.pptx` + `_V1.pptx` — เด็ค 12 หน้าละเอียด · build ด้วย `build.js`
- **เครื่องมือ:** `pptxgenjs` (Node) — `cd "Dashboard Maint/slides" && node build5.js` (มี `node_modules` ของ pptxgenjs อยู่แล้วในโฟลเดอร์นั้น)
- **Color Palette (Navy + Gold):** `NAVY_D=0A2342` · `NAVY=13315C` · `NAVY2=1E4A9C` · `GOLD=F5B921` · `GOLD_D=E0A200` · `WHITE=FFFFFF` · `LIGHT=F4F7FB` · `TXT=152238` · `MUT=5B6B84` · data accents: RED `DC2626`, GREEN `10B981`, BLUE `2563EB`, ORANGE `D97706`
- **Typography:** font `Tahoma` (render ไทยได้บน PowerPoint จริง) · Title 30–46pt bold · Section 15–24pt bold · Body 11–14pt · Caption 9–11pt
- **Layout:** LAYOUT_WIDE (13.33×7.5") · margin 0.7" · sandwich (navy เปิด → ขาวเนื้อหา → navy ปิด)
- **Motif:** **จุดทอง (gold circle)** นำหัวข้อ + **วงแหวนทองนุ่มๆ** (translucent) บนหน้าเปิด/ปิด · **ห้ามใช้แถบสี/เส้นใต้หัวข้อ** (ดู AI-generated)
- **Chart:** native PowerPoint chart (`addChart`) สีแบรนด์ (เส้นทอง+navy) · แสดง value labels
- **Screenshot:** ใส่ในกรอบ rounded rect ขอบทอง + shadow (helper ในเด็ค) · aspect ต้องตรงกับภาพจริง (Dashboard ~2.15:1)
- **แนวคิดแต่ละสไลด์ (เด็ค 5 หน้า):** 1) Title+3 hero stats · 2) ปัญหา→ทางออก (hook KM) · 3) Product จริง (screenshot + 7 ความสามารถ) · 4) ผลลัพธ์ +31% (กราฟจริง) · 5) โรดแมป One Stop Service + ขอสนับสนุน

**pptxgenjs gotchas (สำคัญ — เคยเจอ):** hex ห้ามมี `#` และห้าม 8 หลัก · ตั้ง `pres.layout` ก่อน addSlide · shadow offset ต้อง ≥ 0 · `charSpacing` (ไม่ใช่ letterSpacing) · bullet ต้อง `valign:"top"` กันลอยกลางกล่อง · combo chart secondary axis ต้องประกาศ `valAxes`+`catAxes` 2 entries ไม่งั้นไฟล์เสีย · หลัง writeFile ให้ตรวจ · PowerPoint ล็อกไฟล์เวลาเปิด (ต้อง `Stop-Process POWERPNT` ก่อน rebuild)

---

## 13. Design Principles (พร้อมเหตุผล)

- **Business Value > Features** — ทุกการสื่อสารเน้นคุณค่าธุรกิจก่อนฟีเจอร์ (เพราะผู้ฟัง = ผู้บริหาร/กรรมการ)
- **ข้อเท็จจริง > สมมติฐาน** — ใช้ตัวเลขจริงจาก DB ไม่ปั้น ROI (กันโดนจับผิด + ตรงเกณฑ์ KM)
- **ซื่อสัตย์เรื่องข้อจำกัด** — แปลงข้อจำกัดเป็นโรดแมป ไม่ซ่อน (สร้างความน่าเชื่อถือกับนักวิชาการ)
- **มนุษย์ตัดสินใจสุดท้าย** — AI เป็นผู้ช่วยเท่านั้น (จริยธรรม + ความปลอดภัย)
- **Non-destructive by default** — งานข้อมูลใช้ UPDATE/UPSERT ไม่ DELETE-then-reimport (เคยเกิดเหตุข้อมูลหาย §14)
- **0 บาท เป็นจุดขาย** — ทุกทางเลือกเทคนิคพยายามใช้ free tier ก่อน (Gemini free, GitHub Actions, Render/Neon free)
- **สะอาดตา พรีเมียม** — Navy+Gold, whitespace, ไม่มี AI-cliché (แถบสี/เส้นใต้)

---

## 14. Key Decisions (บันทึกการตัดสินใจ + เหตุผล)

1. **ต่อยอดจาก Looker → ระบบใช้งานจริง** (กลาง มิ.ย. 2026) — เพราะ Looker ดูได้อย่างเดียว
2. **เก็บทุก snapshot (ไม่ dedup ข้ามวัน)** — เพื่อสร้างประวัติ backlog (คุณค่าหลัก KM)
3. **นิยาม Backlog ใหม่ (3 กลุ่มไม่ทับกัน)** — เดิมเว็บนับ "all open" = 2,626 ไม่ตรง Looker 1,517 · ตกลงแยกเป็น **Planning Backlog (WPLAN/WSCH/WSHUT)=1,517** + **Backlog–Pending Start (WMATL/APPR/WAPPR*/WCONTRACTOR/WCTRL*)=501** + **In Progress=608** · **Total Backlog = Planning + Pending Start = 2,018** (ไม่รวม In Progress/Completed ตามหลัก maintenance: งานที่เริ่มแล้วไม่ใช่ backlog)
4. **Deploy บน Render (ไม่ใช่ Vercel)** — วัดแล้ว /tower payload > 4.5MB และ import > timeout ของ Vercel · Render ต้องใช้ **relative redirect Location** (behind proxy request.url เป็น localhost ภายใน)
5. **AI ใช้ Gemini ฟรี (ไม่ใช่ Anthropic)** — Anthropic เสียเงิน (~1–2 บาท/ครั้ง) หลุด narrative 0 บาท · Gemini free tier + BYO key = 0 บาท (เดิมโค้ดเรียก Anthropic โดยตรง มี error หลอกว่า "ต้องใช้ผ่าน Claude Artifact")
6. **Password: bcrypt + reset + self-change + 30-day session** — ไม่เก็บ plaintext (เจ้าของขอ "ดูรหัส user ได้" แต่ตัดสินใจไม่ทำเพราะผิดหลักความปลอดภัย/PDPA — แก้ปัญหา "ลืมรหัส" ด้วยการ reset แทน)
7. **WO CUMULATIVE TREND เพิ่มมุม "ตาม Data_Date"** — plot ค่าจริงต่อ snapshot (เหมือน Looker) + ตัวเลขบนกราฟ (ไม่ต้อง hover)
8. **เปลี่ยนชื่อเป็น "Maintenance Operating System"** — ให้ตรงกับ URL production
9. **ห้ามใช้ Vercel · ต้องอ่าน `node_modules/next/dist/docs/` ก่อนเขียน Next.js** (Next 16 มี breaking changes — ระบุใน `AGENTS.md`)

---

## 15. Things That Must Never Change (ห้ามเปลี่ยน)

- **MBOS คือ Business Platform / Operating System** — ไม่ใช่ Dashboard ทั่วไป
- **ระบบปัจจุบันยังไม่ใช่ Real-time** — อย่าสื่อสารว่าเป็น real-time (เป็น Roadmap)
- **Engineering AI เป็น Roadmap / ฟีเจอร์เสริม** — ไม่ใช่แกนหลัก และ **มนุษย์เป็นผู้ตัดสินใจขั้นสุดท้ายเสมอ**
- **ทุกการสื่อสารให้ความสำคัญกับ Business Value มากกว่าฟีเจอร์**
- **ต้นทุนระบบหลัก = 0 บาท** — อย่าเพิ่ม dependency ที่มีค่าใช้จ่ายโดยไม่ถามเจ้าของก่อน
- **ห้าม DELETE snapshot แล้ว re-import** เพื่อ backfill — ใช้ UPDATE/UPSERT แบบ non-destructive เท่านั้น และ **ต้องถามก่อนลบข้อมูลเสมอ** (เคยเกิดเหตุลบ 76,810 snapshots ต้องกู้ด้วย Neon PITR)
- **แก้ UI ที่ `prototype/dashboard.html` เท่านั้น** (ไม่ใช่ `Dashboard Maint report/dashboard_3.html` ซึ่ง stale)
- **ไม่เก็บ password เป็น plaintext** — bcrypt เท่านั้น
- **นิยาม Backlog (Planning/Pending Start/In Progress แยกกัน)** — อย่า revert กลับไปเป็น "all open"
- **ผู้ใช้เก็บไฟล์เวอร์ชันเก่าไว้เป็น backup โดยตั้งใจ — ถามก่อนลบไฟล์เสมอ**

---

## 16. Current Outstanding Tasks

### High Priority
- [ ] **ใส่ screenshot Product ลงเด็คสไลด์** — Dashboard ใส่แล้ว (slide 3), เหลือ **Reliability Insight** (ยังเป็น placeholder ในกรอบ) · วิธี: ให้เจ้าของเปิดเว็บ login + F11 fullscreen หน้า Reliability → Win+PrtScn (เซฟลง `C:\Users\ACER\Pictures\Screenshots`) → คัดลอกไฟล์ไป `slides/shot_reliability.png` → แก้ `build5.js` (แทน `phFrame` Reliability ด้วย `addImage`) → rebuild
- [ ] **อนุมัติผู้ใช้ที่รออยู่** — `kaweepak_s@npp.co.th` (VIEWER, isActive=false) ที่หน้าจัดการผู้ใช้
- [ ] **ทดสอบ AI Engineer จริง** — เจ้าของยังสร้าง Gemini key ไม่สำเร็จ (เจอ "The request is suspicious" ตอนสร้าง Cloud Project — สาเหตุ VPN/บัญชีองค์กร/เน็ตบริษัท) · ทางแก้: ปิด VPN / ใช้ Gmail ส่วนตัว / สร้าง project ที่ console.cloud.google.com ก่อน / หรือ **เปลี่ยนไป Groq (ฟรี, สมัครง่ายกว่า ไม่ต้องมี project)** ถ้าเจ้าของต้องการ

### Medium Priority
- [ ] **Auto-refresh ทุกเที่ยงคืน (GitHub Actions cron, ฟรี)** — ยังไม่ตั้ง · ต้องเก็บ `DATABASE_URL` + sheet URL เป็น GitHub Secrets, cron `0 17 * * *` (= เที่ยงคืนไทย UTC+7), รัน `npm run import`
- [ ] **Server-side aggregation** — เตรียมสำหรับ scale 100k (ปัจจุบัน client-side)

### Low Priority
- [ ] เปลี่ยนหัวข้อรายงาน "PP561011 MAINTENANCE PERFORMANCE" (ถ้าเจ้าของต้องการ — ปัจจุบันคงไว้)
- [ ] Sync Google Sheet ↔ DB ให้ครบ (ถ้าเจ้าของ repopulate sheet ด้วยข้อมูลชุดใหม่)
- [ ] ปรับ Reliability/Equipment ให้จำแนกคำอธิบายภาษาไทยได้

---

## 17. Recommended Next Steps (ลำดับที่แนะนำ)

1. **ปิดงานพรีเซนต์ก่อน** (มีเดดไลน์ ThinkAble) — ใส่ screenshot Reliability ให้ครบ + ซ้อมตอบคำถามกรรมการ (§11)
2. **ตั้ง Auto-refresh (GitHub Actions)** — ได้ Phase 2 บางส่วนแบบฟรี ทำให้ข้อมูลสดขึ้นโดยไม่ต้องกด Refresh เอง (จุดขายในเด็ค)
3. **แก้ AI Engineer key ให้ใช้ได้** (Groq หรือ Gemini) เพื่อ demo ได้จริง
4. **วางแผน server-side aggregation** ก่อนจะเพิ่มข้อมูล/ผู้ใช้จำนวนมาก
5. **เจรจา Maximo API** กับผู้ดูแลระบบต้นทาง (Phase 2 เต็มรูปแบบ)

---

## 18. Repository Guidelines (สำหรับ Claude Code ในอนาคต)

### วิธีเริ่มต้น Session ใหม่
1. **อ่าน `PROJECT_CONTEXT.md` (ไฟล์นี้) ให้จบก่อน** — คือ Single Source of Truth
2. อ่าน `AGENTS.md` (= `CLAUDE.md`) → **"This is NOT the Next.js you know" — ต้องอ่าน `node_modules/next/dist/docs/` ก่อนเขียนโค้ด Next.js** (Next 16 breaking changes)
3. ถ้ามี `~/.claude/.../memory/MEMORY.md` ให้อ่านประกอบ (มี memory: dashboard-project-goal, data-sync-state, backlog-definition, dashboard-login-credentials ฯลฯ)

### ไฟล์ที่ควรอ่านก่อน (ตามลำดับความสำคัญ)
| ไฟล์ | คืออะไร |
|---|---|
| `prototype/dashboard.html` | **UI ทั้งหมด (แก้ที่นี่)** — ก้อน HTML+JS เดียว, มี render function ของทุกโมดูล |
| `src/app/tower/route.ts` | serve prototype + inject `__MT_SEED__`/`__MT_USER__`/`__MT_CANEDIT__`/`__MT_ADMIN__` + login bar |
| `src/lib/draft-state.ts` | `getDraftState()` — อ่าน DB → payload (snapshot + `snapshotTrend`) |
| `src/lib/import/parse.ts`, `run-import.ts` | import pipeline (gviz + CSV, non-destructive) |
| `src/auth.ts`, `src/app/actions/users.ts`, `auth.ts` | auth + user/password management |
| `prisma/schema.prisma` | DB schema |
| `scripts/import-sheet.ts` | local import (`npm run import`) |

### แนวทางพัฒนาต่อ
- **UI:** แก้ `prototype/dashboard.html` → `renderXxx()` functions · ตรวจ syntax ด้วยการ extract inline `<script>` แล้ว `new Function()` (มีตัวอย่างในประวัติ) · Chart.js 4.4.1 จาก cdnjs (ไม่มี 4.4.4)
- **Server:** แก้ `src/**` → `npx tsc --noEmit` typecheck · restart dev server หลังแก้ server module (Next cache)
- **DB:** schema เปลี่ยน → `npx prisma db push` แล้ว `npx prisma generate` + restart dev · DB เป็น Neon ใช้ร่วม local+prod (**ระวังแก้ข้อมูล = กระทบ production ทันที**)
- **Deploy:** commit + `git push origin main` → Render auto-deploy (~2-3 นาที) · ตรวจ production หลัง deploy
- **Slides:** แก้ `slides/build5.js` → `node build5.js` ในโฟลเดอร์ `slides/`

### คำสั่งที่ใช้บ่อย
```bash
# dev server
cd maintenance-dashboard && npm run dev            # localhost:3000

# import ข้อมูลจาก Google Sheet (รันจากเครื่อง)
npm run import                                       # หรือ npm run import <sheetUrl>

# typecheck
npx tsc --noEmit

# DB schema
npx prisma db push && npx prisma generate

# deploy
git add ... && git commit -m "..." && git push origin main
```

### สภาพแวดล้อม (จากประวัติ)
- Windows, Git Bash + PowerShell · Node ที่ `C:/Program Files/nodejs/node.exe` · Python/LibreOffice **ไม่มี** (QA สไลด์ทำผ่าน unzip อ่าน XML + computer-use screenshot)
- Neon Postgres us-east-1 (env `DATABASE_URL` ใน `.env`, prod ใน Render env)
- Anthropic co-author trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

## 19. Glossary

| คำ | ความหมาย |
|---|---|
| **MBOS** | Maintenance (Business) Operating System — ชื่อเชิงกลยุทธ์ของโครงการ (แอปชื่อ "Maintenance Operating System") |
| **WO / Work Order** | ใบสั่งงานซ่อมบำรุง |
| **CM** | Corrective Maintenance (งานซ่อมแก้ไข — ขอบเขตปัจจุบัน) |
| **PM** | Preventive Maintenance (บำรุงรักษาตามแผน — Phase 4) |
| **SD / BD** | Shutdown / Breakdown (ช่วงหยุดเดินเครื่อง) |
| **Data_Date** | วันที่ของชุดข้อมูลที่ดึงมา (คอลัมน์ BL ในชีต) = key ของแต่ละ snapshot |
| **Snapshot** | ภาพข้อมูล WO ทั้งหมด ณ Data_Date หนึ่ง (เก็บทุกครั้งที่ import) |
| **Backlog (Total)** | งานที่ยังไม่เริ่ม = Planning Backlog + Backlog(Pending Start); ไม่รวม In Progress/Completed |
| **Planning Backlog** | สถานะ WPLAN/WSCH/WSHUT ("Wait for plan") = ตรงกับนิยาม Backlog ของ Looker |
| **Backlog – Pending Start** | สถานะ WMATL/APPR/WAPPR*/WCONTRACTOR/WCTRLSUP/WCTRLTEAM (รอวัสดุ/อนุมัติ/ผู้รับเหมา) |
| **In Progress** | INPRG/ASSIGNED/RETURNED/REWORK/REJECTED (เริ่มลงมือแล้ว) |
| **Closed** | CLOSE/FORCED_CLOSE/CAN · **Completed** = FINISH/WACCEPT/COMP |
| **Open** | Planning + Backlog + In Progress (ยังไม่ปิด/ยังไม่เสร็จ) |
| **Status A–J** | รหัสสถานะ A–J ตามระบบต้นทาง (แสดงเป็น donut) |
| **RCA** | Root Cause Analysis (แนะนำเมื่อซ่อมซ้ำถี่) |
| **AppData** | ตาราง key-value เก็บ blob ที่เดิมอยู่ localStorage (facilitate/remark/reschedule/equip master) |
| **gviz** | Google Visualization query API (`/gviz/tq?tqx=out:csv&tq=...`) ใช้ดึงข้อมูลจากชีต |
| **BYO key** | Bring-Your-Own key — ผู้ใช้วาง API key ของตัวเอง (Gemini) |
| **Maximo** | ระบบ CMMS ต้นทางของโรง (เป้าหมายเชื่อม API Phase 2) |
| **ThinkAble** | ชื่องานประกวด KM ของโรงไฟฟ้าที่ส่งโครงการนี้เข้าแข่ง |

---

## 20. Handover Notes (ส่งมอบให้ Claude ตัวถัดไป)

**สิ่งที่ต้องรู้ก่อนเริ่มให้คำแนะนำ/พัฒนา:**

1. **เจ้าของคือ Planner (Piyamon W.)** ไม่ใช่นักพัฒนาสาย IT เต็มตัว — อธิบายให้เข้าใจง่าย, ทำงานจริงให้ดู, ไม่ทิ้งให้ทำเองถ้าไม่จำเป็น · สื่อสาร**ภาษาไทย**
2. **เป้าหมายเฉพาะหน้า = งานประกวด ThinkAble (KM)** — งานพัฒนาระบบหลายอย่างมีจุดประสงค์เพื่อพรีเซนต์ ต้องคิดถึงมุมนำเสนอเสมอ (§11)
3. **แก้ UI = `prototype/dashboard.html` เท่านั้น** · deploy = commit + push → Render auto-deploy
4. **DB เป็น Neon ใช้ร่วม local+prod** — แก้ข้อมูลกระทบ production ทันที · **ห้ามลบข้อมูล/snapshot โดยไม่ถาม** (เคยเกิดเหตุลบ 76,810 rows กู้ด้วย Neon PITR)
5. **AI Engineer ใช้ Gemini ฟรี (BYO key)** — เจ้าของยังตั้ง key ไม่สำเร็จ (§16) · ถ้าจะช่วย: อาจเสนอเปลี่ยนเป็น Groq
6. **ผม (Claude) ไม่กรอกรหัสผ่าน/สร้าง API key/ล็อกอินแทนเจ้าของ** — กฎความปลอดภัย · แต่ **ดูหน้าจอผ่าน computer-use ได้** (เจ้าของ login ค้างไว้ ผมแคป/ดูให้)
7. **การ deploy ล่าสุด (commit ล่าสุด `ae69d41`):** เปลี่ยนชื่อเป็น "Maintenance Operating System" · ก่อนหน้า: password management, ตัวเลขบนกราฟ, มุม Data_Date, backlog redefinition, Gemini
8. **ข้อมูลจริงล่าสุด (verified 2026-07-24):** 12 snapshots (2026-04-07 → 2026-07-21) · snapshot ล่าสุด 10,940 WO / Close 7,793 / Total Backlog 2,000 · ตาราง `work_order_snapshots` รวม **97,789 แถว** · ตาราง `work_orders` (latest-per-wo) **12,346 แถว** (มากกว่า 10,940 เพราะเก็บ WO ที่ปิดไปแล้วจาก snapshot เก่าไว้ด้วย) · **ผู้ใช้ 5 คน:**

   | Email | Role | สถานะ |
   |---|---|---|
   | `admin@example.com` | ADMIN | ใช้งานได้ (รหัส `ChangeMe123!` — **ควรเปลี่ยน**) |
   | `tanpiyamon41@gmail.com` | VIEWER | ใช้งานได้ (เจ้าของโครงการ) |
   | `cherdchaiwong@gmail.com` | VIEWER | ใช้งานได้ |
   | `neutron_t@npp.co.th` | VIEWER | ใช้งานได้ |
   | `kaweepak_s@npp.co.th` | VIEWER | ⏳ **รออนุมัติ** (`isActive=false`) |
9. **สไลด์:** เด็คหลัก `slides/Maintenance_KM_5slides.pptx` (build ด้วย `build5.js`) — Dashboard screenshot ใส่แล้ว, Reliability ค้าง
10. **หลักการที่ห้ามลืม:** Business Value > Features · ข้อเท็จจริง > สมมติฐาน · มนุษย์ตัดสินใจสุดท้าย · 0 บาท · non-destructive · ซื่อสัตย์เรื่องข้อจำกัด (§13, §15)

**สรุปสถานะโครงการ ณ วันส่งมอบ:** ระบบใช้งานจริงบน production ครบ 11 โมดูล ต้นทุน 0 บาท · กำลังเตรียมนำเสนอ ThinkAble · งานค้างหลัก = ใส่ screenshot Reliability ลงสไลด์ + ทดสอบ AI + ตั้ง auto-refresh · Roadmap ถัดไป = Real-time (Maximo) → PM → Predictive → Digital Twin

---

## ภาคผนวก A — ข้อมูลจริงทุก Snapshot (verified 2026-07-24)

> Query ตรงจาก Neon Postgres ตาราง `work_order_snapshots` โดยใช้นิยามกลุ่มสถานะเดียวกับเว็บ (§19)
> **ใช้ตารางนี้เป็นแหล่งอ้างอิงตัวเลขสำหรับสไลด์/รายงานทุกครั้ง — ห้ามประมาณเอง**

| Data_Date | Total | Closed | Completed | Planning | Pending Start | In Progress | **Total Backlog** |
|---|---:|---:|---:|---:|---:|---:|---:|
| 2026-04-07 | 5,537 | 3,502 | 175 | 1,250 | 289 | 321 | **1,539** |
| 2026-04-16 | 5,644 | 3,514 | 324 | 1,098 | 349 | 359 | **1,447** |
| 2026-04-23 | 6,042 | 3,605 | 558 | 1,099 | 359 | 421 | **1,458** |
| 2026-05-07 | 6,980 | 4,641 | 209 | 1,390 | 335 | 405 | **1,725** |
| 2026-05-14 | 7,456 | 4,801 | 348 | 1,467 | 374 | 466 | **1,841** |
| 2026-05-21 | 7,843 | 4,985 | 497 | 1,451 | 399 | 511 | **1,850** |
| 2026-05-28 | 8,193 | 5,154 | 727 | 1,368 | 394 | 550 | **1,762** |
| 2026-06-04 | 8,601 | 5,766 | 434 | 1,519 | 391 | 491 | **1,910** |
| 2026-06-20 | 9,393 | 6,449 | 459 | 1,454 | 456 | 575 | **1,910** |
| 2026-07-08 | 10,454 | 7,549 | 303 | 1,529 | 499 | 574 | **2,028** |
| 2026-07-14 | 10,706 | 7,635 | 445 | 1,517 | 501 | 608 | **2,018** |
| 2026-07-21 | 10,940 | 7,793 | 535 | 1,505 | 495 | 612 | **2,000** |

**ข้อสังเกตเชิงวิเคราะห์ (ใช้เล่าเรื่องได้):**
- **Total Backlog: 1,539 → 2,000 = +30.0%** ใน 3.5 เดือน — งานใหม่เข้ามาเร็วกว่าที่ปิดได้ → *นี่คือ "ความรู้ใหม่" ที่ระบบเดิมมองไม่เห็น*
- **แต่แนวโน้มล่าสุดเริ่มดีขึ้น** — Backlog ลดลง 3 สัปดาห์ติด (2,028 → 2,018 → 2,000) และ Close Rate เพิ่มจาก 63.2% (เม.ย.) → **71.2%** (ก.ค.) = ทีมปิดงานได้เก่งขึ้นจริง **(จุดขายที่ควรชูในสไลด์ ไม่ใช่แค่บอกว่า backlog โต)**
- **Planning Backlog นิ่งที่ ~1,500** ขณะที่ Pending Start โตจาก 289 → 495 (+71%) → คอขวดอยู่ที่ **รอวัสดุ/อนุมัติ/ผู้รับเหมา** ไม่ใช่ที่การวางแผน → *ข้อเสนอเชิงนโยบายที่ระบบชี้ให้เห็นได้*
- ช่องว่างข้อมูล: ไม่มี snapshot ช่วง 2026-06-04 → 06-20 และ 06-20 → 07-08 (import เว้นช่วง) — ถ้าตั้ง auto-refresh จะได้เส้นต่อเนื่อง

**วิธี re-run ตารางนี้เอง** (สร้างไฟล์ชั่วคราวใน repo แล้วลบทิ้ง — ต้องมี `.env` ที่มี `DATABASE_URL`):
```bash
node ./node_modules/tsx/dist/cli.mjs _tmp_facts.ts
```
สคริปต์: import `PrismaClient` จาก `./src/generated/prisma/client` + `PrismaPg` adapter (Prisma 7 **บังคับ** ต้องมี adapter ไม่งั้น error) → `groupBy dataDate,status` → จัดกลุ่มด้วยฟังก์ชันเดียวกับ §19

---

## ภาคผนวก B — ประวัติการเปลี่ยนแปลงของเอกสารนี้

| วันที่ | การเปลี่ยนแปลง |
|---|---|
| 2026-07-23 | สร้างเอกสารฉบับแรก (20 หัวข้อ) |
| 2026-07-24 | ตรวจสอบตัวเลขทั้งหมดกับ DB จริง · แก้ Backlog +31%→**+30.0%** (snapshot ใหม่) · แก้ path สไลด์ (อยู่นอก repo) · เพิ่มแผนผังโฟลเดอร์ · เพิ่มรายชื่อผู้ใช้จริง · เพิ่มภาคผนวก A (ตาราง 12 snapshot) · commit เข้า git ครั้งแรก |

---
*จบเอกสาร PROJECT_CONTEXT.md — หากมีการตัดสินใจสำคัญใหม่ในอนาคต ให้อัปเดตไฟล์นี้เป็นอันดับแรก*
