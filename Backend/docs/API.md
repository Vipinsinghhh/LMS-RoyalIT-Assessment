# LMS Enrollment API Documentation

## Base URL

```text
http://localhost:5000
```

All endpoints below are relative to the base URL.

---

# Authentication

Protected endpoints require a JWT.

Add the following HTTP header:

```text
Authorization: Bearer <JWT_TOKEN>
```

The token is returned by the login endpoint.

---

# 1. Authentication APIs

## 1.1 Register User

### Endpoint

```http
POST /api/auth/register
```

### Access

Public

### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

### Fields

| Field | Required | Description |
|---|---|---|
| name | Yes | User name |
| email | Yes | Unique user email |
| password | Yes | Password |
| role | No | `student` or `instructor`; defaults to `student` |

### Success

**201 Created**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "<USER_ID>",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

The password is not returned.

### Errors

**400 Bad Request**

```json
{
  "success": false,
  "message": "Name, email and password are required"
}
```

**409 Conflict**

```json
{
  "success": false,
  "message": "User already exists"
}
```

---

## 1.2 Login

### Endpoint

```http
POST /api/auth/login
```

### Access

Public

### Request Body

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Success

**200 OK**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<JWT_TOKEN>",
    "user": {
      "id": "<USER_ID>",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    }
  }
}
```

### Errors

**400 Bad Request**

```json
{
  "success": false,
  "message": "Email and password are required"
}
```

**401 Unauthorized**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 1.3 Get Current User

### Endpoint

```http
GET /api/auth/me
```

### Access

Authenticated users

### Headers

```text
Authorization: Bearer <JWT_TOKEN>
```

### Success

**200 OK**

```json
{
  "success": true,
  "message": "Authenticated user",
  "data": {
    "userId": "<USER_ID>",
    "role": "student"
  }
}
```

### Errors

**401 Unauthorized**

```json
{
  "success": false,
  "message": "Authentication required"
}
```

or:

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

# 2. Course APIs

## 2.1 Create Course

### Endpoint

```http
POST /api/courses
```

### Access

Instructor only

### Headers

```text
Authorization: Bearer <INSTRUCTOR_JWT_TOKEN>
Content-Type: application/json
```

### Request Body

```json
{
  "title": "Node.js Backend Development",
  "description": "Learn backend development using Node.js and Express.",
  "capacity": 30,
  "enrollmentDeadline": "2026-12-31T23:59:59.000Z"
}
```

### Fields

| Field | Required | Description |
|---|---|---|
| title | Yes | Course title |
| description | Yes | Course description |
| capacity | Yes | Maximum number of students; minimum 1 |
| enrollmentDeadline | Yes | Valid future date |

The `instructor` is not accepted from the request body. It is taken from the authenticated instructor's JWT.

### Success

**201 Created**

```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "_id": "<COURSE_ID>",
    "title": "Node.js Backend Development",
    "description": "Learn backend development using Node.js and Express.",
    "capacity": 30,
    "enrollmentDeadline": "2026-12-31T23:59:59.000Z",
    "instructor": "<INSTRUCTOR_ID>"
  }
}
```

### Errors

**400 Bad Request**

Required fields:

```json
{
  "success": false,
  "message": "Title, description, capacity and enrollment deadline are required"
}
```

Invalid capacity:

```json
{
  "success": false,
  "message": "Capacity must be at least 1"
}
```

Invalid deadline:

```json
{
  "success": false,
  "message": "Invalid enrollment deadline"
}
```

Past deadline:

```json
{
  "success": false,
  "message": "Enrollment deadline must be in the future"
}
```

**401 Unauthorized**

Authentication is required.

**403 Forbidden**

User is not an instructor.

---

## 2.2 Get All Courses

### Endpoint

```http
GET /api/courses
```

### Access

Public

### Success

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "_id": "<COURSE_ID>",
      "title": "Node.js Backend Development",
      "description": "Learn backend development using Node.js and Express.",
      "capacity": 30,
      "enrollmentDeadline": "2026-12-31T23:59:59.000Z",
      "instructor": {
        "_id": "<INSTRUCTOR_ID>",
        "name": "John Instructor",
        "email": "instructor@example.com"
      }
    }
  ]
}
```

Courses are sorted by newest creation time first.

---

## 2.3 Get Course By ID

### Endpoint

```http
GET /api/courses/:id
```

### Access

Public

### Example

```http
GET /api/courses/<COURSE_ID>
```

### Success

**200 OK**

The response contains the course and populated instructor information.

### Errors

**404 Not Found**

```json
{
  "success": false,
  "message": "Course not found"
}
```

For an invalid MongoDB ObjectId, the current implementation returns:

**500 Internal Server Error**

```json
{
  "success": false,
  "message": "Invalid course ID"
}
```

---

## 2.4 Update Course

### Endpoint

```http
PATCH /api/courses/:id
```

### Access

Instructor who created the course

### Headers

```text
Authorization: Bearer <INSTRUCTOR_JWT_TOKEN>
Content-Type: application/json
```

### Request Body

All supported fields are optional.

Example:

```json
{
  "title": "Advanced Node.js Backend Development",
  "capacity": 40,
  "enrollmentDeadline": "2026-12-31T23:59:59.000Z"
}
```

Supported fields:

- `title`
- `description`
- `capacity`
- `enrollmentDeadline`

### Important Rules

- The course must exist.
- The authenticated user must be the course creator.
- Capacity must be at least 1.
- New deadline must be valid and in the future.
- Capacity cannot be lower than the current number of enrollments.

### Success

**200 OK**

