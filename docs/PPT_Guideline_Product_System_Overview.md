# PWDConnect PH PPT Guideline

## Section 1: Product / System Overview

### Slide 1 - Project Title

**Title:** PWDConnect PH: Services and Benefits Portal for Persons with Disabilities

**Suggested content:**
- A web-based portal designed to help Persons with Disabilities access government and partner assistance programs.
- Provides separate workflows for PWD users and system administrators.
- Supports service browsing, application tracking, document submission, voucher generation, support requests, and announcements.

**Speaker notes:**
PWDConnect PH is an integrated online platform that centralizes services and benefits for Persons with Disabilities. The system makes it easier for users to apply for assistance and for administrators to manage, verify, and monitor applications.

**Suggested visual:**
- System logo or login page screenshot
- Simple diagram showing two roles: User and Admin



### Slide 2 - Project Background

**Suggested content:**
- Persons with Disabilities often need easier access to assistance programs, requirements, and application updates.
- Manual processing can make tracking applications and verifying documents slower.
- PWDConnect PH provides a digital process for applying, submitting requirements, receiving updates, and claiming approved assistance through vouchers.

**Speaker notes:**
The project responds to the need for a more organized and accessible service portal. Instead of relying only on manual transactions, users can submit applications online while administrators can review records in one system.

**Suggested visual:**
- Before-and-after process flow:
  - Manual inquiry and paper documents
  - Online application, document upload, verification, voucher

---

### Slide 3 - Project Objectives

**Suggested content:**
- Provide an accessible online portal for PWD service applications.
- Allow users to browse available assistance programs and submit applications.
- Enable users to upload required documents after approval.
- Help administrators manage users, services, applications, requirements, vouchers, announcements, and support requests.
- Improve transparency through application status tracking and audit logs.
- Strengthen account security through password hashing, JWT authentication, email verification, and optional two-factor authentication.

**Speaker notes:**
The main objective is to simplify access to PWD services while keeping the process organized and secure. The system also helps administrators monitor activity and maintain records more efficiently.

**Suggested visual:**
- Objective icons: accessibility, services, documents, admin, security, tracking

---

### Slide 4 - Target Users

**Suggested content:**
- **PWD Users**
  - Register and verify account
  - Browse services
  - Apply for assistance
  - Upload requirements
  - Track application status
  - View generated vouchers
  - Submit support requests

- **Administrators**
  - Manage registered users
  - Create and update services
  - Review applications
  - Verify or reject requirements
  - Generate and manage vouchers
  - Post announcements
  - Respond to support requests
  - View audit logs and reports

**Speaker notes:**
The system has two primary roles. PWD users focus on applying for services and monitoring their requests, while administrators manage records and control the approval and verification workflow.

**Suggested visual:**
- Two-column role comparison

---

### Slide 5 - Main Features: User Side

**Suggested content:**
- User registration with Gmail verification code.
- Secure login with optional two-factor authentication.
- User dashboard with application and service overview.
- Browse available services such as wheelchair assistance, medical support, education grants, transport subsidy, job training, and housing assistance.
- Apply for services and prevent duplicate active applications.
- Upload required documents after admin approval.
- Track application, requirement, and voucher status.
- Submit and monitor support requests.
- Manage personal profile information.

**Speaker notes:**
For users, the system focuses on convenience and visibility. They can register, apply, upload requirements, and track progress without needing to visit multiple offices just to ask for updates.

**Suggested visual:**
- Screenshots of user dashboard, services page, applications page, and profile page

---

### Slide 6 - Main Features: Admin Side

**Suggested content:**
- Admin dashboard with system statistics.
- User management for registered PWD users.
- Service management for available assistance programs.
- Application review and status updates.
- Requirement verification and rejection with remarks.
- Automatic voucher generation after successful requirement verification.
- Voucher status management: Active, Used, Expired, or Cancelled.
- Announcement posting and management.
- Support request monitoring and replies.
- Audit log viewing for admin actions.
- Reports page for administrative overview.

**Speaker notes:**
Administrators use the system as a control center. They can maintain records, process applications, verify uploaded documents, and generate vouchers once requirements are approved.

