# Database Schema and Design

## Database

The application uses:

```text
MongoDB
```

with:

```text
Mongoose
```

for schema definition, validation, references, and indexes.

The application has three main collections:

```text
users
courses
enrollments
```

---

# 1. Users Collection

Mongoose model:

```text
User
```

Collection:

```text
users
```

## Schema

| Field | Type | Required | Constraints / Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | MongoDB primary identifier |
| `name` | String | Yes | Trimmed user name |
| `email` | String | Yes | Lowercased, trimmed, unique |
| `password` | String | Yes | Minimum length 6; stored as bcrypt hash |
| `role` | String | No | Enum: `student`, `instructor`; default `student` |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

## Important Constraint

The email field is defined as:

```text
unique: true
```

This prevents duplicate user email values at the database index level.

---

# 2. Courses Collection

Mongoose model:

```text
Course
```

Collection:

```text
courses
```

## Schema

| Field | Type | Required | Constraints / Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | MongoDB primary identifier |
| `title` | String | Yes | Trimmed course title |
| `description` | String | Yes | Trimmed course description |
| `capacity` | Number | Yes | Minimum value is 1 |
| `enrollmentDeadline` | Date | Yes | Enrollment closing date/time |
| `instructor` | ObjectId | Yes | Reference to `User` |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

## Relationship

```text
courses.instructor
        |
        v
users._id
```

The instructor field stores the ObjectId of the user who created the course.

The actual instructor is taken from the authenticated JWT during course creation rather than trusting an instructor ID supplied by the client.

---

# 3. Enrollments Collection

Mongoose model:

```text
Enrollment
```

Collection:

```text
enrollments
```

## Schema

| Field | Type | Required | Constraints / Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | MongoDB primary identifier |
| `student` | ObjectId | Yes | Reference to `User` |
| `course` | ObjectId | Yes | Reference to `Course` |
| `enrolledAt` | Date | No | Defaults to current date/time |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

## Relationships

```text
enrollments.student
        |
        v
users._id


enrollments.course
        |
        v
courses._id
```

---

# Entity Relationship Diagram

```text
                    ┌──────────────────┐
                    │       User       │
                    │──────────────────│
                    │ _id              │
                    │ name             │
                    │ email            │
                    │ password         │
                    │ role             │
                    └────────┬─────────┘
                             │
                             │ instructor
                             │ creates
                             ▼
                    ┌──────────────────┐
                    │      Course      │
                    │──────────────────│
                    │ _id              │
                    │ title            │
                    │ description      │
                    │ capacity         │
                    │ enrollmentDeadline│
                    │ instructor       │
                    └────────┬─────────┘
                             │
                             │ course
                             ▼
                    ┌──────────────────┐
                    │    Enrollment    │
                    │──────────────────│
                    │ _id              │
                    │ student          │
                    │ course           │
                    │ enrolledAt       │
                    └────────┬─────────┘
                             │
                             │ student
                             ▼
                    ┌──────────────────┐
                    │       User       │
                    │     (Student)    │
                    └──────────────────┘
```

A single `User` collection represents both students and instructors. The `role` field determines the user's role.

---

# Indexes and Constraints

## 1. Unique User Email

The User schema defines:

```text
email: {
  type: String,
  unique: true
}
```

### Reason

A user should not be able to register multiple accounts using the same email address.

---

## 2. Unique Student-Course Enrollment

The Enrollment schema defines the compound unique index:

```text
{ student: 1, course: 1 }
```

with:

```text
unique: true
```

### Reason

This enforces the rule:

```text
One student + one course = maximum one enrollment
```

Therefore, duplicate enrollment is prevented at the database level.

The controller also checks for an existing enrollment before insertion so that the API can return a meaningful `409 Conflict` response.

---

## 3. ObjectId References

The following references are used:

```text
Course.instructor → User._id

Enrollment.student → User._id

Enrollment.course → Course._id
```

### Reason

ObjectId references keep the collections separated while allowing Mongoose `populate()` to retrieve related data when required.

---

# Business Rules Implemented at Application Level

Some constraints depend on current application state and therefore are checked by the controllers.

## Course Capacity

Before enrollment:

```text
current enrollment count >= course.capacity
```

If true, enrollment is rejected.

```text
Course is full
```

---

## Enrollment Deadline

Before enrollment:

```text
current time > enrollmentDeadline
```

If true, enrollment is rejected.

When creating or updating a course, the deadline must also be a valid future date.

---

## Instructor Cannot Enroll in Own Course

Before enrollment:

```text
course.instructor === authenticated user
```

If true, enrollment is rejected.

---

## Course Ownership

For update and delete operations:

```text
course.instructor === authenticated user
```

Only when this condition is true can the instructor modify or delete the course.

---

## Course Capacity During Update

When changing course capacity, the application counts existing enrollments.

The new capacity cannot be lower than the current enrollment count.

Example:

```text
Current enrollments = 8
New capacity = 5

Result:
Update rejected
```

---

# Course Deletion and Related Enrollments

When a course is deleted, the controller first executes:

```text
Delete enrollments where course = deleted course
```

and then deletes the course itself.

The logical flow is:

```text
Delete Course Request
        |
        v
Verify Course Exists
        |
        v
Verify Course Creator
        |
        v
Delete Related Enrollments
        |
        v
Delete Course
```

### Reason

This prevents orphaned enrollment documents from remaining after their course has been deleted.

---

# Database Design Summary

```text
┌─────────────┐
│    Users    │
├─────────────┤
│ _id         │
│ name        │
│ email       │ ← unique
│ password    │
│ role        │
└──────┬──────┘
       │
       │ 1-to-many
       │
       ▼
┌─────────────┐
│   Courses   │
├─────────────┤
│ _id         │
│ title       │
│ description │
│ capacity    │
│ deadline    │
│ instructor  │ → Users._id
└──────┬──────┘
       │
       │ 1-to-many
       │
       ▼
┌────────────────────┐
│    Enrollments     │
├────────────────────┤
│ _id                │
│ student            │ → Users._id
│ course             │ → Courses._id
│ enrolledAt         │
└────────────────────┘
       ▲
       │
       │ belongs to
       │
     Users
    (Student)
```

---

# Design Decisions

### MongoDB + Mongoose

MongoDB was used for persistence and Mongoose provides structured schemas, ObjectId references, validation rules, and indexes.

### Separate Collections

Users, courses, and enrollments are stored separately because they represent different entities and relationships.

### Compound Unique Enrollment Index

The `{ student, course }` unique index directly enforces the duplicate-enrollment business rule.

### Application-Level Business Logic

Capacity, deadline, course ownership, and instructor self-enrollment are checked in the controller because these rules depend on the current state of multiple documents or the authenticated user.

### Related Enrollment Cleanup

Course deletion explicitly removes associated enrollments before deleting the course to avoid stale enrollment records.
