# PWDConnect PH Panelist Q&A Preparation

Use this as a quick review guide for possible panel questions during the defense.

## 1. System Functionality

### What is PWDConnect PH?
PWDConnect PH is a web-based services and benefits portal for Persons with Disabilities. It allows PWD users to register, verify their account, browse available assistance programs, submit applications, upload requirements, track application status, submit support requests, and view generated vouchers.

### Who are the target users?
The system has two main user roles:
- **PWD User** - applies for services, uploads documents, tracks status, views vouchers, and submits support requests.
- **Administrator** - manages users, services, applications, requirements, vouchers, announcements, support requests, audit logs, and reports.

### What is the main workflow of the system?
1. User registers and verifies their Gmail/email code.
2. User logs in and browses available services.
3. User submits a service application.
4. Admin reviews the application.
5. If approved, user uploads required documents.
6. Admin verifies or rejects the requirements.
7. If verified, the system generates a voucher with a QR code.
8. User views the voucher and assistance confirmation.

### What prevents users from submitting duplicate applications?
Before creating a new application, the backend checks if the same user already has an active application for the same service. If an active non-rejected application exists, the system rejects the duplicate request.

### What happens after requirements are verified?
When an admin verifies requirements, the system updates the requirement and application status, generates a unique voucher code, creates a QR code, saves the voucher record, and displays the voucher to the user.

## 2. Technical Implementation

### What technologies were used?
- **Frontend:** React, Vite, React Router, Axios, CSS
- **Backend:** Node.js, Express.js
- **Database:** SQLite
- **Authentication:** JSON Web Token, bcryptjs
- **Email Verification:** Nodemailer with Gmail/SMTP credentials
- **File Uploads:** Multer
- **QR Code:** qrcode npm package
- **Two-Factor Authentication:** Custom TOTP utility using Node crypto
- **Development Tools:** npm, Nodemon, ESLint

### What architecture does the system use?
The system uses a client-server architecture:
- The React frontend handles the user interface and page routing.
- Axios sends requests from the frontend to the backend API.
- The Express backend handles authentication, business logic, validation, and database operations.
- SQLite stores the application records.
- Uploaded documents are saved in the backend uploads folder and referenced in the database.

### Why did you use React for the frontend?
React was used because it supports reusable components, fast page updates, and organized routing. This is useful for separating user pages, admin pages, dashboards, forms, and status-tracking views.

### Why did you use Node.js and Express for the backend?
Node.js and Express make it straightforward to build REST API endpoints. Express is lightweight, flexible, and works well with middleware for authentication, JSON parsing, CORS, file uploads, and route protection.

### Why did you use SQLite?
SQLite was chosen because it is simple to set up, file-based, and suitable for local development and demonstration. It avoids the need for a separate database server while still supporting relational tables, foreign keys, and SQL queries.

## 3. API Used

### What APIs are used in the system?
The system mainly uses a custom REST API built with Express.js. The frontend accesses this API through Axios using a base URL such as:

```text
http://localhost:5000/api
```

For deployment, the frontend can use:

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

### What are the main backend API modules?
- `/api/auth` - registration, email verification, login, current user, and 2FA
- `/api/users` - user profile and admin user management
- `/api/services` - service listing and admin service management
- `/api/applications` - application submission, viewing, approval, rejection, and document upload
- `/api/requirements` - requirement submission, verification, rejection, and deletion
- `/api/vouchers` - voucher viewing and voucher status management
- `/api/announcements` - announcement listing and admin announcement management
- `/api/support` - user support requests and admin replies/status updates
- `/api/audit-logs` - admin audit log viewing

### Is there any third-party API?
The project does not depend on a major external government API. It uses external services/libraries for support features:
- **Gmail/SMTP through Nodemailer** for sending email verification codes.
- **qrcode npm package** for generating QR code data URLs locally.
- **Google Fonts** are imported in the frontend CSS for typography.