**Suggested visual:**
- Admin dashboard screenshot
- Admin module tiles screenshot

---

### Slide 7 - Application Workflow

**Suggested content:**
1. User registers and verifies email.
2. User logs in and browses services.
3. User submits a service application.
4. Admin reviews the application.
5. If approved, user uploads required documents.
6. Admin verifies submitted requirements.
7. System generates a voucher with a QR code.
8. User views voucher and assistance confirmation.

**Speaker notes:**
The system follows a clear application lifecycle from account creation to voucher generation. Each status helps users and administrators understand the current step.

**Suggested visual:**
- Horizontal process flow:
  Register -> Apply -> Approve -> Upload Requirements -> Verify -> Generate Voucher

---

### Slide 8 - Security and Data Protection Features

**Suggested content:**
- Passwords are hashed using bcrypt before storage.
- JSON Web Token is used for protected routes and API access.
- Role-based access separates user and admin features.
- Email verification is required before account creation is completed.
- Optional authenticator-based two-factor authentication is available for users.
- Audit logs record important admin actions.
- Uploaded documents are stored through the backend upload module.

**Speaker notes:**
The system includes several security layers. These features help protect user accounts, restrict access by role, and provide traceability for administrative actions.

**Suggested visual:**
- Security layer diagram: Authentication, Authorization, Verification, Audit Logs

---

### Slide 9 - Technologies Used

**Suggested content:**
- **Frontend:** React, Vite, React Router, Axios, CSS
- **Backend:** Node.js, Express.js
- **Database:** SQLite
- **Authentication and Security:** bcryptjs, JSON Web Token, custom TOTP utility, QR code generation
- **Email:** Nodemailer for verification emails
- **File Uploads:** Multer
- **Development Tools:** npm, Nodemon, ESLint
- **Documentation and Assets:** SQL schema, project PDF, frontend public assets

**Speaker notes:**
The frontend is built with React and Vite for a fast web interface. The backend uses Node.js and Express to provide REST API endpoints. SQLite stores the system records, while supporting libraries handle authentication, file uploads, email verification, and QR code generation.

**Suggested visual:**
- Technology stack diagram:
  React UI -> Axios -> Express API -> SQLite Database

---

### Slide 10 - Database Overview

**Suggested content:**
- Main database tables:
  - users
  - admins
  - pending_registrations
  - services
  - applications
  - requirements
  - application_documents
  - vouchers
  - announcements
  - support_requests
  - audit_logs
- Relationships connect users, applications, services, requirements, and vouchers.
- Foreign keys help keep records linked and organized.

**Speaker notes:**
The database is structured around the application process. A user applies for a service, submits requirements, and receives a voucher after verification. Support requests, announcements, and audit logs support communication and monitoring.

**Suggested visual:**
- Simplified ERD with User, Service, Application, Requirement, Voucher, Admin

---

### Slide 11 - System Architecture

**Suggested content:**
- React frontend handles pages, routing, user interface, and API calls.
- Express backend exposes REST API routes for authentication, users, services, applications, requirements, vouchers, announcements, support, and audit logs.
- SQLite database stores system data locally.
- Uploaded documents are saved in the backend uploads directory and referenced by database records.

**Speaker notes:**
PWDConnect PH uses a client-server structure. The frontend communicates with the backend through Axios, while the backend handles business logic and database operations.

**Suggested visual:**
- Architecture block diagram:
  Browser / React Frontend -> Express API -> SQLite DB
  Express API -> Uploads Folder

---

### Slide 12 - Summary

**Suggested content:**
- PWDConnect PH centralizes PWD services and benefits in one portal.
- Users can apply, upload requirements, track status, and view vouchers.
- Administrators can manage the full service application workflow.
- The system uses modern web technologies with authentication, verification, file upload, QR voucher, and audit features.
- The project supports faster, more transparent, and more organized assistance processing.

**Speaker notes:**
Overall, the system improves accessibility and administrative efficiency by digitizing the PWD service application process from registration to voucher generation.

**Suggested visual:**
- Final system value statement:
  Accessible service access, organized management, transparent tracking

