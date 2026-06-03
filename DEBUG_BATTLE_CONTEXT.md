# DEBUG_BATTLE_CONTEXT.md

## Project Context

This is a full-stack debug battle project.

The project may contain:

### Frontend

* React / Next.js / Vite based frontend
* Forms
* API calls
* State management
* Authentication token handling
* File upload / form-data handling
* UI rendering based on backend response

### Backend

* Node.js
* Express.js
* MongoDB / Mongoose
* JWT authentication
* REST APIs
* Controllers
* Services
* Models
* Middlewares
* Validation
* File upload using Multer
* Image upload using ImageKit or local storage

## Main Goal

Debug and fix frontend and backend bugs safely.

## Important Project Rule

Do not rewrite the entire project.

Do not refactor unrelated code.

Find the exact bug, trace the flow, fix the root cause, and verify the fix.

## Expected Debug Style

For every issue, follow this flow:

```txt
User Action
   ↓
Frontend Component
   ↓
API Call
   ↓
Request URL / Method / Headers / Body
   ↓
Backend Route
   ↓
Middleware
   ↓
Controller
   ↓
Service
   ↓
Model / Database
   ↓
Response
   ↓
Frontend Response Handling
   ↓
UI Update
```

## Common Full-Stack Bug Areas

Check these carefully:

### Frontend Issues

* Wrong API URL
* Wrong HTTP method
* Wrong request body
* Missing Authorization header
* Sending JSON instead of form-data
* Wrong form field names
* Wrong state updates
* Wrong response data path
* Not handling loading/error states
* Not reading backend error message correctly

### Backend Issues

* Route path mismatch
* Middleware order issue
* Missing auth middleware
* Controller reading wrong request property
* `req.file` vs `req.files`
* `req.body` missing because of wrong content type
* Validation rejecting correct data
* Service logic issue
* Mongoose ObjectId issue
* Model field mismatch
* Environment variable missing
* Error middleware not returning clean response

### Integration Issues

* Frontend sends `image`, backend expects `images`
* Frontend sends `token`, backend expects `Authorization: Bearer token`
* Frontend sends `productName`, backend expects `name`
* Backend returns `data.product`, frontend reads `product`
* Backend returns `data`, frontend reads `response.product`
* Frontend uses wrong localhost port
* CORS issue
* Cookie/token issue

## Debug Battle Priority

1. Reproduce the bug.
2. Read the error message carefully.
3. Check frontend console.
4. Check browser network tab.
5. Check backend terminal logs.
6. Trace request from frontend to backend.
7. Identify exact broken file and line.
8. Apply minimum safe fix.
9. Add a short bug-fix comment near the fixed line.
10. Test again.
11. Explain the fix clearly.
