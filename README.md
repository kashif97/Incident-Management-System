# 🚨 Incident Management System

A full-stack web application for tracking and managing technical incidents with role-based access control and SLA monitoring.

## ✨ Features

- 🔐 **User Authentication** - Secure login with JWT tokens
- 👥 **Role-Based Access** - Three user roles: Reporter, Resolver, Manager
- 📋 **Incident Management** - Create, update, and track incidents
- ⏱️ **SLA Tracking** - Monitor response and resolution time limits
- 📝 **Audit Logging** - Track all system activities

## 🛠️ Tech Stack

- ⚛️ **Frontend:** React.js
- ☕ **Backend:** Java Spring Boot
- 🗄️ **Database:** MySQL
- 🔒 **Security:** JWT Authentication

## 👤 User Roles

| Role | Permissions |
|------|-------------|
| 📢 Reporter | Create incidents, view own tickets |
| 🔧 Resolver | Assign tickets, update status, add notes |
| 👨‍💼 Manager | View all tickets, reassign, access audit logs |

## 📦 Installation

### Prerequisites
- ☕ Java 17
- 📦 Node.js & npm
- 🗄️ MySQL

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kashif97/Incident-Management-System.git
   cd Incident-Management-System-main
   ```

2. **Backend Setup**
   - Open `IMS-Backend` in IntelliJ IDEA
   - Update MySQL credentials in `src/main/resources/application.properties`
   - Run the Spring Boot application

3. **Frontend Setup**
   ```bash
   cd IMS-Frontend
   npm install
   npm start
   ```
   The app will run on `http://localhost:3000`

## 📁 Project Structure

```
Incident-Management-System-main/
├── IMS-Backend/          # Spring Boot backend
├── IMS-Frontend/         # React frontend
├── jmeter-test-plans/    # Performance testing
└── README.md
```

## 📊 Current Status

- ✅ Authentication & Authorization
- ✅ Incident CRUD Operations
- ✅ SLA Monitoring
- ✅ Audit Logging
