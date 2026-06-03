# Debug Battle 05 - Ecommerce Admin Dashboard

This is a MERN-style ecommerce admin dashboard. The frontend is React + Vite, the backend is Express + MongoDB, images go through Multer/Cloudinary, and the app is prepared for:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

The goal of this repo was not to rebuild the app. I traced the real frontend and backend code, found the exact broken lines, and fixed the smallest things needed to make local development and deployment work safely.

## Project Structure

```txt
frontend/   React + Vite admin dashboard
server/     Express API, routes, controllers, models, middleware, config
```

## Tech Stack

Frontend:

- React
- Vite
- Context API
- Tailwind CSS
- Axios

Backend:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- Multer
- Cloudinary

## How I Debugged It

I did the debugging flow in this order:

1. Checked the repo structure and package scripts.
2. Traced frontend routes from `App.jsx`.
3. Traced auth state from `AuthContext.jsx`.
4. Checked every Axios call in the frontend.
5. Matched those calls with Express route mounts in `server.js`.
6. Checked auth middleware, upload middleware, controllers, models, and env usage.
7. Verified deploy-related config for Vercel, Render, MongoDB Atlas, CORS, cookies, and ignored env files.

No architecture rewrite was done. Fixes were kept close to the broken code.

## Problems Found and Fixed

### 1. Missing backend dependency

The upload middleware imports `multer`, but the dependency was missing earlier. Backend startup/upload flow could fail before reaching the controller.

Fix:

- Added/verified `multer` in `server/package.json`.
- Kept existing upload middleware architecture.

### 2. MongoDB env was not loaded before DB connect

The backend connects with:

```js
mongoose.connect(process.env.MONGO_URI)
```

The crash happened because `MONGO_URI` was undefined. The server now loads `.env` before calling `connectDB()`.

Files touched:

- `server/server.js`
- `server/config/db.js`

### 3. Real env files were unsafe for Git

Real `.env` files are ignored from the root `.gitignore`, `server/.gitignore`, and `frontend/.gitignore`. `.env.example` files are still allowed because they contain placeholders only.

If a real `.env` was pushed earlier, remove it from tracking and rotate those secrets from the provider dashboard.

Files checked/updated:

- `.gitignore`
- `server/.gitignore`
- `frontend/.gitignore`
- `server/.env.example`
- `frontend/.env.example`

### 4. Backend scripts for Render

`server/package.json` has the required scripts:

```json
"start": "node server.js",
"dev": "nodemon server.js"
```

Render should use the backend folder commands, not root npm commands.

### 5. Frontend API URL was made deployment-safe

The frontend Axios base URL now comes from:

```js
import.meta.env.VITE_API_URL || "http://localhost:5000"
```

The code adds `/api` internally, so `VITE_API_URL` should be only the backend origin.

Files touched:

- `frontend/src/api/axios.js`
- `frontend/.env.example`

### 6. Backend CORS only allowed one origin

For deployment, local Vite and deployed Vercel both need access. CORS now allows:

- `http://localhost:5173`
- `CLIENT_URL`
- existing `FRONTEND_URL` fallback if present

It does not open CORS to all origins.

File touched:

- `server/server.js`

### 7. Refresh cookie was not deployment-safe

Vercel frontend and Render backend are cross-site. In production, refresh cookies need:

```txt
SameSite=None
Secure=true
```

Local development keeps stricter local settings.

File touched:

- `server/controllers/authController.js`

### 8. Password hash was being sent to the browser

Auth/profile responses were returning `user.password`, and the frontend displayed it. That is not safe for production. The backend no longer returns the password hash, and the UI now shows a hidden password state instead.

Files touched:

- `server/controllers/authController.js`
- `server/controllers/userController.js`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Profile.jsx`

### 9. Auth token name mismatch

The backend returns `accessToken`. The frontend now stores `response.data.accessToken`, so protected API calls get the correct bearer token.

Files touched:

- `frontend/src/context/AuthContext.jsx`

### 10. JWT signing and verifying mismatch

Access tokens were signed with `JWT_SECRET`, but protected routes were not using the same secret earlier. Protected dashboard calls could fail even after login.

Fix:

- `protect` middleware verifies access tokens with `JWT_SECRET`.
- Refresh token flow still uses `JWT_REFRESH_SECRET`.

File touched:

- `server/middleware/authMiddleware.js`

### 11. Login input name mismatch

The login form was saving the typed password under the wrong field name. The password input now uses `name="password"`.

File touched:

- `frontend/src/pages/Login.jsx`

### 12. Product upload and route mismatch

The backend route is mounted at `/api/products`. Product creation now posts to `/products` through Axios. Product variants are also sent as JSON inside `FormData`, which matches the backend parser.

Files touched:

- `frontend/src/pages/Dashboard.jsx`
- `server/routes/productRoutes.js`
- `server/controllers/productController.js`
- `server/middleware/uploadMiddleware.js`
- `server/config/cloudinary.js`

### 13. Product stock and variant stock calculation

Product creation and product listing had stock issues around variants and inventory rows.

Fix:

- Variant payload is parsed safely.
- Variant product price can come from the first variant when base price is empty.
- Base stock is calculated from inventory rows.
- Variant stock is added instead of creating negative stock.

File touched:

- `server/controllers/productController.js`

### 14. Order and inventory business logic

Order stock checks, total calculation, variant stock updates, base inventory summaries, and inventory adjustment flow were corrected so stock does not go negative incorrectly and dashboard totals do not double count variant rows.

Files touched:

- `frontend/src/pages/Dashboard.jsx`
- `server/controllers/orderController.js`
- `server/controllers/inventoryController.js`
- `server/models/orderModel.js`
- `server/models/inventoryModel.js`

### 15. Dashboard loading and toast state

Dashboard fetch error handling could leave the UI stuck on loading, and toast updates were not always reliable.

Fix:

- Loading is stopped inside the catch path.
- Toast state uses immutable updates.

File touched:

- `frontend/src/pages/Dashboard.jsx`

### 16. Error messages were too generic

Backend errors were hiding the real validation/business message, which made debugging API failures harder.

Fix:

- Error middleware now returns the actual error message.
- Stack stays hidden in production.

File touched:

- `server/middleware/errorMiddleware.js`

### 17. Stale Vite proxy port

The Vite dev proxy was pointing to `localhost:5001`, while the Express server defaults to `5000`. It now points to `http://localhost:5000`.

