# FinCaL — MERN Stack

Full MERN conversion of FinCaL with Email OTP authentication and MongoDB persistence.

---

## 📁 Project Structure

```
fincal/
├── backend/          ← Node.js + Express + MongoDB
│   ├── models/       ← Mongoose schemas
│   ├── routes/       ← API routes
│   ├── middleware/   ← JWT auth
│   ├── utils/        ← Email (nodemailer)
│   ├── server.js
│   ├── .env          ← ⚠️ Configure this!
│   └── package.json
└── frontend/         ← React app
    ├── src/
    │   ├── components/Dashboard.jsx
    │   ├── pages/LoginPage.jsx
    │   ├── context/AuthContext.js
    │   └── utils/api.js
    └── package.json
```

---

## ⚙️ SETUP INSTRUCTIONS

### Step 1 — Configure Email in Backend `.env`

Open `backend/.env` and fill in your Gmail credentials:

```env
MONGODB_URI=mongodb+srv://rajsatyam2005_db_user:99MOHza4AD4ODRB0@fin-cal.dz91qrg.mongodb.net/?appName=fin-cal
JWT_SECRET=fincal_super_secret_jwt_key_2024
PORT=5000

EMAIL_USER=your_gmail@gmail.com       ← Your Gmail address
EMAIL_PASS=your_16_char_app_password  ← Gmail App Password (not your login password)
```

#### How to get Gmail App Password:
1. Go to **Google Account → Security**
2. Enable **2-Step Verification**
3. Go to **App Passwords** (search in Google Account settings)
4. Create new app password → Select "Mail" → Copy the 16-char password
5. Paste it as `EMAIL_PASS` in `.env`

---

### Step 2 — Install & Run Backend

```bash
cd backend
npm install
npm run dev       # or: npm start
```

Server starts at `http://localhost:5000`

---

### Step 3 — Install & Run Frontend

```bash
cd frontend
npm install
npm start
```

App opens at `http://localhost:3000`

---

## 🔐 Authentication Flow

1. User enters email → Server checks if new or existing user
2. **New user**: Asked to pick a username → OTP sent to email
3. **Existing user**: OTP sent to email directly
4. User enters 6-digit OTP → JWT token issued → Dashboard unlocked
5. Token stored in localStorage → Auto-login on refresh

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP, get JWT |
| GET | `/api/auth/users/search?q=name` | Search all app users |
| GET | `/api/data/expenses` | Get user's expenses |
| PUT | `/api/data/expenses` | Save expenses |
| GET | `/api/data/people` | Get people/ledgers |
| PUT | `/api/data/people` | Save people/ledgers |

---

## ✨ New Features vs Original

| Feature | Before | After |
|---------|--------|-------|
| Auth | Local PIN | Email OTP (6-digit) |
| Storage | localStorage | MongoDB |
| Multi-device | ❌ | ✅ Data syncs across devices |
| User Search | ❌ | ✅ Search all app users in People tab |
| Security | No backend | JWT tokens, server-side validation |

---

## 🚀 Production Deployment

### Backend (e.g. Render / Railway):
- Set all `.env` variables as environment variables
- Deploy `backend/` folder
- Set start command: `node server.js`

### Frontend (e.g. Vercel / Netlify):
- Change proxy in `frontend/package.json` to your backend URL
- Or set `REACT_APP_API_URL=https://your-backend.com` and update `api.js`
- `npm run build` → deploy `build/` folder

---

## ⚠️ Notes

- All original functionality preserved: expenses, budget tracking, Normal/General/Interest/Group ledgers, CSV export, monthly analytics, history, etc.
- Data is per-user and stored in MongoDB
- OTP expires in 10 minutes
- JWT tokens last 30 days
