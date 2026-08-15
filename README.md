# 📱 Contact Manager - Full-Stack Contact Management Application

A modern, responsive, full-stack Contact Management web application built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and **Vanilla HTML5 / CSS3 / JavaScript**.

---

## ✨ Features

- 🔐 **Authentication & Security**:
  - User Registration (`Name`, `Email`, `Password`).
  - User Login with JWT (JSON Web Token) authentication.
  - Password hashing with `bcryptjs` (salt rounds: 10).
  - Protected API routes and automatic session persistence in localStorage.

- 📇 **Full Contact Management (CRUD)**:
  - **Create**: Add new contacts with Name, Email, Phone, Category, Company, Address, Notes, and Favorite flag.
  - **Read**: Live search filter across Name, Email, Phone, Company, and Address with 280ms debounce.
  - **Filter**: Filter by Category (*Personal, Work, Family, Client, Other*) or *Favorites*.
  - **Sort**: Sort by *Newest First*, *Alphabetical (A→Z)*, *Alphabetical (Z→A)*, or *Oldest First*.
  - **Update**: Edit contact details in a modal dialog.
  - **Delete**: Safely delete contacts with a confirmation dialog.
  - **Favorites**: One-click quick favorite toggling.

- 📊 **Dynamic Dashboard Metrics**:
  - Live summary stats: Total Contacts, Favorites, Work & Clients, and Personal & Family.

- 🎨 **Modern Design**:
  - Custom Vanilla CSS design system with fluid layout and responsive mobile design.
  - Micro-interactions, custom modal dialogues, and non-blocking toast notifications.
  - Initial-based colorful avatar indicators.

---

## 🏗️ Project Architecture

```
contact management application/
├── package.json               # Dependencies & scripts
├── .env                       # Environment configuration
├── .env.example               # Example environment variables
├── server.js                  # Express application & server entry point
├── config/
│   └── db.js                  # MongoDB database connection
├── models/
│   ├── User.js                # User Mongoose schema & auth hooks
│   └── Contact.js             # Contact Mongoose schema & indexes
├── middleware/
│   ├── auth.js                # JWT auth verification middleware
│   └── errorHandler.js        # Centralized Express error handler
├── controllers/
│   ├── authController.js      # Auth logic (Register, Login, GetMe)
│   └── contactController.js   # Contact CRUD, Search, Filters & Stats
├── routes/
│   ├── authRoutes.js          # /api/auth routes
│   └── contactRoutes.js       # /api/contacts routes
└── public/                    # Frontend client assets
    ├── index.html             # Single-page interface
    ├── css/
    │   └── style.css          # Custom CSS design system
    └── js/
        ├── api.js             # API client & session manager
        └── app.js             # UI controller, state & DOM manipulation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local MongoDB instance or MongoDB Atlas URI)

### 2. Environment Configuration
Verify your `.env` configuration:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/contact_manager_db
JWT_SECRET=supersecret_contact_manager_jwt_key_2026_secure
JWT_EXPIRES_IN=7d
```

> **Note on MongoDB Atlas**: If using MongoDB Atlas in the cloud, replace `MONGO_URI` with your connection string:
> `mongodb+srv://<username>:<password>@cluster0.mongodb.net/contact_manager_db?retryWrites=true&w=majority`

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Application
```bash
npm start
```
Or for auto-reload during development:
```bash
npm run dev
```

### 5. Access the Web Application
Open your browser and navigate to:
```
http://localhost:5000
```

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Login user & return JWT | Public |
| `GET` | `/api/auth/me` | Get current authenticated user | Private |

### Contacts (`/api/contacts`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/contacts` | Get contacts (with `q`, `category`, `favorite`, `sort` query params) | Private |
| `GET` | `/api/contacts/stats/summary` | Get contact counts and category stats | Private |
| `GET` | `/api/contacts/:id` | Get single contact by ID | Private |
| `POST` | `/api/contacts` | Create a new contact | Private |
| `PUT` | `/api/contacts/:id` | Update contact | Private |
| `DELETE` | `/api/contacts/:id` | Delete contact | Private |
| `PATCH` | `/api/contacts/:id/favorite` | Toggle contact favorite status | Private |
