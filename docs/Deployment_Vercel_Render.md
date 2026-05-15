# Deployment Guide: Vercel + Render

## Deployment Setup

- Frontend: Vercel
- Backend: Render Web Service
- Database: SQLite
- File uploads: Backend uploads directory

Because the system uses SQLite and uploaded documents, configure a persistent disk on Render for production/demo use.

---

## 1. Deploy Backend on Render

Create a new Render Web Service from the GitHub repository.

Recommended Render settings:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Environment variables:

```env
NODE_ENV=production
JWT_SECRET=replace_with_a_long_random_secret
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
MAIL_FROM=PWDConnect PH <your_email@gmail.com>
SQLITE_DB_PATH=/opt/render/project/src/storage/pwdconnect.db
UPLOADS_DIR=/opt/render/project/src/storage/uploads
```

Persistent disk:

- Mount Path: `/opt/render/project/src/storage`

After deployment, test the backend root URL:

```text
https://your-render-service.onrender.com/
```

Expected response:

```json
{
  "message": "PWDConnect PH API is running"
}
```

---

## 2. Deploy Frontend on Vercel

Create a new Vercel project from the same GitHub repository.

Recommended Vercel settings:

- Root Directory: `frontend`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Environment variable:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

Redeploy the frontend after adding the environment variable.

---

## 3. Important Checks

After both deployments are live, test these flows:

- User registration and email verification
- User login
- Admin login
- Browse services
- Submit application
- Upload requirements
- Admin approval and verification
- Voucher generation
- Support request submission
- Direct refresh on frontend routes such as `/login` and `/admin/dashboard`

---

## 4. Common Issues

### Frontend cannot connect to backend

Check that `VITE_API_BASE_URL` is set on Vercel and includes `/api`.

Correct:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

Wrong:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Page shows 404 after refresh on Vercel

The `frontend/vercel.json` rewrite sends all frontend routes back to `index.html`, allowing React Router to handle the route.

### Database or uploads disappear

Make sure Render persistent disk is configured and the backend has:

```env
SQLITE_DB_PATH=/opt/render/project/src/storage/pwdconnect.db
UPLOADS_DIR=/opt/render/project/src/storage/uploads
```

