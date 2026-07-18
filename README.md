# Incident-Management-System
# 🛠️ Incident Management System (IMS)

A professional, full-stack Enterprise Support platform designed to automate IT service desk workflows, track Service Level Agreements (SLAs), and ensure organizational accountability.

---

## 🌟 Project Overview
This IMS provides a centralized hub for reporting, tracking, and resolving technical issues. It implements **Complex Business Logic**, including automated SLA breach detection, role-based workflows, and a secure audit trail.

### **Current Status: 90% Completed**
- [x] JWT-based Authentication & Role-Based Access Control (RBAC)
- [x] Full CRUD operations for Incident lifecycle
- [x] SLA Logic Engine (Response & Resolution tracking)
- [x] Audit Logging for all system actions
- [ ] Final UI Polish & Analytics Charts (In Progress)

---

## 🏗️ Architecture & Tech Stack

The system follows a modern decoupled architecture, ensuring a clean separation between the business logic and the user interface.

- **Frontend:** React.js (Hooks, Context API, Axios)
- **Backend:** Java 17, Spring Boot, Spring Security
- **Database:** MySQL (Relational persistence)
- **Security:** JWT (JSON Web Tokens) & BCrypt Password Hashing
- **API Testing:** Postman

---

## 🔐 Role-Based Access Control (RBAC)

Access is strictly governed by user roles. The system validates the `role_code` on every API request.

| Role | Key Permissions |
| :--- | :--- |
| **Reporter** | Raise new incidents, track personal tickets, and provide updates. |
| **Resolver** | Claim/Assign tickets, update status (In Progress/Resolved), and manage technical notes. |
| **Manager** | Full system visibility, reassign tickets, monitor SLA breaches, and access Audit Logs. |

---

## ⏲️ SLA Logic Engine

A standout feature of this project is the custom-built SLA engine that calculates deadlines based on priority levels:
- **Response SLA:** Ensures the team acknowledges an incident within the required time.
- **Resolution SLA:** Tracks the total time taken to move a ticket to a "Resolved" state.
- **Automated Breaches:** Utilizes JPA lifecycle hooks (`@PrePersist`) to ensure data integrity and prevent `null` constraints during automated flag updates.

---

## 🚀 Technical Challenges Overcome

### 1. Handling Type Mismatches (Instant vs LocalDateTime)
**Challenge:** The database stored audit logs in `Instant` (UTC), but the frontend required `LocalDateTime` in IST for Indian users.
**Solution:** Implemented a robust conversion layer in the DTO (Data Transfer Object) using `ZoneId.of("Asia/Kolkata")` to ensure accurate local reporting.

### 2. Database Constraint Integrity
**Challenge:** Encountered `Column 'resolution_breached' cannot be null` errors during API testing when fields were not explicitly sent.
**Solution:** Fixed by using `@Builder.Default` in Lombok and `@PrePersist` methods in the Entity layer to ensure all boolean flags are initialized to `false` automatically.

---

## 🛠️ Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/harishankar004/ims-project.git](https://github.com/harishankar004/ims-project.git)
2. Backend (Spring Boot):

Import as a Maven project in IntelliJ.

Update src/main/resources/application.properties with your MySQL credentials.

Run the application.
3. Frontend (React):

Navigate to the IMS-Frontend folder.

Run npm install to install dependencies.

Run npm start to launch the dev server on localhost:3000.