File touched:

- `frontend/vite.config.js`

### 18. Live Vercel frontend URL

The live frontend URL is:

```txt
https://kodex-debug-battle-5-0.vercel.app
```

This value must be added to Render as:

```env
CLIENT_URL=https://kodex-debug-battle-5-0.vercel.app
```

Local `server/.env` was updated with this value, but real `.env` files are ignored and must not be committed.

## Frontend to Backend Route Map

| Frontend Action | Axios Call | Backend Route |
| --- | --- | --- |
| Register | `POST /auth/register` | `POST /api/auth/register` |
| Login | `POST /auth/login` | `POST /api/auth/login` |
| Refresh token | `POST /auth/refresh` | `POST /api/auth/refresh` |
| Logout | `POST /auth/logout` | `POST /api/auth/logout` |
| Get profile | `GET /users/profile` | `GET /api/users/profile` |
| Update profile | `PUT /users/profile` | `PUT /api/users/profile` |
| List products | `GET /products` | `GET /api/products` |
| Create product | `POST /products` | `POST /api/products` |
| List orders | `GET /orders` | `GET /api/orders` |
| Create order | `POST /orders` | `POST /api/orders` |
| List inventory | `GET /inventory` | `GET /api/inventory` |
| Create inventory | `POST /inventory` | `POST /api/inventory` |
| Update inventory | `PUT /inventory/:id` | `PUT /api/inventory/:id` |

## Files Changed From Start To Now

Frontend:

- `frontend/src/api/axios.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/vite.config.js`
- `frontend/.env.example`
- `frontend/vercel.json`

Backend:

- `server/server.js`
- `server/package.json`
- `server/package-lock.json`
- `server/config/db.js`
- `server/config/cloudinary.js`
- `server/controllers/authController.js`
- `server/controllers/userController.js`
- `server/controllers/productController.js`
- `server/controllers/orderController.js`
- `server/controllers/inventoryController.js`
- `server/middleware/authMiddleware.js`
- `server/middleware/errorMiddleware.js`
- `server/middleware/uploadMiddleware.js`
- `server/.env.example`

Repo/deployment:

- `README.md`
- `.gitignore`
- `server/.gitignore`
- `frontend/.gitignore`

Real `.env` files are intentionally not included in this list because they should stay local.

## Environment Variables

Do not commit real `.env` files. Put real values in local `.env` files and in the hosting dashboards.

### server/.env.example

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/debugbattle2
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_change_in_production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### frontend/.env.example

```env
VITE_API_URL=http://localhost:5000
```

## Local Setup

Backend:

```bash
cd server
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Local URLs:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

## Deploy Backend on Render

Create a new Render Web Service from this repo.

If the Render root is the repo root:

```txt
Build Command: cd server && npm install
Start Command: cd server && npm start
```

If the Render root directory is set to `server`:

```txt
Build Command: npm install
Start Command: npm start
```

Add these Render environment variables manually:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=<your MongoDB Atlas URI>
JWT_SECRET=<secure random secret>
JWT_REFRESH_SECRET=<different secure random secret>
CLIENT_URL=https://kodex-debug-battle-5-0.vercel.app
CLOUDINARY_CLOUD_NAME=<your Cloudinary cloud name>
CLOUDINARY_API_KEY=<your Cloudinary API key>
CLOUDINARY_API_SECRET=<your Cloudinary API secret>
```

MongoDB Atlas note: use a valid database name in the URI. Database names should not contain dots.

## Deploy Frontend on Vercel

Create a Vercel project from the same repo.

Use these settings:

```txt
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Add this Vercel environment variable:

```env
VITE_API_URL=https://your-render-backend.onrender.com
```

Do not add `/api` at the end of `VITE_API_URL`, because the Axios file already adds `/api`.

After Vercel gives the final frontend URL, copy that URL into Render as `CLIENT_URL`.

## Git Safety Commands

Check if any real env file is tracked:

```bash
git ls-files | grep -E '(^|/)\.env$'
```

If a real env file appears, untrack only that file. Do not delete your local file:

```bash
git rm --cached server/.env
git rm --cached frontend/.env
git rm --cached .env
```

If secrets were pushed before, rotate them. Removing the file from the latest commit does not remove leaked values from old Git history.

## Verification Commands Run

These checks passed locally:

```bash
cd server
npm install
node --check server.js
node --check controllers/authController.js
node --check controllers/userController.js
npm start
```

```bash
cd frontend
npm install
npm run build
```

Extra checks:

- Backend health route returned `200 Server is running`.
- Mongo connection check returned OK without printing the URI.
- `git ls-files` showed no tracked real `.env` file.
- `git check-ignore` confirmed real `.env` files are ignored.

## Final Status

The project is ready for Render + Vercel deployment after you add the real environment variables manually. Local build checks should be run before pushing, and production should be verified by registering, logging in, creating a product, uploading an image, adjusting stock, and creating an order.
