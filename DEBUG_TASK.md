DEBUG_TASK.md
DEBUG_TASK.md
Current Debug Task

Debug the current frontend/backend issue.

Issue Description

Write the current bug here before asking Codex to fix it.

Example:

Create product API is failing when uploading product images from frontend.
Expected Behavior

Write what should happen.

Example:

User should be able to create a product with:
- name
- description
- price
- category
- multiple images

After submit, backend should upload images, save image URLs in MongoDB, and return created product.
Actual Behavior

Write what is happening now.

Example:

API returns 400/401/500 error.
Product is not created.
Images are not uploaded.
Frontend shows error.
Error Details

Fill these before debugging:

Frontend Console Error:

Browser Network Status Code:

Browser Network Response:

Backend Terminal Error:

Postman Error:


Files To Check
Frontend Files

Add actual file names if known:

src/components/ProductForm.jsx
src/pages/CreateProduct.jsx
src/api/productApi.js
src/services/api.js
src/utils/axiosInstance.js
Backend Files
src/features/product/product.routes.js
src/features/product/product.controller.js
src/features/product/product.service.js
src/features/product/product.model.js
src/features/product/product.validation.js
src/middlewares/auth.middleware.js
src/middlewares/upload.middleware.js
src/middlewares/validate.middleware.js
src/middlewares/error.middleware.js
src/config/imagekit.js
Debug Instructions For Codex

Read these files first:

DEBUG_BATTLE_CONTEXT.md
DEBUG_RULES.md
DEBUG_TASK.md

Then follow this process:

Do not edit code immediately.
First trace the frontend flow.
Then trace the backend flow.
Then compare frontend request with backend expectation.
Identify the exact mismatch or broken line.
Explain the root cause.
Apply the smallest possible fix.
Add a short bug-fix comment near the changed code.
Test or explain exactly how to test.
Give final debug summary.
Required Output From Codex

Codex must reply in this format:

## Debug Trace

### Frontend
- File:
- Function:
- Request URL:
- Method:
- Headers:
- Body/FormData:
- Issue:

### Backend
- Route:
- Middleware Order:
- Controller:
- Service:
- Model:
- Issue:

### Integration Check
- Frontend sends:
- Backend expects:
- Mismatch:

## Root Cause

Explain the actual bug.

## Fix Applied

Explain the code change.

## Bug-Fix Comment Added

Mention the file and comment added.

## Testing Steps

1.
2.
3.

## Final Status

Fixed / Not Fixed / Need More Info
Codex Prompt

Use this prompt:

Read DEBUG_BATTLE_CONTEXT.md, DEBUG_RULES.md, and DEBUG_TASK.md first.

Act like 4 logical agents:
1. Frontend Debugger
2. Backend Debugger
3. Integration Debugger
4. Fix Verifier

Do not edit code immediately.

First trace the complete flow and identify the root cause.

After that, apply the smallest possible fix.

Wherever you fix a bug, add a short comment near the changed line explaining:
- what the bug was
- why it happened
- how this fix solves it

Do not refactor unrelated code.
Do not change architecture.
Do not rename files unnecessarily.
Do not remove validation or authentication.
Do not hardcode secrets.

After fixing, give me:
1. Debug trace
2. Root cause
3. Files changed
4. Bug-fix comments added
5. Testing steps
6. Any risk or side effect



<!-- Do not guess. Show evidence from code before fixing. -->