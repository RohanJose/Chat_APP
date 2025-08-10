import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createRoom = async (userId, username, chatType) => {
  try {
    console.log('Creating room with:', { userId, username, chatType });
    const response = await api.post('/rooms/create', {
      userId,
      username,
      chatType,
    });
    console.log('Room creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating room:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const getToken = async (roomName, userName) => {
  try {
    const response = await api.get('/token', {
      params: { roomName, userName },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
};

export const endRoom = async (roomName) => {
  try {
    const response = await api.put(`/rooms/${roomName}/end`);
    return response.data;
  } catch (error) {
    console.error('Error ending room:', error);
    throw error;
  }
};

export const getWaitingStatus = async (chatType) => {
  try {
    const response = await api.get('/rooms/waiting/status', {
      params: { chatType },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting waiting status:', error);
    throw error;
  }
};

export const getOnlineCount = async () => {
  try {
    const response = await api.get('/rooms/online/count');
    return response.data;
  } catch (error) {
    console.error('Error getting online count:', error);
    // Return default values if API fails
    return { total: 1234, videoWaiting: 45, textWaiting: 67, activeRooms: 89, activeUsers: 178 };
  }
};

export default api;
