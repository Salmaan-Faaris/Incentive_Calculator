# IncentIQ — Smart Incentive Calculator

A **dynamic, role-based incentive management platform** for vehicle Sales Officers, built with the MERN stack.

## ✨ Features

### Admin Portal 🛡️
- **Slab Configuration Engine** — Add/edit/delete tiers with a visual bar preview
- **Dual Calculation Modes** — Flat tier OR progressive (tax-bracket style)
- **Car Inventory Management** — Add/edit car models with category, variant, color
- **Officer Management** — Create and manage sales officer accounts
- **Live Leaderboard** — Real-time ranking of officers by incentive earned
- **Period Sales Overview** — View all officer data for any month/year

### Sales Officer Portal 🚗
- **Secure Login** with JWT authentication
- **Real-time Calculator** — Adjust quantities and watch incentive update instantly
- **Animated Payout Counter** — Smooth number animation on every change
- **Tier Progress Meter** — Visual progress bar showing current tier + how far to next
- **Milestone Banner** — "X more cars to unlock Gold tier at ₹3,500/car"
- **Per-car Contribution** — Shows each model's share of total incentive
- **Tier Breakdown Panel** — Detailed breakdown per slab with active highlighting
- **Draft & Submit Workflow** — Save progress, then submit for the month
- **Sales History** — View past months' performance

---

## 🚀 Setup

### 1. Configure MongoDB

Edit `server/.env`:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/incentive
JWT_SECRET=your_secret_key_here
PORT=5001
```

### 2. Run the App

```powershell
cd E:\Internship\task2
.\Start-Task2.ps1
```

**Or manually:**
```bash
# Terminal 1
cd E:\Internship\task2\server && npm run dev

# Terminal 2
cd E:\Internship\task2\client && npm run dev
```

Open **http://localhost:5174**

---

## 🔑 Default Accounts (auto-seeded on first run)

| Role | Email | Password |
|---|---|---|
| Admin | admin@incentive.com | admin123 |
| Officer | arjun@incentive.com | officer123 |
| Officer | priya@incentive.com | officer123 |
| Officer | rahul@incentive.com | officer123 |

---

## 📊 Incentive Calculation Modes

### Flat Tier
When an officer reaches a tier, **all cars** earn that tier's rate.

| Cars Sold | Rate/Car | Total (5 cars) |
|---|---|---|
| 1–3 | ₹1,000 | — |
| 4–7 | ₹2,000 | **₹10,000** |
| 8+  | ₹3,500 | — |

### Progressive (Bracket)
Like income tax — each band earns its own rate.

| Cars Sold | Rate/Car | Amount |
|---|---|---|
| First 3 | ₹1,000 | ₹3,000 |
| Next 2 (→5) | ₹2,000 | ₹4,000 |
| **Total** | | **₹7,000** |

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Vanilla CSS |
| Backend | Node.js + Express |
| Auth | JWT + bcryptjs (RBAC) |
| Database | MongoDB + Mongoose |
