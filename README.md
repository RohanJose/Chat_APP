# Stranger Chat

A professional Omegle-like application for random stranger connections with video and text chat capabilities.

## Features

- **Video Chat**: Real-time video calls with strangers using LiveKit
- **Text Chat**: Instant messaging with strangers
- **Random Matching**: Smart matching system for video and text chat
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Real-time Communication**: Powered by LiveKit for seamless video and text chat
- **User Management**: MongoDB integration for user tracking and chat history

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- LiveKit React SDK
- React Router DOM
- Axios

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- LiveKit Server SDK
- CORS

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- LiveKit account and credentials

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stranger-chat
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Environment Configuration

#### Backend Environment

Create a `backend/config.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stranger-chat
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
NODE_ENV=development
```

#### Frontend Environment

Create a `frontend/.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
```

### 4. LiveKit Setup

1. Sign up for a LiveKit account at [livekit.io](https://livekit.io)
2. Create a new project
3. Get your API key and secret from the dashboard
4. Update the environment variables with your LiveKit credentials

### 5. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Create a database named `stranger-chat`

#### Option B: MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in the backend config

### 6. Running the Application

#### Development Mode

```bash
# From the root directory
npm run dev
```

This will start both frontend (port 3000) and backend (port 5000) concurrently.

#### Manual Start

```bash
# Start backend
cd backend
npm run dev

# Start frontend (in a new terminal)
cd frontend
npm start
```

## Usage

1. **Landing Page**: Choose between "Start Video Chat" or "Start Text Chat"
2. **Video Chat**: 
   - Grant camera and microphone permissions
   - Wait for a match
   - Use video controls for mute/unmute, camera on/off
   - Click "Next" to find a new stranger
   - Click "End" to leave the chat

3. **Text Chat**:
   - Wait for a match
   - Start typing messages
   - Press Enter or click "Send" to send messages
   - Click "Next" to find a new stranger
   - Click "End" to leave the chat

## API Endpoints

### Rooms
- `POST /api/rooms/create` - Create a room and find a match
- `GET /api/rooms/:roomName` - Get room details
- `PUT /api/rooms/:roomName/end` - End a room
- `GET /api/rooms/waiting/status` - Get waiting status

### Tokens
- `GET /api/token?room={roomName}&user={userName}` - Generate LiveKit token

## Project Structure

```
stranger-chat/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── config.env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub.
