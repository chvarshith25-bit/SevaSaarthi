# Database & Cloud Infrastructure Configuration Map

This document records the exact cloud accounts, project identifiers, and connection configurations used for **SevaSaarthi** and **Sarkar Seva**.

---

## 🏛️ 1. Supabase Database & Backend

| Attribute | Value / Details |
| :--- | :--- |
| **Supabase Organization** | `SIH2026` |
| **Project Name** | `sarkarseva` |
| **Project Reference ID** | `judyszuwpafqyeiqdubx` |
| **Project URL** | `https://judyszuwpafqyeiqdubx.supabase.co` |
| **Cloud Hosting Region** | `ap-northeast-1` (Northeast Asia / Tokyo) |
| **Database Engine** | PostgreSQL 17 |
| **Pooler Host** | `aws-0-ap-northeast-1.pooler.supabase.com` |
| **Pooler User** | `postgres.judyszuwpafqyeiqdubx` |
| **Pooler Port** | `6543` (Transaction Mode) / `5432` (Session Mode) |
| **Database URL (Vercel & Local)** | `postgres://postgres.judyszuwpafqyeiqdubx:Varshith%409866@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres` |

---

## 🌐 2. Vercel Production Deployments

| Platform | Production URL | Vercel Project Name | Scope / Team |
| :--- | :--- | :--- | :--- |
| **🏛️ Sarkar Seva (Gov Operations)** | **[https://sarkarseva-three.vercel.app](https://sarkarseva-three.vercel.app)** | `sarkarseva` | `vk-7040` (`chvarshith25-bit`) |
| **🇮🇳 SevaSaarthi (Citizen Platform)** | **[https://seva-saarthi-roan.vercel.app](https://seva-saarthi-roan.vercel.app)** | `seva-saarthi` | `vk-7040` (`chvarshith25-bit`) |

### Configured Environment Variables on Vercel:
- `DATABASE_URL`: `postgres://postgres.judyszuwpafqyeiqdubx:Varshith%409866@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`
- `NEXT_PUBLIC_SUPABASE_URL`: `https://judyszuwpafqyeiqdubx.supabase.co`
- `DATABASE_MODE`: `production`

---

## 👥 3. Seeded Accounts & Credentials

### Government Officer Persona (Sarkar Seva)
* **Portal:** `https://sarkarseva-three.vercel.app/login` (or `http://localhost:3001/login`)
* **Officer ID / Email:** `sankeerthvss@gmail.com`
* **Password:** `1234567890`
* **Employee Code:** `OFF-PAN-7042`
* **Department:** Income Tax Department (CBDT) - PAN Division
* **Office:** Regional Processing Cell, Hyderabad

### Alternative Officer & Administrative Personas
* **Department Admin:** `rajesh.sharma@incometax.gov.in` | Password: `govsecure2026` (Desk `ADM-PAN-1001`)
* **System Admin:** `vikram.rao@negd.gov.in` | Password: `govsecure2026` (Desk `SYS-ROOT-0099`)

### Citizen Persona (SevaSaarthi)
* **Portal:** `https://seva-saarthi-roan.vercel.app/login` (or `http://localhost:3000/login`)
* **Email:** `sankeerths615@gmail.com`
* **Password:** `1234567890`
* **Citizen Name:** Sai Sankeerth
* **Seeded Applications:** `PAN-2026-0001`, `SCH-2026-0042`
