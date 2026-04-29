# UniSphere Backend

Simple Node.js + Express + MongoDB backend with two features:
**Complaint Management** and **Leave System**.

## Stack

- Node.js 18+
- Express 4
- MongoDB + Mongoose 8
- JWT auth (`jsonwebtoken`)
- Validation (`express-validator`)
- Password hashing (`bcryptjs`)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Make sure MongoDB is running locally on default port 27017
#    (or set MONGO_URI in .env to point elsewhere)

# 3. Copy env template (already done; edit values if needed)
cp .env.example .env

# 4. Run in dev mode (auto-restarts on changes)
npm run dev
```

The server starts at `http://localhost:4000`.

## Folder structure

```
src/
├── server.js                 # entry — connects DB and starts the HTTP server
├── app.js                    # builds the Express app (middleware + routes)
├── config/
│   ├── env.js                # loads .env values
│   ├── database.js           # MongoDB connection
│   └── cors.js
├── middlewares/
│   ├── auth.middleware.js    # verifyJwt — reads "Authorization: Bearer ..."
│   ├── rbac.middleware.js    # requireRole('STUDENT' | 'MENTOR')
│   ├── validate.middleware.js
│   ├── error.middleware.js   # central error handler
│   └── notFound.middleware.js
├── services/
│   ├── jwt.service.js        # generate / verify JWTs
│   └── hash.service.js       # bcrypt hash + compare
├── utils/
│   ├── AppError.js           # custom Error with statusCode + code
│   ├── asyncHandler.js       # wrap async controllers
│   ├── apiResponse.js        # ok() / created() / noContent()
│   └── logger.js
├── models/                   # Mongoose schemas
│   ├── index.js
│   ├── user.model.js
│   ├── complaint.model.js
│   └── leave.model.js
└── modules/                  # feature folders
    ├── auth/                 # register / login / me
    ├── complaints/           # student creates, mentor reviews
    └── leave/                # student applies, mentor approves/rejects
```

## API endpoints

All responses use this envelope:

```json
{ "success": true, "message": "...", "data": { ... } }
```

### Auth

| Method | Path                | Auth   | Body / Notes                                                |
| ------ | ------------------- | ------ | ----------------------------------------------------------- |
| POST   | `/api/auth/register`| public | `{ name, email, password, role: "STUDENT" \| "MENTOR" }`    |
| POST   | `/api/auth/login`   | public | `{ email, password }` → returns `{ token, user }`           |
| GET    | `/api/auth/me`      | JWT    | returns the decoded user                                    |

### Complaints

| Method | Path                              | Role    | Notes                                                            |
| ------ | --------------------------------- | ------- | ---------------------------------------------------------------- |
| POST   | `/api/complaints`                 | STUDENT | Body: `{ title, description, priority? }`                        |
| GET    | `/api/complaints/my`              | STUDENT | List your own complaints                                         |
| GET    | `/api/complaints`                 | MENTOR  | List all complaints                                              |
| GET    | `/api/complaints/:id`             | any     | Get one complaint                                                |
| PATCH  | `/api/complaints/:id/status`      | MENTOR  | Body: `{ status: "PENDING" \| "IN_PROGRESS" \| "RESOLVED" \| "REJECTED" }` |

### Leaves

| Method | Path                        | Role    | Notes                                                |
| ------ | --------------------------- | ------- | ---------------------------------------------------- |
| POST   | `/api/leaves`               | STUDENT | Body: `{ leaveType, reason, startDate, endDate }`    |
| GET    | `/api/leaves/my`            | STUDENT | List your own leave requests                         |
| GET    | `/api/leaves`               | MENTOR  | List all leave requests                              |
| PATCH  | `/api/leaves/:id/approve`   | MENTOR  | Mark a leave APPROVED                                |
| PATCH  | `/api/leaves/:id/reject`    | MENTOR  | Mark a leave REJECTED                                |

### Health

`GET /api/health` → `200` (no auth)

## Quick smoke test

```bash
# 1. Register a mentor
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"M One","email":"m@test.com","password":"secret123","role":"MENTOR"}'

# 2. Register a student
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"S One","email":"s@test.com","password":"secret123","role":"STUDENT"}'

# 3. Login as student & save token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"s@test.com","password":"secret123"}' | jq -r .data.token)

# 4. File a complaint
curl -X POST http://localhost:4000/api/complaints \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"AC not working","description":"Room 204 AC is broken","priority":"HIGH"}'
```
