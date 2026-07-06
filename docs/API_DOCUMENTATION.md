# API Documentation

## Overview
This document describes all available API endpoints for the Student Academic Result Management System.

## Base URL
```
http://localhost:3000/api
```

## Authentication Endpoints

### Login
- **URL:** `POST /auth/login`
- **Description:** Authenticate user with username and password
- **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Response:** `{ message: "Login successful", user: { id, username, role } }`

### Logout
- **URL:** `POST /auth/logout`
- **Description:** Logout current user
- **Response:** `{ message: "Logout successful" }`

### Get Current User
- **URL:** `GET /auth/me`
- **Description:** Get current logged-in user information
- **Response:** `{ userId: number, role: string }`

---

## Student Endpoints

### Get All Students
- **URL:** `GET /students`
- **Description:** Retrieve all students
- **Response:** Array of student objects

### Get Student by ID
- **URL:** `GET /students/:id`
- **Description:** Get specific student by ID
- **Response:** Student object

### Create Student
- **URL:** `POST /students`
- **Description:** Create new student
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "department_id": 1,
    "enrollment_number": "2024001"
  }
  ```

### Update Student
- **URL:** `PUT /students/:id`
- **Description:** Update student information
- **Request Body:** Same as create

### Delete Student
- **URL:** `DELETE /students/:id`
- **Description:** Delete student

---

## Marks Endpoints

### Get Student Marks
- **URL:** `GET /marks/student/:studentId`
- **Description:** Get all marks for a specific student
- **Response:** Array of mark objects

### Get Class Marks
- **URL:** `GET /marks/class/:departmentId`
- **Description:** Get all marks for a class/department
- **Response:** Array of mark objects

### Add Marks
- **URL:** `POST /marks`
- **Description:** Add marks for a student
- **Request Body:**
  ```json
  {
    "student_id": 1,
    "subject_id": 1,
    "test1": 80,
    "test2": 85,
    "assignment": 90,
    "final_exam": 88
  }
  ```

### Update Marks
- **URL:** `PUT /marks/:id`
- **Description:** Update marks for a subject
- **Request Body:** Same as add marks

---

## Report Endpoints

### Generate Student Report
- **URL:** `GET /reports/student/:studentId`
- **Description:** Generate academic report card for student
- **Response:**
  ```json
  {
    "student": { /* student data */ },
    "marks": [ /* all marks */ ],
    "gpa": 3.75,
    "generatedDate": "2026-07-06"
  }
  ```

### Generate Class Report
- **URL:** `GET /reports/class/:departmentId`
- **Description:** Generate class performance report
- **Response:**
  ```json
  {
    "classStats": {
      "totalStudents": 30,
      "averageMarks": 85.5,
      "highestMark": 95,
      "lowestMark": 65
    },
    "topPerformers": [ /* top students */ ]
  }
  ```

---

## Error Responses

All errors return appropriate HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

Error response format:
```json
{
  "error": "Error message description"
}
```