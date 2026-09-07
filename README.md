# 🚖 CabGo — Cab Management System

A **full-stack, production-grade** Cab Management System built with:

- **Frontend**: React 18 + React Router + Recharts + Socket.io-client
- **Backend**: Node.js + Express.js + Socket.io
- **Database**: MySQL 8.0
- **Real-time**: Socket.io (live ride tracking)
- **Theme**: Light theme only, Outfit font

---

## 📁 Folder Structure

```
cab-management-system/
├── backend/
│   ├── config/
│   │   └── db.js                  # MySQL connection pool
│   ├── controllers/
│   │   ├── customerController.js
│   │   ├── driverController.js
│   │   ├── rideController.js
│   │   ├── paymentController.js
│   │   ├── feedbackController.js
│   │   └── reportController.js
│   ├── routes/
│   │   ├── customers.js
│   │   ├── drivers.js
│   │   ├── rides.js
│   │   ├── payments.js
│   │   ├── feedback.js
│   │   └── reports.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── common/index.js     # Reusable UI components
│       │   └── layout/Navbar.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── pages/
│       │   ├── HomePage.js
│       │   ├── customer/
│       │   │   ├── Register.js
│       │   │   └── Login.js
│       │   ├── driver/
│       │   │   └── DriverRegister.js
│       │   ├── rides/
│       │   │   ├── RideBooking.js
│       │   │   └── MyRides.js
│       │   └── admin/
│       │       └── AdminDashboard.js
│       ├── utils/
│       │   ├── api.js              # Axios instance
│       │   └── socket.js           # Socket.io client
│       ├── App.js
│       ├── index.js
│       └── index.css
│
└── database/
    ├── schema.sql                  # All CREATE TABLE statements
    └── seed.sql                    # Sample data
```

---

## ✅ Prerequisites

Make sure you have these installed:

| Tool      | Version  | Download |
|-----------|----------|----------|
| Node.js   | ≥ 18.x   | https://nodejs.org |
| npm       | ≥ 9.x    | (comes with Node) |
| MySQL     | ≥ 8.0    | https://dev.mysql.com/downloads/ |
| Git       | any      | https://git-scm.com |

---

## 🚀 Step-by-Step Setup

### Step 1 — Set up the Database

1. Open **MySQL Workbench** or your terminal and log in:
   ```bash
   mysql -u root -p
   ```

2. Run the schema file:
   ```sql
   SOURCE /path/to/cab-management-system/database/schema.sql;
   ```

3. Run the seed data:
   ```sql
   SOURCE /path/to/cab-management-system/database/seed.sql;
   ```

   *(Replace `/path/to/` with your actual folder path)*

   **Windows example:**
   ```sql
   SOURCE C:/Users/YourName/Downloads/cab-management-system/database/schema.sql;
   SOURCE C:/Users/YourName/Downloads/cab-management-system/database/seed.sql;
   ```

---

### Step 2 — Configure the Backend

1. Navigate to the backend folder:
   ```bash
   cd cab-management-system/backend
   ```

2. Open `.env` and update your MySQL credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   DB_NAME=cab_management
   CLIENT_URL=http://localhost:3000
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the backend server:
   ```bash
   # Development (with auto-restart)
   npm run dev

   # OR Production
   npm start
   ```

   You should see:
   ```
   🚀  CabGo backend running at http://localhost:5000
   📡  Socket.io ready
   ✅  MySQL connected successfully
   ```

---

### Step 3 — Set up the Frontend

