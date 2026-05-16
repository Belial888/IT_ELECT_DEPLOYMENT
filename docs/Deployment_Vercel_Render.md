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
# Optional for demo only, if Gmail SMTP is not sending:
# SHOW_DEV_VERIFICATION_CODE=true
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

### Verification code does not work after deployment

Check these first:

1. In Render, make sure `JWT_SECRET` is set and does not change between deployments. The verification code hash uses this secret.
2. Make sure the persistent disk is mounted at `/opt/render/project/src/storage`.
3. Make sure these backend environment variables are set:

```env
SQLITE_DB_PATH=/opt/render/project/src/storage/pwdconnect.db
UPLOADS_DIR=/opt/render/project/src/storage/uploads
```

4. For Gmail verification emails, use a Gmail App Password, not the normal Gmail password:

```env
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
MAIL_FROM=PWDConnect PH <your_email@gmail.com>
```

5. If this is only for a demo and Gmail SMTP is not sending, add this Render backend environment variable:

```env
SHOW_DEV_VERIFICATION_CODE=true
```

Then redeploy the backend. The registration response will show the verification code on the frontend when email delivery fails. Do not enable this for a real production system.