```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {}
}
```

### Errors

**404 Not Found**

```json
{
  "success": false,
  "message": "Course not found"
}
```

**403 Forbidden**

```json
{
  "success": false,
  "message": "You can only update your own courses"
}
```

**400 Bad Request**

```json
{
  "success": false,
  "message": "Capacity must be at least 1"
}
```

or:

```json
{
  "success": false,
  "message": "Invalid enrollment deadline"
}
```

or:

```json
{
  "success": false,
  "message": "Enrollment deadline must be in the future"
}
```

or, when lowering capacity below existing enrollments:

```json
{
  "success": false,
  "message": "Capacity cannot be less than current enrollment count (N)"
}
```

---

## 2.5 Delete Course

### Endpoint

```http
DELETE /api/courses/:id
```

### Access

Instructor who created the course

### Headers

```text
Authorization: Bearer <INSTRUCTOR_JWT_TOKEN>
```

### Behavior

The API:

1. Finds the course.
2. Verifies that the authenticated instructor is the course creator.
3. Deletes all enrollments for that course.
4. Deletes the course.

### Success

**200 OK**

```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

### Errors

**404 Not Found**

```json
{
  "success": false,
  "message": "Course not found"
}
```

**403 Forbidden**

```json
{
  "success": false,
  "message": "You can only delete your own courses"
}
```

---

# 3. Enrollment APIs

## 3.1 Enroll In Course

### Endpoint

```http
POST /api/courses/:courseId/enroll
```

### Access

Student only

### Headers

```text
Authorization: Bearer <STUDENT_JWT_TOKEN>
```

### Request Body

No request body is required.

### Example

```http
POST /api/courses/<COURSE_ID>/enroll
```

### Validation Flow

The API checks:

1. Course exists.
2. Student is not the course instructor.
3. Enrollment deadline has not passed.
4. Student is not already enrolled.
5. Course has available capacity.
6. Enrollment is created.

### Success

**201 Created**

```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "_id": "<ENROLLMENT_ID>",
    "student": "<STUDENT_ID>",
    "course": "<COURSE_ID>",
    "enrolledAt": "2026-09-17T10:00:00.000Z"
  }
}
```

### Errors

**404 Not Found**

```json
{
  "success": false,
  "message": "Course not found"
}
```

**403 Forbidden**

```json
{
  "success": false,
  "message": "Instructor cannot enroll in their own course"
}
```

**400 Bad Request**

Deadline:

```json
{
  "success": false,
  "message": "Enrollment deadline has passed"
}
```

Capacity:

```json
{
  "success": false,
  "message": "Course is full"
}
```

**409 Conflict**

```json
{
  "success": false,
  "message": "You are already enrolled in this course"
}
```

The application also handles MongoDB duplicate-key errors from the unique enrollment index.

---

## 3.2 Unenroll From Course

### Endpoint

```http
DELETE /api/courses/:courseId/enroll
```

### Access

Student only

### Headers

```text
Authorization: Bearer <STUDENT_JWT_TOKEN>
```

### Example

```http
DELETE /api/courses/<COURSE_ID>/enroll
```

### Success

**200 OK**

```json
{
  "success": true,
  "message": "Successfully unenrolled from course"
}
```

### Errors

**404 Not Found**

```json
{
  "success": false,
  "message": "Enrollment not found"
}
```

---

## 3.3 Get My Enrollments

### Endpoint

```http
GET /api/my-enrollments
```

### Access

Student only

### Headers

```text
Authorization: Bearer <STUDENT_JWT_TOKEN>
```

### Success

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "_id": "<ENROLLMENT_ID>",
      "student": "<STUDENT_ID>",
      "course": {
        "_id": "<COURSE_ID>",
        "title": "Node.js Backend Development",
        "description": "Learn backend development using Node.js and Express.",
        "capacity": 30,
        "enrollmentDeadline": "2026-12-31T23:59:59.000Z"
      },
      "enrolledAt": "2026-09-17T10:00:00.000Z"
    }
  ]
}
```

Enrollments are sorted by newest creation time first.

---

# Authorization Matrix

| Endpoint | Public | Student | Instructor |
|---|---:|---:|---:|
| Register | Yes | Yes | Yes |
| Login | Yes | Yes | Yes |
| Get Current User | No | Yes | Yes |
| Get All Courses | Yes | Yes | Yes |
| Get Course By ID | Yes | Yes | Yes |
| Create Course | No | No | Yes |
| Update Course | No | No | Yes* |
| Delete Course | No | No | Yes* |
| Enroll | No | Yes | No |
| Unenroll | No | Yes | No |
| Get My Enrollments | No | Yes | No |

`*` For update/delete, the instructor must also be the creator of that course.

---

# Authentication Middleware Errors

Protected APIs can return:

### Missing Authorization Header

**401 Unauthorized**

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Invalid or Expired JWT

**401 Unauthorized**

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### Insufficient Role

**403 Forbidden**

```json
{
  "success": false,
  "message": "You are not authorized to perform this action"
}
```

---

# Common Status Codes

| Status | Meaning |
|---|---|
| 200 | Successful operation |
| 201 | Resource created |
| 400 | Invalid input / business rule violation |
| 401 | Authentication required / invalid or expired token |
| 403 | Insufficient role or resource ownership |
| 404 | Resource not found |
| 409 | Duplicate enrollment/user |
| 500 | Server-side error |

---

# Root Health Endpoint

### Endpoint

```http
GET /
```

### Access

Public

### Response

```json
{
  "success": true,
  "message": "LMS Enrollment API is running"
}
```