1. Open a **new terminal** and navigate to the frontend:
   ```bash
   cd cab-management-system/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

   The app will open automatically at **http://localhost:3000**

---

## 🌐 Accessing the App

| URL                                  | Description              |
|--------------------------------------|--------------------------|
| http://localhost:3000                | Home page                |
| http://localhost:3000/register       | Customer registration    |
| http://localhost:3000/login          | Customer login           |
| http://localhost:3000/driver-register| Driver registration      |
| http://localhost:3000/book           | Book a ride (login req.) |
| http://localhost:3000/my-rides       | My rides & tracking      |
| http://localhost:3000/admin          | Admin dashboard          |
| http://localhost:5000/api/health     | Backend health check     |

---

## 🔑 Demo Credentials

**Customer Login:**
- Email: `amit@email.com`
- Password: `pass123`

(More demo customers: priya@email.com, rahul@email.com, sneha@email.com — all use `pass123`)

**Demo: Driver Login**
Go to /driver-login and click any of the 3 demo drivers shown, or use:
- Phone: 9111222333 · License: KA01-20234567 (Suresh Kumar)
- Phone: 9555666777 · License: AP05-20238901 (Vijay Rao)

---

## 🔌 API Endpoints

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/customers | All customers |
| POST   | /api/customers/register | Register |
| POST   | /api/customers/login | Login |
| GET    | /api/customers/:id/history | Ride history |
| PUT    | /api/customers/:id | Update |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/drivers | All drivers |
| GET    | /api/drivers/available | Available only |
| POST   | /api/drivers/register | Register |
| PATCH  | /api/drivers/:id/verify | Verify (admin) |
| PATCH  | /api/drivers/:id/availability | Toggle status |
| GET    | /api/drivers/earnings | Earnings report |

### Rides
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/rides | All rides |
| GET    | /api/rides/active | Active rides |
| POST   | /api/rides | Book a ride |
| PATCH  | /api/rides/:id/start | Start ride |
| PATCH  | /api/rides/:id/end | End ride |
| PATCH  | /api/rides/:id/cancel | Cancel |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/payments | All payments |
| POST   | /api/payments | Make payment |
| PATCH  | /api/payments/:id/refund | Refund |

### Feedback
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/feedback | All feedback |
| POST   | /api/feedback | Submit |
| GET    | /api/feedback/ratings | Rating report |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/reports/dashboard | Stats summary |
| GET    | /api/reports/daily-trips | Daily trips |
| GET    | /api/reports/revenue-type | By ride type |
| GET    | /api/reports/top-customers | Top spenders |

---

## ⚡ Real-time Socket Events

| Event | Trigger | Description |
|-------|---------|-------------|
| `rideAccepted` | Ride booked | Notifies all clients |
| `rideStarted` | Ride started | Updates live dashboard |
| `rideCompleted` | Ride ended | Updates trackers |
| `paymentDone` | Payment made | Updates payment status |
| `driverLocationUpdate` | Every 3s (simulated) | Mock GPS updates |

---

## 🎯 System Logic

- **One active ride per customer** — enforced at API level
- **Driver must be Verified** to appear in search
- **Fare formula** = ₹40 (base) + ₹{rate}/km × distance
  - Standard: ₹12/km · Premium: ₹20/km · SUV: ₹18/km · Auto: ₹8/km
- **Ride lifecycle**: Pending → Accepted → Ongoing → Completed → Payment → Feedback
- **Auto-assign**: Picks highest-rated Available + Verified driver
- **AVG_RATING**: Recalculated automatically on every new feedback

---

## 🛠 Troubleshooting

**MySQL connection error:**
- Verify credentials in `backend/.env`
- Ensure MySQL service is running: `sudo service mysql start` (Linux) or via Services (Windows)

**Port 3000 already in use:**
```bash
# Kill process on port 3000
npx kill-port 3000
```

**npm install fails:**
```bash
npm install --legacy-peer-deps
```

**Recharts/socket.io peer dep warning:**
This is cosmetic only, the app will still work. Use `--legacy-peer-deps` if needed.

---

## 📝 Notes

- Passwords are stored in plain text for demo purposes. In production, use `bcrypt`.
- The admin panel at `/admin` has no authentication (demo mode). Add JWT in production.
- Socket.io connects to `http://localhost:5000` directly. If you change the port, update `frontend/src/utils/socket.js`.
