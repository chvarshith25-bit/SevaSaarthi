# GOVERNMENT PORTAL ROUTE & INFORMATION ARCHITECTURE AUDIT
**Comprehensive Inventory of Existing Routes, Roles, Redundancies, and Canonical Mapping**

---

## 1. INVENTORY OF CURRENT GOVERNMENT ROUTES

| Current Route | Page / Component File | Primary Purpose | API Dependencies | Linked From | Linked To | Functional? | Status / Classification | Target Canonical Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| `/government` | `src/app/government/page.tsx` | Portal root entry point | None (Redirect) | Root URL | `/government/dashboard` | **YES** | Officer-Facing Root | Redirect to `/government/dashboard` |
| `/government/login` | `src/app/government/login/page.tsx` | Officer authentication | `/api/gov/auth/login` | Unauthenticated requests | `/government/dashboard` | **YES** | Auth Gateway | Preserve at `/government/login` |
| `/government/dashboard` | `src/app/government/dashboard/page.tsx` | Primary operational overview | `/api/gov/applications`, `/api/gov/me` | Sidebar, Login | `/government/applications/[id]` | **YES** | Primary Officer-Facing | **Canonical Redesign: Dashboard** |
| `/government/applications` | `src/app/government/applications/page.tsx` | Unified Application Queue | `/api/gov/applications` | Sidebar, KPI Cards | `/government/applications/[id]` | **YES** | Primary Officer-Facing | **Canonical Redesign: My Applications** |
| `/government/applications/[id]` | `src/app/government/applications/[id]/page.tsx` | Application Review Workspace | `/api/gov/applications/[id]` | Applications Table, Search | `/government/applications` | **YES** | Primary Officer-Facing | **Canonical Redesign: Application Detail** |
| `/government/my-queue` | `src/app/government/my-queue/page.tsx` | Officer's personal assignments | `/api/gov/applications` | Old Sidebar | `/government/applications/[id]` | **YES** | Duplicate / Fragmented | Redirect $\to$ `/government/applications?tab=assigned` |
| `/government/queue` | `src/app/government/queue/page.tsx` | Legacy alias for applications | `/api/gov/applications` | Old Links | `/government/applications/[id]` | **YES** | Duplicate Alias | Redirect $\to$ `/government/applications` |
| `/government/exceptions` | `src/app/government/exceptions/page.tsx` | Exceptions & conflict resolution | `/api/gov/exceptions` | Sidebar, Alert Badges | `/government/applications/[id]` | **YES** | Primary Officer-Facing | **Canonical Redesign: Exceptions** |
| `/government/audit` | `src/app/government/audit/page.tsx` | SHA-256 Audit Trail & Logs | `/api/gov/audit` | Sidebar, App Detail | None | **YES** | Primary Officer-Facing | **Canonical Redesign: Audit & Activity** |
| `/government/interoperability` | `src/app/government/interoperability/page.tsx` | Connector health & gateway registry | `/api/gov/connectors` | Old Sidebar | None | **YES** | Admin/Supervisor-Facing | Move $\to$ Admin Section (`/government/admin/interoperability`) |
| `/government/data-mapper` | `src/app/government/data-mapper/page.tsx` | Canonical schema field mappings | `/api/gov/data-mapper` | Old Sidebar | None | **YES** | Admin/Supervisor-Facing | Move $\to$ Admin Section (`/government/admin/data-mapper`) |
| `/government/workflows` | `src/app/government/workflows/page.tsx` | Workflow definition visualizer | Local/DB Schema | Old Sidebar | None | **YES** | Admin/Supervisor-Facing | Move $\to$ Admin Section (`/government/admin/workflows`) |
| `/government/monitoring` | `src/app/government/monitoring/page.tsx` | SLA & Operational reporting | `/api/gov/applications` | Old Sidebar | None | **YES** | Admin/Supervisor-Facing | Move $\to$ Admin Section (`/government/admin/monitoring`) |
| `/government/settings` | `src/app/government/settings/page.tsx` | Department resource configs | `/api/gov/me` | Old Sidebar | None | **YES** | Admin/Supervisor-Facing | Move $\to$ Admin Section (`/government/admin/settings`) |
| `/gov/*` (Aliases) | `src/app/gov/*` | Legacy `/gov/` route namespace | All respective APIs | External Links | Respective pages | **YES** | Legacy Namespace | Clean 301/308 redirects $\to$ `/government/*` |

---

## 2. USER ROLE DEFINITION & INFORMATION ARCHITECTURE

