# RoomRadar

RoomRadar is a student-friendly PG & flatmate finder platform built with **React**, **Node.js/Express**, **MongoDB**, and **Socket.io**.

## ✅ Features
- User registration + login (JWT)
- Profile creation with lifestyle tags and preferences
- Browse rooms and roommates
- Matching algorithm (lifestyle + budget + location)
- Shortlisting users/rooms
- Real-time chat with Socket.io

---

## 🧱 Recommended Setup
This repository uses a **monorepo** structure with two folders:
- `server/` — Back-end API + Socket.io
- `client/` — React front-end (Vite)

### 1) Install dependencies

```bash
# from the repo root
cd server
npm install

cd ../client
npm install
```

### 2) Configure backend environment

Copy the example env file and update the values:

```bash
cd server
copy .env.example .env
```

Then edit `server/.env` and set:
- `MONGO_URI` (e.g., `mongodb://localhost:27017/roomradar`)
- `JWT_SECRET`
- `CLIENT_URL` (e.g., `http://localhost:5173`)

### 3) Seed the database (optional but recommended)

This project includes a seed script that creates default users + rooms so you can explore the UI quickly.

```bash
cd server
npm run seed
```

**Sample logins:**
- `ayesha@student.com` / `password123` (owner)
- `shubham779@gmail.com` / `123qwe,./` (owner)
- `neha@student.com` / `password123` (renter)

### 4) Run the backend + frontend

```bash
# Start backend
cd server
npm run dev

# In a second terminal, start frontend
cd client
npm run dev
```

---

## 🧭 Project Structure

```
/ (repo root)
  /server
    /src
      /config
      /middleware
      /models
      /routes
      /utils
  /client
    /src
      /components
      /pages
```

---

## 💡 Next Steps
- Add pagination/search to browse pages
- Add user verification (email or phone)
- Improve matching algorithm with weights + preferences
- Add image uploads for rooms + profiles
- Add push notifications / activity feed

---

Happy building! 🚀
