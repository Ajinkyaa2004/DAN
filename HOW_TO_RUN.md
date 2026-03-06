# 🚀 How to Run Both Projects

> Located in: `/Users/ajinkya/Desktop/DAN/`

---

## 📁 Project Overview

| Project | Stack | Port |
|---|---|---|
| **Business-Compass-main** | Next.js 16 + TypeScript + TailwindCSS | `http://localhost:3000` |
| **Weekly-Sales-MERN-main** (Backend) | Node.js + Express | `http://localhost:5000` |
| **Weekly-Sales-MERN-main** (Frontend) | React 19 + Create React App | `http://localhost:3001` |

---

## 1️⃣ Business-Compass-main (Next.js)

### Install Dependencies
```bash
cd Business-Compass-main
npm install
```

### Run Development Server
```bash
npm run dev
```
➡️ Opens at: **http://localhost:3000**

### Build for Production
```bash
npm run build
npm start
```

---

## 2️⃣ Weekly-Sales-MERN-main (MERN Stack)

This project has **two parts** — run both in separate terminals.

### Step 1 – Start the Backend (Express API)
```bash
cd Weekly-Sales-MERN-main/server
npm install
npm run dev
```
➡️ API runs at: **http://localhost:5000**

### Step 2 – Start the Frontend (React)
```bash
cd Weekly-Sales-MERN-main/client
npm install
PORT=3001 npm start
```
➡️ App opens at: **http://localhost:3001**

> ⚠️ **Note:** Start the **backend first**, then the frontend. Both must be running at the same time.

---

## 🔄 Running Both Projects Simultaneously

Open **3 terminal windows/tabs** and run:

| Terminal | Command | Directory |
|---|---|---|
| Terminal 1 | `npm run dev` | `Business-Compass-main/` |
| Terminal 2 | `npm run dev` | `Weekly-Sales-MERN-main/server/` |
| Terminal 3 | `PORT=3001 npm start` | `Weekly-Sales-MERN-main/client/` |

---

## 🛑 Stopping Projects

Press `Ctrl + C` in each terminal to stop the respective server.

---

## 🔧 Troubleshooting

### Port already in use
```bash
# Find what's using a port (e.g. 3000)
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Reset and reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```
