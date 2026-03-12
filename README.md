# Student Academic Record Management System (Web App)

Tech stack:
- Frontend: HTML, CSS, Bootstrap, JavaScript
- Backend: Node.js + Express.js
- Database: MySQL

## 1) Database setup (MySQL)

1. Open `backend/sql/create_tables.sql` and run it in MySQL (it creates the database + tables).
2. Run `backend/sql/sample_data.sql` to insert default departments + 5 subjects.

Example (MySQL CLI):
```sql
SOURCE backend/sql/create_tables.sql;
SOURCE backend/sql/sample_data.sql;
```

## 2) Backend setup (Node.js)

1. Configure environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Update `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

2. Install dependencies:
```powershell
cd backend
npm install
```

3. Start the server:
```powershell
npm start
```

Server default: `http://localhost:3000`

On first start, if the `admins` table is empty, the backend creates:
- Username: `admin`
- Password: `admin123`

## 3) Frontend

The backend serves the frontend automatically from the `frontend/` folder.
Open in your browser:
- `http://localhost:3000/`

## Main features

- Admin login (session-based) + logout
- Students: create, view, update, delete
- Subjects: create, view, update, delete (scalable)
- Departments: create + list
- Teachers: create, view, update, delete + homeroom validation
- Marks: enter/update per student per subject (0–100)
- Reports: total, average, rank (by total), PASS/FAIL (any subject < 50 = FAIL)

## API (summary)

All API endpoints are under `/api` (most require login session).
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Students: `GET/POST /api/students`, `PUT/DELETE /api/students/:id`
- Subjects: `GET/POST /api/subjects`, `PUT/DELETE /api/subjects/:id`
- Teachers: `GET/POST /api/teachers`, `PUT/DELETE /api/teachers/:id`
- Departments: `GET/POST /api/departments`
- Marks: `GET/POST /api/marks`, `POST /api/marks/bulk`, `PUT/DELETE /api/marks/:id`
- Reports: `GET /api/reports`, `GET /api/reports/:studentId`
