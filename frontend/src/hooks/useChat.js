import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createRoom, endRoom } from '../services/api';

export const useChat = (chatType) => {
  const [userId] = useState(() => uuidv4());
  const [username] = useState(() => {
    const savedUsername = localStorage.getItem('chatUsername');
    return savedUsername || `Anonymous_${Math.random().toString(36).substr(2, 6)}`;
  });
  const [roomName, setRoomName] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [retryCount, setRetryCount] = useState(0);

  const startChat = useCallback(async () => {
    try {
      setError(null);
      setIsWaiting(true);
      setIsConnected(false);
      
      console.log('Starting chat with:', { userId, username, chatType });
      
      const response = await createRoom(userId, username, chatType);
      console.log('Create room response:', response);
      
      if (response.success) {
        if (response.waiting) {
          setIsWaiting(true);
          console.log('Waiting for match...');
          
          // Poll for matches with exponential backoff
          let pollAttempt = 0;
          const maxPollAttempts = 150; // 5 minutes with 2-second intervals
          
          const pollInterval = setInterval(async () => {
            try {
              pollAttempt++;
              console.log('Polling for match... Attempt:', pollAttempt);
              
              if (pollAttempt >= maxPollAttempts) {
                clearInterval(pollInterval);
                setError('No match found after 5 minutes. Please try again.');
                setIsWaiting(false);
                return;
              }

              const matchResponse = await createRoom(userId, username, chatType);
              console.log('Poll response:', matchResponse);
              
              if (matchResponse.success && !matchResponse.waiting) {
                clearInterval(pollInterval);
                setRoomName(matchResponse.roomName);
                setParticipants(matchResponse.participants);
                setIsWaiting(false);
                setIsConnected(true);
                setRetryCount(0);
                console.log('Match found!', matchResponse.roomName);
              }
            } catch (error) {
              console.error('Error polling for match:', error);
              if (pollAttempt >= maxPollAttempts) {
                clearInterval(pollInterval);
                setError('Connection error. Please try again.');
                setIsWaiting(false);
              }
            }
          }, 2000);

          // Cleanup function
          return () => {
            clearInterval(pollInterval);
          };
        } else {
          setRoomName(response.roomName);
          setParticipants(response.participants);
          setIsWaiting(false);
          setIsConnected(true);
          setRetryCount(0);
          console.log('Immediate match found!', response.roomName);
        }
      } else {
        throw new Error(response.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      setIsWaiting(false);
      setIsConnected(false);
      
      // Auto-retry logic
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          console.log('Retrying connection... Attempt:', retryCount + 1);
          startChat();
        }, 2000 * (retryCount + 1));
      }
    }
  }, [userId, username, chatType, retryCount]);

  const endChat = useCallback(async () => {
    try {
      if (roomName) {
        await endRoom(roomName);
      }
      setRoomName(null);
      setIsWaiting(false);
      setIsConnected(false);
      setParticipants([]);
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error('Error ending chat:', error);
    }
  }, [roomName]);

  const nextChat = useCallback(async () => {
    await endChat();
    setRetryCount(0);
    await startChat();
  }, [endChat, startChat]);

  useEffect(() => {
    return () => {
      if (roomName) {
        endRoom(roomName).catch(console.error);
      }
    };
  }, [roomName]);

  return {
    userId,
    username,
    roomName,
    isWaiting,
    isConnected,
    error,
    participants,
    retryCount,
    startChat,
    endChat,
    nextChat,
  };
};
