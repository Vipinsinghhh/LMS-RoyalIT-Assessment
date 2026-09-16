# LMS Enrollment API

A RESTful backend API for a mini Learning Management System (LMS). The system allows instructors to create and manage courses and allows students to enroll in and manage their course enrollments.

The project implements JWT authentication, role-based access control (RBAC), course management, enrollment management, validation, and consistent API error responses.

---

## Features

### Authentication & Authorization
- User registration
- User login
- JWT-based authentication
- Protected APIs
- Role-Based Access Control (RBAC)
- Student and Instructor roles
- Protected current-user endpoint

### Course Management
- Create course — Instructor only
- Get all courses — Public
- Get course by ID — Public
- Update course — Course creator only
- Delete course — Course creator only
- Course capacity validation
- Enrollment deadline validation
- Course ownership validation

### Enrollment Management
- Enroll in a course — Student only
- Unenroll from a course — Student only
- View own enrollments — Student only
- Duplicate enrollment prevention
- Course capacity validation
- Enrollment deadline validation
- Instructors cannot enroll in their own courses
- Related enrollments are removed when a course is deleted

### Validation & Error Handling
- Required-field validation
- Password authentication
- Invalid/expired JWT handling
- Unauthorized access handling
- Course not found handling
- Invalid course ID handling
- Duplicate enrollment handling
- Enrollment deadline validation
- Course capacity validation
- Meaningful JSON error messages

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs
- dotenv
- CORS
- Nodemon
- ES Modules

---

## Project Structure

```text
LMS-RoyalIT-Assessment/
│
├── Backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   └── enrollmentController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Course.js
│   │   └── Enrollment.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── courseRoutes.js
│   │   └── enrollmentRoutes.js
│   │
│   ├── docs/
│   │   ├── Api.md
│   │   └── DATABASE_SCHEMA.md
│   │
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .gitignore
│
└── Readme.md
```

> The `.env` file is intentionally not part of the documented project tree because it contains environment-specific secrets and must not be committed to Git.

---

# User Roles

The API supports two roles.

## Student

A student can:

- View courses
- Enroll in a course
- Unenroll from a course
- View their own enrollments

## Instructor

An instructor can:

- Create courses
- View courses
- Update courses created by themselves
- Delete courses created by themselves

An instructor cannot enroll in their own course.

---

# Authentication

Authentication uses JWT.

After a successful login, the API returns a JWT token containing the authenticated user's ID and role.

Use the token for protected endpoints:

```text
Authorization: Bearer <JWT_TOKEN>
```

The authentication middleware verifies the token and stores the decoded information in:

```text
req.user
```

The role middleware then checks whether the user's role is allowed to access the requested endpoint.

---

# API Overview

## Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a user |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/me` | Authenticated | Get authenticated user information |

## Courses

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/courses` | Instructor | Create course |
| GET | `/api/courses` | Public | Get all courses |
| GET | `/api/courses/:id` | Public | Get course by ID |
| PATCH | `/api/courses/:id` | Instructor + Owner | Update own course |
| DELETE | `/api/courses/:id` | Instructor + Owner | Delete own course |

## Enrollments

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/courses/:courseId/enroll` | Student | Enroll in course |
| DELETE | `/api/courses/:courseId/enroll` | Student | Unenroll from course |
| GET | `/api/my-enrollments` | Student | Get own enrollments |

For complete request/response details, see [`Backend/docs/Api.md`](Backend/docs/Api.md).

---

# Business Rules

The implementation enforces the following rules:

1. A student cannot enroll in the same course twice.
2. Enrollment is rejected when the course is full.
3. Enrollment is rejected after the enrollment deadline.
4. An instructor cannot enroll in their own course.
5. Only the instructor who created a course can update it.
6. Only the instructor who created a course can delete it.
7. Deleting a course also deletes all enrollments associated with that course.
8. Course capacity cannot be reduced below the current number of enrollments.
9. A course enrollment deadline must be a valid future date when creating or updating a course.

---

# Database Design

MongoDB is used with Mongoose for schema definition, validation, ObjectId references, and indexing.

The database contains three collections:

- `users`
- `courses`
- `enrollments`

### Relationships

```text
User (Instructor)
       |
       | creates
       v
     Course
       |
       | referenced by
       v
   Enrollment
       ^
       |
       | references
       |
User (Student)
```

### Key Constraints

- `User.email` is unique.
- `Course.instructor` references `User`.
- `Enrollment.student` references `User`.
- `Enrollment.course` references `Course`.
- `Enrollment` has a unique compound index on `{ student, course }`.

Detailed schema information is available in [`Backend/docs/DATABASE_SCHEMA.md`](Backend/docs/DATABASE_SCHEMA.md).

---

# API Response Format

Successful responses generally use:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Some successful endpoints return only `success` and `data` or `success` and `message`, according to the operation.

Error responses use:

```json
{
  "success": false,
  "message": "Error message"
}
```

---

# HTTP Status Codes

| Status Code | Usage |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Invalid input or business-rule violation |
| 401 | Authentication required / invalid or expired token |
| 403 | User is not authorized |
| 404 | Resource not found |
| 409 | Duplicate resource/enrollment |
| 500 | Internal server error |

---

# Setup Instructions

## Prerequisites

Install:

- Node.js 18 or later
- MongoDB / MongoDB Atlas
- npm

The project uses Express 5 and its dependency tree requires a modern Node.js version.

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd LMS-RoyalIT-Assessment/Backend
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the repository URL.

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a `.env` file inside the `Backend` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Do not commit `.env` to GitHub.

The repository `.gitignore` already excludes:

```text
node_modules/
.env
```

## 4. Run in Development Mode

```bash
npm run dev
```

## 5. Run in Normal Mode

```bash
npm start
```

The server runs on:

```text
http://localhost:5000
```

A successful root request to `/` returns:

```json
{
  "success": true,
  "message": "LMS Enrollment API is running"
}
```

---

# Testing

The APIs can be tested using Postman, Thunder Client, or another REST client.

Recommended flow:

1. Register an instructor.
2. Register a student.
3. Login as instructor and save the JWT.
4. Create a course.
5. Get all courses.
6. Get a course by ID.
7. Login as student and save the JWT.
8. Enroll in a course.
9. Get my enrollments.
10. Try enrolling in the same course again.
11. Unenroll from the course.
12. Test the course-capacity rule.
13. Test the enrollment-deadline rule.
14. Test instructor attempting to enroll in their own course.
15. Test another instructor attempting to update/delete someone else's course.
16. Test an invalid/expired JWT.
17. Test invalid input.
18. Test a non-existing course.
19. Delete a course and verify its related enrollments are removed.

---

# Security Notes

- Passwords are hashed using bcryptjs before being stored.
- Password hashes are not returned in authentication responses.
- JWT is required for protected endpoints.
- Role-based middleware restricts Student and Instructor APIs.
- Course ownership is checked before update and delete operations.
- `.env` is excluded from version control.

---

# Future Improvements

Possible production-level improvements include:

- Automated unit and integration tests
- Centralized error-handling middleware
- More advanced request validation
- Refresh tokens
- Rate limiting
- Pagination and filtering
- MongoDB transactions for multi-step operations
- Production logging and monitoring
- More detailed API versioning

---

# Documentation

- [API Documentation](Backend/docs/Api.md)
- [Database Schema](Backend/docs/DATABASE_SCHEMA.md)
