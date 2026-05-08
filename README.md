# PWDConnect PH - Integrated System

PWDConnect PH is a services and benefits portal for Persons with Disabilities.  
This integrated version includes:

- User registration and login
- Admin login
- JWT authentication
- Password hashing using bcrypt
- User dashboard
- Admin dashboard
- Browse services
- Apply for services
- Track applications
- Manage support requests
- Announcements
- Logout function
- SQLite database for easier local setup

## Tech Stack

Frontend:
- React + Vite
- React Router
- Axios
- CSS

Backend:
- Node.js
- Express
- SQLite
- bcrypt
- JSON Web Token

## Default Admin Account

Username: `admin`  
Password: `admin12345`

## How to Run

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## Important Notes

The backend automatically creates the database and sample data when started.

Sample services include:
- Wheelchair Assistance Program
- Medical Support Services
- Education Grant Program
- Transport Subsidy
- Job Training & Employment
- Housing Assistance
