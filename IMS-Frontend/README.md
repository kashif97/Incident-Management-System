# IMS Frontend — React.js

A complete, production-grade **Incident Management System** frontend built with React 18,
connected to the IMS Spring Boot backend.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- IMS Backend running on `http://localhost:8080`

### Install & Run
```bash
npm install
npm start
```
Opens at **http://localhost:3000**

### Build for Production
```bash
npm run build
```

---

## 🔐 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@123` |

> Create other users via **Admin → User Management** after first login.

---

## 🗺️ Role-Based Navigation

| Role | Available Pages |
|------|----------------|
| **ADMIN** | Dashboard, User Management, SLA Config, Audit Logs |
| **REPORTER** | Dashboard, My Incidents, Raise Incident |
| **RESOLVER** | Dashboard, All Incidents, Assigned to Me, Incident Detail |
| **INC_MANAGER** | Dashboard, Incident Queue, Log Incident, SLA Monitor, Escalations |
| **All Roles** | Notifications, Incident Detail |

---

## 📁 Project Structure

```
src/
├── api/           # Axios API layer — all backend calls
├── context/       # AuthContext — global auth state
├── utils/         # Helpers — formatting, constants
├── styles/        # globals.css — complete design system
├── components/
│   ├── common/    # Reusable UI (Avatar, Badge, Modal, Toast, etc.)
│   └── layout/    # AppLayout (sidebar + topbar)
└── pages/
    ├── auth/      # LoginPage
    ├── dashboard/ # DashboardPage (role-aware KPIs + charts)
    ├── incidents/ # List, Raise, Detail
    ├── admin/     # User Management, SLA Config, Audit Logs
    ├── manager/   # SLA Monitor, Escalations
    └── notifications/ # NotificationsPage
```

---

## 🔌 Backend API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/login` | Login |
| `GET /api/incidents` | All incidents (with filters) |
| `GET /api/incidents/my` | Reporter's own incidents |
| `GET /api/incidents/{id}` | Incident detail |
| `POST /api/incidents` | Create incident |
| `PATCH /api/incidents/{id}/assign` | Assign to resolver |
| `PATCH /api/incidents/{id}/status` | Change status |
| `POST /api/incidents/{id}/comments` | Add comment |
| `GET /api/incidents/dashboard/kpi` | Dashboard KPIs |
| `GET /api/admin/users` | List users |
| `POST /api/admin/users` | Create user |
| `PUT /api/admin/users/{id}` | Update user |
| `DELETE /api/admin/users/{id}` | Deactivate user |
| `GET /api/admin/users/by-role/{role}` | Resolvers list |
| `GET/POST/PUT/DELETE /api/admin/slas` | SLA CRUD |
| `GET /api/admin/audit` | Audit logs |
| `GET /api/categories` | Categories list |
| `GET /api/notifications` | Notifications |
| `PATCH /api/notifications/mark-all-read` | Mark all read |

---

## 🎨 Design System

Built with **Inter** font and a custom CSS design system in `src/styles/globals.css`.
No external UI library — pure CSS with CSS custom properties.

- Clean enterprise aesthetic
- Color-coded status and priority badges
- Responsive sidebar navigation
- Role-aware KPI dashboards with Recharts
- Real-time notification bell
- Toast notifications
- Animated modals

---

## ⚙️ Environment Variables

Create a `.env` file in the root:
```
REACT_APP_API_URL=http://localhost:8080
```
Default proxy is already set to `http://localhost:8080` in `package.json`.
