# Debug Battle 05 — Ecommerce Admin Dashboard

Full-stack ecommerce admin dashboard built for a debugging challenge. The app has a React admin panel and an Express API where admins can register, log in, manage products, upload product images, track inventory, create customer orders, and view dashboard statistics.

The project started with several real integration bugs across setup, auth, routing, environment variables, inventory logic, and deployment. The fixes were kept small so the original structure stayed intact.

## Features

- User registration and login
- JWT-based authentication
- Protected admin dashboard route
- Product creation and product listing
- Product image upload through Multer with Cloudinary support
- Product variants with price and stock
- Inventory tracking and stock adjustment
- Order creation with customer name and line items
- Dashboard statistics for revenue, orders, products, and stock
- Frontend and backend API integration through Axios

## Tech Stack

### Frontend

- React
- Vite
- Context API
- Tailwind CSS
- Axios

### Backend

- Node.js
- Express.js
- JWT authentication
- Multer
- Cloudinary
- Mongoose

### Database

- MongoDB
- MongoDB Atlas for deployment

### Deployment

- Backend: Render
- Frontend: Vercel
- Database: MongoDB Atlas

## Project Structure

```txt
frontend/   React + Vite admin dashboard
server/     Express API, MongoDB models, routes, controllers, middleware
```

## Debugging Approach

The debugging was done step by step instead of rewriting the project. First the issue was reproduced, then the browser console and network request were checked. After that the backend terminal logs were inspected and the request path was traced from the React form to Axios, Express routes, controller logic, middleware, and MongoDB connection.

Most fixes were small: align a route name, load environment variables before connecting to MongoDB, store the token name returned by the backend, and correct stock/order calculations. After each fix, the app was tested again before moving to the next issue.

## Problems Fixed

### 1. Missing backend dependency

Problem:
The backend crashed because `multer` was imported in the upload middleware but was not installed.

Evidence:

```txt
Cannot find module 'multer'
```

Fix:
Installed `multer` and verified the backend moved past that error.

### 2. MongoDB connection issue

Problem:
The backend crashed because the MongoDB connection URI was undefined.

Evidence:

```txt
The `uri` parameter to `openUri()` must be a string, got "undefined"
```

Cause:
The backend connects with `process.env.MONGO_URI`, but the environment variable was missing or not loaded correctly.

Fix:
Loaded `.env` before calling the database connection and added the correct MongoDB URI in the environment variables. After that the backend showed:

```txt
MongoDB Connected
```

### 3. Frontend registration failed

Problem:
The frontend registration form was calling the correct backend URL, but the backend was not running because of the earlier crash.

Frontend request:

```txt
POST http://localhost:5000/api/auth/register
```

Evidence:

```txt
net::ERR_CONNECTION_REFUSED
```

Fix:
Fixed backend startup and MongoDB connection first, then tested the register API again.

### 4. Render deployment package.json issue

Problem:
Render searched for `package.json` in the repository root, but the backend package file is inside `server/`.

Evidence:

```txt
ENOENT: no such file or directory, open '/opt/render/project/src/package.json'
```

Fix:
Use backend-aware Render commands:

```txt
Build Command: cd server && npm install
Start Command: cd server && npm start
```

### 5. MongoDB Atlas database name issue

Problem:
The Render backend crashed because the MongoDB database name contained a dot.

Evidence:

```txt
Database names cannot contain the character '.'
```

Fix:
Updated the MongoDB URI to use a valid database name without dots.

### 6. Deployment environment setup

Problem:
The frontend and backend deploy to different platforms, so API URL and CORS needed proper environment configuration.

Fix:

- Frontend uses `VITE_API_URL` to point to the Render backend.
- Backend uses `CLIENT_URL` to allow the Vercel frontend in CORS.

Local fallback values are still present so development works without production URLs.

## Environment Variables

Do not commit real `.env` files. Keep secrets in the hosting provider dashboard.

### server/.env.example

```env
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
CLIENT_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### frontend/.env.example

```env
VITE_API_URL=
```

For local development, these can look like:

```env
VITE_API_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
```

## Local Setup

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

Backend runs on:

```txt
http://localhost:5000
```

## Deployment Notes

### Render Backend

Use these settings if deploying from the repository root:

```txt
Build Command: cd server && npm install
Start Command: cd server && npm start
```

Add backend environment variables in the Render dashboard:

```env
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
CLIENT_URL=https://your-vercel-app.vercel.app
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

If Render is configured with `server` as the root directory, use:

```txt
Build Command: npm install
Start Command: npm start
```

### Vercel Frontend

Use these settings:

```txt
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Add this environment variable in Vercel:

```env
VITE_API_URL=https://your-render-backend.onrender.com
```

The frontend code adds `/api` internally, so do not add `/api` at the end of `VITE_API_URL`.

## Final Status

The backend is able to start successfully, connect to MongoDB Atlas, and serve APIs. The frontend is configured to call the deployed backend through environment variables, and the backend CORS setup allows the deployed Vercel frontend through `CLIENT_URL`.
