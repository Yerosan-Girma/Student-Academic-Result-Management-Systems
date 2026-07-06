# Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MySQL Server (XAMPP, WAMP, or standalone)
- Git

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

Edit `.env` and update your database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_academic_db
PORT=3000
```

### 4. Setup database
```bash
node setup_db.js --seed
```

This command:
- Creates the database
- Creates all required tables
- Inserts sample data
- Creates default admin account

### 5. Start backend server
```bash
npm start
# or
node server.js
```

Backend will run on `http://localhost:3000`

---

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## Database Structure

### Tables
- **users** - User accounts (admin, teachers, etc.)
- **students** - Student information
- **subjects** - Subjects/courses
- **marks** - Student marks and grades
- **departments** - Departments/classes
- **attendance** - Student attendance records

---

## Default Credentials

### Admin Account
- Username: `admin`
- Password: `admin123`

### Sample Teachers
- Username: `genet`, `alemu`, `tola`, `olyad`, `alemayehu`
- Password: `teacher123`

### Homeroom Teacher
- Username: `addisu`
- Password: `teacher123`

---

## Common Issues & Solutions

### Issue: "Table doesn't exist in engine"
**Solution:** Run database repair
```bash
node setup_db.js --repair --seed
```

### Issue: Cannot connect to MySQL
**Solution:** 
1. Ensure MySQL is running
2. Check database credentials in `.env`
3. Verify database user has correct permissions

### Issue: Port 3000 already in use
**Solution:** Change PORT in `.env` file or kill process using port 3000

### Issue: CORS errors
**Solution:** Check backend/middleware/cors.js configuration

---

## Development Workflow

1. **Backend changes:** Restart server (`npm start`)
2. **Frontend changes:** Auto-reload on save
3. **Database changes:** Run migrations if available
4. **API testing:** Use Postman or similar tool

---

## Deployment

For production deployment, see:
- Backend: Use process manager (PM2, forever)
- Frontend: Build for production with `npm run build`
- Database: Use managed MySQL service
- Environment: Set NODE_ENV=production