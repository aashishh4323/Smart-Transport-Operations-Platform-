# 🚚 TransitOps – Smart Transport Operations Platform

A centralized transport operations platform designed to manage fleet operations, driver management, trip scheduling, maintenance, fuel tracking, and operational analytics.

This project was developed as part of a Transport Management Hackathon.

---

## 📌 Project Overview

TransitOps digitizes the complete transport lifecycle by replacing spreadsheets and manual logbooks with a centralized database-driven system.

The platform helps organizations manage:

- Vehicle Registry
- Driver Management
- Trip Management
- Maintenance Records
- Fuel & Expense Tracking
- Fleet Analytics
- Role-Based Access Control (RBAC)

---

## 🎯 Objectives

- Manage vehicles and drivers efficiently
- Prevent scheduling conflicts
- Track maintenance history
- Monitor fuel usage and operational costs
- Generate operational insights
- Enforce business rules using PostgreSQL constraints and triggers

---

## 🛠 Tech Stack

- PostgreSQL
- SQL
- PL/pgSQL
- Git
- GitHub

---

## 📂 Database Modules

### Authentication & Roles
- User Management
- Role-Based Access Control (RBAC)

### Vehicle Registry
- Vehicle Registration
- Vehicle Status
- Odometer Tracking
- Load Capacity
- Acquisition Cost

### Driver Management
- Driver Profiles
- License Information
- License Expiry
- Safety Score
- Driver Status

### Trip Management
- Trip Creation
- Vehicle Assignment
- Driver Assignment
- Cargo Validation
- Trip Lifecycle

### Maintenance
- Maintenance Logs
- Automatic Vehicle Status Updates

### Fuel & Expense Management
- Fuel Logs
- Maintenance Costs
- Other Operational Expenses

### Reports & Analytics
- Fleet Utilization
- Fuel Efficiency
- Operational Cost
- Vehicle ROI

---

# 🗄 Database Schema

The project contains tables such as:

- Users
- Roles
- Vehicles
- Drivers
- Trips
- Maintenance Logs
- Fuel Logs
- Expenses

---

# ⚙ Business Rules Implemented

✔ Vehicle registration number must be unique.

✔ Retired or In-Shop vehicles cannot be assigned to trips.

✔ Drivers with expired licenses cannot be assigned.

✔ Suspended drivers cannot be dispatched.

✔ Vehicles or drivers already on a trip cannot be reassigned.

✔ Cargo weight cannot exceed vehicle capacity.

✔ Dispatching a trip automatically changes:

- Vehicle → On Trip
- Driver → On Trip

✔ Completing a trip automatically changes:

- Vehicle → Available
- Driver → Available

✔ Maintenance automatically changes vehicle status to **In Shop**.

✔ Closing maintenance restores vehicle availability.

---

# 🔄 Trip Workflow

Vehicle Registration
        ↓
Driver Registration
        ↓
Create Trip
        ↓
Validate Business Rules
        ↓
Dispatch Trip
        ↓
Vehicle & Driver → On Trip
        ↓
Complete Trip
        ↓
Vehicle & Driver → Available
        ↓
Maintenance (Optional)
        ↓
Vehicle → In Shop
        ↓
Reports Updated

---

# 📊 Features

- Vehicle Management
- Driver Management
- Trip Scheduling
- Maintenance Tracking
- Fuel Logging
- Expense Tracking
- Status Automation
- Fleet Analytics
- PostgreSQL Triggers
- Constraints
- Stored Procedures
- Views

---

# 📁 Project Structure

```
TransitOps/
│
├── schema.sql
├── tables.sql
├── constraints.sql
├── triggers.sql
├── functions.sql
├── procedures.sql
├── views.sql
├── sample_data.sql
├── README.md
└── transitops.sql
```

---

# 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/your-username/TransitOps.git
```

### Open PostgreSQL

Create a new database:

```sql
CREATE DATABASE transitops;
```

Connect to the database:

```sql
\c transitops
```

Import the SQL file:

```bash
psql -U postgres -d transitops -f transitops.sql
```

---

# 📈 Future Improvements

- Web Dashboard
- PDF Reports
- CSV Export
- Email Notifications
- Vehicle Document Management
- Dark Mode
- Interactive Charts

---

# 👨‍💻 Contributors

- Ashish Kumar
- Jagan K Swain
- Ayoan Singh
- Nitin Anand 

---

# 📄 License

This project was developed for educational and hackathon purposes.
