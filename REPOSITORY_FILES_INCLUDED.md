# Repository Integration Notes

This ZIP follows the structure of the public GitHub repository:

- backend/
- public/
- src or frontend/src/
- package.json
- vite.config.js
- eslint.config.js
- README files

The actual working system is inside:

- frontend/
- backend/
- database/

The frontend is React + Vite.
The backend is Node.js + Express + SQLite.
Authentication uses JWT and bcrypt.
Default admin account:

username: admin
password: admin12345

## How to Run

Terminal 1:
cd backend
npm install
npm run dev

Terminal 2:
cd frontend
npm install
npm run dev
