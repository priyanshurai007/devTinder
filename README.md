# 🔥 DevTinder — Connect. Code. Collaborate.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://render.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Made with MERN](https://img.shields.io/badge/Made%20with-MERN-8B63E7.svg)](#)

DevTinder is a developer matchmaking web app that helps software engineers find and connect with other like-minded developers to collaborate on projects. Inspired by swipe-style matching, it simplifies forming coding partnerships with real-time connection handling.

---

## 🌐 Live Links

- 🔗 **Frontend**: [https://devtinder-vqbx.onrender.com](https://devtinder-vqbx.onrender.com)  
- 🔗 **Backend**: [https://devtinder-backend-rbiv.onrender.com](https://devtinder-backend-rbiv.onrender.com)

---

## 🧠 Quick Overview

DevTinder allows users to:
- Sign up/login securely using JWT
- View a feed of suggested developers
- Express interest or ignore other users
- Accept/reject incoming connection requests
- Manage their profile and skills

---

## 🛠️ Tech Stack

| Layer     | Tech                                             |
|-----------|--------------------------------------------------|
| Frontend  | React, Redux Toolkit, Tailwind CSS, Axios        |
| Backend   | Node.js, Express.js, MongoDB, Mongoose           |
| Auth      | JWT, bcryptjs, HTTP-only cookies                 |
| Deployment| Render (for both frontend and backend)           |

---

## 🔑 Key Features

### 🔐 Authentication
- JWT-based login with `httpOnly` cookie security
- Password encryption with bcrypt
- Auto-auth middleware for protected routes

### 👤 User Profiles
- View & edit profile info (photo, skills, about)
- Secure password update flow with validation

### 🤝 Connection System
- Send connection requests (Interested or Ignored)
- Accept/Reject incoming requests
- Prevent duplicate/self requests via validation
- MongoDB compound queries for feed filtering

### 📡 Feed API with Pagination
- Dynamically fetch user suggestions excluding:
  - Self
  - Already connected users
  - Ignored/requested users
- Pagination via `skip` and `limit`

### 🧠 MongoDB Optimization
- `$nin`, `$ne`, `$or` operators for filtering
- Compound indexing for faster request lookup

---

## 📂 Folder Structure

devTinder/
├── devTinder-frontend/
│ ├── public/
│ └── src/
│ ├── components/
│ ├── redux/
│ ├── utils/
│ └── App.jsx
├── devTinder-backend/
│ ├── src/
│ │ ├── routes/
│ │ ├── models/
│ │ ├── middlewares/
│ │ └── Config/
│ ├── app.js
│ └── .env
