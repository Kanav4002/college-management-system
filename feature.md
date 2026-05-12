````md
# UniSphere Chat Messaging System Prompt

## Overview
Build a modern real-time chat messaging system for the UniSphere university management platform using the MERN stack (MongoDB, Express.js, React.js, Node.js) with Socket.IO for live communication.

---

# Features Required

## 1. Real-Time Messaging
- Instant sending and receiving of messages using Socket.IO
- Typing indicators ("User is typing...")
- Online/offline user status
- Message timestamps
- Auto-scroll to latest message

---

## 2. User Roles
### Students
- Can chat with mentors

### Mentors
- Can chat with students and admins

### Admins
- Can communicate with everyone

- Implement role-based chat permissions

---

## 3. Chat Features
- One-to-one private chats
- Group chats for departments/classes
- Send text messages
- Emoji support
- File attachment support
- Message read/unread status
- Delete message option
- Edit sent messages
- Search messages and users

---

## 4. UI/UX Design
- Responsive modern UI using React and Tailwind CSS
- Sidebar with recent conversations
- Chat bubbles with different alignment for sender/receiver
- Dark/light theme support
- Notification badge for unread messages
- Clean dashboard integration with UniSphere theme

---

## 5. Backend Features
- JWT authentication for secure access
- MongoDB schemas for users, chats, and messages
- REST APIs for fetching chats/messages
- Socket event handling for real-time updates
- Store chat history in database
- Proper error handling and validation

---

## 6. Additional Features
- Push notifications
- Voice message support
- Image preview before sending
- User profile popup inside chat
- Pinned messages
- Chat filtering by role or course

---

# Suggested Folder Structure

## Frontend
```bash
src/
│
├── components/
│   └── chat/
│
├── pages/
│   └── Chat/
│
├── context/
│   └── socketContext.js
│
├── services/
│   └── chatService.js
````

## Backend

```bash
backend/
│
├── routes/
│   └── chatRoutes.js
│
├── controllers/
│   └── chatController.js
│
├── models/
│   ├── Chat.js
│   └── Message.js
│
├── socket/
│   └── socketServer.js
```

---

# Recommended Tech Stack

## Frontend

* React.js
* Tailwind CSS
* Axios
* Socket.IO Client

## Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication

## Database

* MongoDB Atlas

---

# Expected Output

Generate:

* Frontend UI components
* Backend APIs
* Socket.IO integration
* MongoDB models
* Authentication middleware
* Responsive chat interface
* Clean and scalable code architecture

---

# Goal

Create a scalable, secure, and modern university communication system that allows seamless interaction between students, mentors, and admins inside the UniSphere platform.

```
```