### How does the frontend communicate with the API?
The frontend uses an Axios instance. It automatically attaches the JWT token from local storage to the `Authorization` header:

```text
Authorization: Bearer <token>
```

This allows protected backend routes to verify the logged-in user.

## 4. Database Structure

### What are the main database tables?
- `users`
- `admins`
- `pending_registrations`
- `services`
- `applications`
- `requirements`
- `application_documents`
- `vouchers`
- `announcements`
- `support_requests`
- `audit_logs`

### How are the tables related?
- A `user` can have many `applications`.
- A `service` can have many `applications`.
- An `application` belongs to one user and one service.
- An `application` can have uploaded `requirements` and `application_documents`.
- A verified application can generate one `voucher`.
- `announcements` and `audit_logs` are connected to admins.
- `support_requests` are connected to users and optionally to services.

### What is the purpose of `pending_registrations`?
This table temporarily stores registration details before the user verifies their email code. Only after successful verification is the account inserted into the `users` table.

### What is the purpose of `audit_logs`?
The `audit_logs` table records important admin actions, such as updating applications, verifying requirements, deleting records, and changing voucher status. This improves traceability and accountability.

## 5. Security Features

### How are passwords protected?
Passwords are hashed using `bcryptjs` before being stored in the database. The system never stores plain-text passwords.

### How is login protected?
After successful login, the backend generates a JSON Web Token. Protected routes require this token, and the backend verifies it before allowing access.

### How does role-based access work?
The JWT contains the user's role. Middleware checks the token and role before allowing access to protected routes. Admin-only routes use `requireAdmin`, while normal users can access only their own records.

### How does email verification work?
During registration, the system creates a 6-digit verification code, hashes it, stores it temporarily, and sends the code through email. The code expires after 15 minutes. The user account is created only after the correct code is submitted.

### How does two-factor authentication work?
Users can enable authenticator-based 2FA. The system generates a TOTP secret, creates an authenticator QR code, and verifies 6-digit time-based codes during login.

### How are uploaded documents handled?
Uploaded documents are processed through Multer and saved in the backend uploads directory. The database stores the file reference or file URL so the system can retrieve the uploaded requirements.

## 6. Challenges Encountered

### What challenges did you encounter during development?
Possible answer:
One challenge was coordinating the full application workflow because each step depends on the previous one: registration, application approval, requirements upload, requirement verification, and voucher generation. To solve this, we used clear status values and backend validation for each step.

### What was challenging about security?
Possible answer:
Security required multiple layers: password hashing, JWT authentication, role-based access, email verification, and optional 2FA. The challenge was making sure each protected route checks the correct user role and ownership of data.

### What was challenging about file uploads?
Possible answer:
The main challenge was linking uploaded files to the correct application and requirement record. We solved it by saving files in the backend uploads folder and storing file paths/URLs in the database.

### What was challenging about voucher generation?
Possible answer:
The voucher had to be generated only after requirements were verified. We solved this by placing the voucher generation logic inside the requirement verification process and checking if a voucher already exists for the application.

### What would you improve in the future?
Possible answer:
Future improvements could include using a production database such as PostgreSQL or MySQL, adding stricter file type validation, adding password reset, improving analytics reports, adding SMS notifications, and integrating with actual government or LGU service databases.

## 7. Short Defense Answers

### One-sentence system summary
PWDConnect PH is a web-based portal that helps PWD users apply for assistance programs online while allowing administrators to manage applications, requirements, vouchers, announcements, and support requests.

### One-sentence technical summary
The system uses a React frontend, Express REST API backend, and SQLite database, with JWT authentication, bcrypt password hashing, email verification, file uploads, QR voucher generation, and optional 2FA.

### One-sentence API summary
The project uses its own Express REST API for system operations, Axios for frontend API calls, Nodemailer/Gmail SMTP for verification emails, and local QR/TOTP libraries for voucher and 2FA features.

