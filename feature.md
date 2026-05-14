# UniSphere Attendance Management System Prompt

## Overview
Build a smart Attendance Management System for the UniSphere university platform using the MERN stack (MongoDB, Express.js, React.js, Node.js). The system should allow mentors to manage attendance efficiently while enabling students to track their attendance records in real time.

---

# Core Features

## 1. Student Attendance Dashboard
Students should be able to:

- View overall attendance percentage
- View subject-wise attendance
- Check present/absent history
- Access attendance reports by date/month
- Get low attendance warnings
- Download attendance summary
- View attendance trends using charts/graphs

---

## 2. Mentor Attendance Management
Mentors should be able to:

- Create attendance sessions
- Mark attendance for students
- Edit/update attendance records
- View class attendance statistics
- Filter attendance by course, section, or subject
- Search students quickly
- Generate attendance reports
- Export attendance data as PDF or Excel

---

# Attendance Features

## Student Side
- Real-time attendance updates
- Attendance percentage calculator
- Notifications for low attendance
- Monthly attendance analytics
- Attendance calendar view

## Mentor Side
- One-click mark all present
- Bulk attendance update
- Auto-save attendance
- Attendance correction requests
- Attendance locking after submission

---

# Role-Based Access

## Students
- Can only view their own attendance

## Mentors
- Can manage attendance for assigned classes/subjects

## Admins
- Full access to all attendance records and analytics

---

# UI/UX Requirements

- Modern responsive dashboard
- Clean attendance tables
- Color indicators:
  - Green → Present
  - Red → Absent
  - Yellow → Leave/Pending
- Progress bars for attendance percentage
- Charts and graphs for analytics
- Mobile-friendly interface
- Dark/light mode support

---

# Backend Features

- JWT Authentication
- Role-Based Access Control (RBAC)
- REST APIs for attendance operations
- MongoDB schemas for:
  - Users
  - Subjects
  - Attendance Records
  - Classes/Sections
- Secure validation and error handling

---

# Suggested Database Models

## Attendance Model
```js
{
  studentId,
  mentorId,
  subjectId,
  date,
  status,
  remarks
}