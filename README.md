# Smart Transport Operations Platform (TransitOps)

TransitOps is a comprehensive web-based logistics and transport management platform designed to streamline fleet tracking, driver assignments, trip dispatching, maintenance scheduling, and operational expense logging. Built with strict business rules and Role-Based Access Control (RBAC), it ensures that your fleet operates safely, efficiently, and transparently.

## 🚀 Tech Stack

- **Framework:** Next.js (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, modern glassmorphism UI
- **Components:** Base UI, custom Shadcn UI-inspired components, Lucide Icons
- **Database ORM:** Prisma
- **Database:** PostgreSQL
- **Data Validation:** Zod

## ✨ Key Features

1. **Fleet Management**
   - Register and track vehicles (vans, buses, trucks, coaches).
   - Monitor vehicle status (Available, OnTrip, InShop, Retired), capacities, and odometers.

2. **Driver Management**
   - Track driver profiles, contact details, safety scores, and license expirations.
   - Automatically prevent expired drivers from being assigned to trips.

3. **Trip Dispatch & Execution**
   - Create Draft trips and transition them to Dispatched, Completed, or Cancelled.
   - **Strict Business Logic Validation:** 
     - Cargo weight cannot exceed vehicle capacity.
     - Vehicle and driver must both be marked as "Available".
     - Driver's license must not be expired prior to dispatch.

4. **Maintenance Logging**
   - Log vehicles into the workshop (moves status to `InShop`).
   - Track repair costs, descriptions, and close maintenance tickets to return vehicles to active service.

5. **Operational Expenses**
   - Log fuel consumption and costs directly against specific vehicles and trips.
   - Track miscellaneous operational expenses (tolls, repairs, etc.).
   - Calculate total operational cost overviews dynamically.

6. **Role-Based Access Control (RBAC)**
   - Secure API routes with explicit role requirements (e.g., `Admin`, `FleetManager`, `Dispatcher`, `SafetyOfficer`, `FinancialAnalyst`).

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL instance running locally or via a cloud provider.

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root of your project and configure your database URL:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/transitops?schema=public"
   ```

3. **Database Setup:**
   Run Prisma migrations to generate the schema and the client:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed the Database:**
   Populate the database with initial Indian-context data (vehicles, drivers, default users):
   ```bash
   npm run prisma db seed
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗄️ Database Schema Overview

The Prisma schema comprises the following core models:
- **User / Session:** For authentication and authorization.
- **Vehicle:** Tracks hardware assets, odometer, and capacity.
- **Driver:** Tracks personnel, licenses, and safety metrics.
- **Trip:** Connects a Driver, a Vehicle, and a route (Source/Destination).
- **MaintenanceLog:** Tracks workshop repairs and costs.
- **FuelExpenseLog:** Tracks fuel purchases and toll costs.

## 🔒 Permissions Map
- **Fleet Manager:** Can add/edit vehicles, dispatch trips, open maintenance, and log fuel.
- **Dispatcher:** Can manage draft trips, dispatch trips, assign drivers, and log fuel.
- **Safety Officer:** Can suspend drivers and open vehicle maintenance.
- **Financial Analyst:** Can view and log operational expenses (Fuel, Tolls, Other).

---
*Designed for efficient transit and logistics management.*