```
+----------------------------------------------------------------------------------------------------+
|                                    SEVA SAARTHI ROLE SEPARATION                                     |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   NORMAL GOVERNMENT OFFICER ROLE (Operational Workflows)                                           |
|   ┌────────────────────────────────────────────────────────────────────────────────────────────┐   |
|   │  1. Dashboard               -> Overview, KPIs, urgent tasks, AI assistance summary         │   |
|   │  2. My Applications         -> Single unified workspace with filters (Assigned, Needs...)   │   |
|   │  3. Review & Decisions      -> Deep application detail with Model 1 & Model 2 V4.2 evidence │   |
|   │  4. Exceptions              -> Actionable issues (API, identity conflict, SLA risk)       │   |
|   │  5. Audit & Activity        -> Immutable SHA-256 event trail and officer action logs       │   |
|   └────────────────────────────────────────────────────────────────────────────────────────────┘   |
|                                                                                                    |
|   ADMIN / SUPERVISOR ROLE (Configuration & Infrastructure)                                         |
|   ┌────────────────────────────────────────────────────────────────────────────────────────────┐   |
|   │  • Interoperability Hub     -> Connector circuit-breakers & gateway health                 │   |
|   │  • Data Mapper              -> Canonical field mappings & transformations                  │   |
|   │  • Workflows                -> Statutory routing definitions & state rules                 │   |
|   │  • Reports & SLA Analytics  -> Throughput, backlog, SLA monitoring                         │   |
|   │  • Department Resources     -> Jurisdiction configs & office allocations                   │   |
|   │  • System Settings          -> Security parameters & role permissions                      │   |
|   └────────────────────────────────────────────────────────────────────────────────────────────┘   |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. CANONICAL ROUTE DESTINATION MAPPING

| Canonical Destination | Route Path | Primary Officer Sidebar? | Admin Only? | Redirects From |
| :--- | :--- | :---: | :---: | :--- |
| **Officer Dashboard** | `/government/dashboard` | **YES (Item 1)** | No | `/government`, `/gov`, `/gov/dashboard` |
| **Unified Applications** | `/government/applications` | **YES (Item 2)** | No | `/government/queue`, `/gov/queue`, `/gov/applications`, `/government/my-queue` |
| **Application Detail** | `/government/applications/[id]` | Accessible via Table | No | `/gov/workspace/[id]`, `/government/workspace/[id]` |
| **Review & Decisions** | `/government/applications?tab=review` | **YES (Item 3)** | No | `/government/review`, `/gov/review` |
| **Exceptions & Conflicts** | `/government/exceptions` | **YES (Item 4)** | No | `/gov/exceptions` |
| **Audit & Activity** | `/government/audit` | **YES (Item 5)** | No | `/gov/audit` |
| **Officer Profile** | `/government/profile` | Header Menu | No | `/gov/profile`, `/gov/settings?tab=profile` |
| **Admin Operations Hub** | `/government/admin` | Role-Controlled | **YES** | None |
| **Admin Interoperability** | `/government/admin/interoperability` | Admin Submenu | **YES** | `/government/interoperability`, `/gov/interoperability` |
| **Admin Data Mapper** | `/government/admin/data-mapper` | Admin Submenu | **YES** | `/government/data-mapper`, `/gov/data-mapper` |
| **Admin Workflows** | `/government/admin/workflows` | Admin Submenu | **YES** | `/government/workflows`, `/gov/workflows` |
| **Admin SLA & Reports** | `/government/admin/monitoring` | Admin Submenu | **YES** | `/government/monitoring`, `/gov/monitoring` |
| **Admin Resources & Settings** | `/government/admin/settings` | Admin Submenu | **YES** | `/government/settings`, `/gov/settings` |

---

## 4. REDUNDANCY ELIMINATION & CONSOLIDATION SUMMARY

1. **Sidebar Items Reduced:** From 14 cluttered items down to strictly **5 primary items** (`Dashboard`, `My Applications`, `Review & Decisions`, `Exceptions`, `Audit & Activity`).
2. **Tabbed Workspace:** "My Assignments", "Returned Applications", and "Needs Action" are consolidated as interactive filter tabs inside the unified `/government/applications` page.
3. **Admin Segregation:** Developer/supervisor tooling moved into a dedicated `/government/admin` section visible only when admin role or toggle is active.
4. **Clean Backward-Compatible Routing:** All legacy `/gov/*` and duplicate `/government/*` routes redirect cleanly with HTTP 307/308 or Next.js router transitions without breaking existing bookmarks or API endpoints.
