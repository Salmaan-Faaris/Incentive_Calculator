# IncentIQ — Toyota Nippon Internal Platform

IncentIQ is a modern, real-time incentive calculation and management platform built specifically for **Toyota Nippon's** sales officers and management. The application streamlines the process of tracking car sales, automatically calculating tiered performance incentives, and providing administrators with a bird's-eye view of team performance via a dynamic leaderboard.

## ✨ Key Features

**For Sales Officers:**
- **Real-Time Calculator:** Log car sales and watch incentives compute dynamically based on current tiered commission slabs (Progressive or Flat-rate).
- **Monthly Submissions:** Submit finalized monthly sales data. Once submitted, records are securely locked to prevent tampering.
- **Sales History:** View historical performance, payouts, and tier achievements across previous months.

**For Administrators:**
- **Dynamic Leaderboard:** View the top-performing sales officers and total payouts for any selected month.
- **Slab Configuration:** Create, edit, and visualize incentive tiers and calculation modes in real-time.
- **Inventory & Staff Management:** Add or deactivate car models (with categories and base prices) and manage sales officer accounts.

## 🛠️ Technology Stack
- **Frontend:** React, Vite, React Router, Context API
- **Backend:** Node.js, Express.js, JSON Web Tokens 
- **Database:** MongoDB Atlas

---

## 🚀 How to Set Up and Run Locally

Follow these instructions to run the project on any local machine.

### Prerequisites
1. Install [Node.js](https://nodejs.org/) (v18 or higher recommended).
2. Install [Git](https://git-scm.com/).
3. Have a MongoDB connection string ready (either a local MongoDB instance or MongoDB Atlas).

### 1. Clone the Repository
```bash
git clone https://github.com/Salmaan-Faaris/Incentive_Calculator.git
cd Incentive_Calculator
```

### 2. Backend Setup
Open a terminal and navigate to the `backend` folder:
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder and add your credentials:
```env
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_super_secret_jwt_key
```

*(Optional)* Seed the database with initial Toyota Nippon cars, slabs, and users:
```bash
node seed.js
```

Start the backend server:
```bash
node index.js
```
The server will run on `http://localhost:5001`.

### 3. Frontend Setup
Open a **new** terminal window and navigate to the `frontend` folder:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```
The application will launch in your browser at `http://localhost:5174`.

---

## 🔑 Default Login Credentials

If you ran the `seed.js` script, you can log in using the following test accounts:

**Admin Account:**
- Email: `admin@toyotanippon.com`
- Password: `admin123`

**Sales Officer Account:**
- Email: `salman@toyotanippon.com`
- Password: `officer123`
