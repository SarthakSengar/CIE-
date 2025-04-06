# Facebook-like Post Sharing App

A MERN stack application that implements Facebook-like post sharing functionality with likes.

## Features

- Create text posts
- View posts feed
- Like/unlike posts
- Track likes count and users who liked each post
- Responsive Material-UI design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally on port 27017)
- npm or yarn package manager

## Setup Instructions

1. Clone the repository
2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

4. Start MongoDB locally (make sure MongoDB is running on port 27017)

5. Start the backend server (from the root directory):
   ```bash
   node server.js
   ```

6. Start the frontend development server (in a new terminal):
   ```bash
   cd client
   npm start
   ```

7. Open your browser and navigate to `http://localhost:3000`

## Technologies Used

- Frontend:
  - React
  - Material-UI
  - Axios

- Backend:
  - Node.js
  - Express
  - MongoDB
  - Mongoose
  - CORS

## API Endpoints

- GET `/api/posts` - Get all posts
- POST `/api/posts` - Create a new post
- POST `/api/posts/:id/like` - Like/unlike a post 