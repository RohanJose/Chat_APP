import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';
import VideoChatInterface from '../components/VideoChatInterface';

const VideoChatPage = () => {
  const navigate = useNavigate();
  
  // Get username and userId from localStorage or generate stable ones
  const username = useMemo(() => {
    const savedUsername = localStorage.getItem('chatUsername');
    return savedUsername || `Anonymous_${Math.random().toString(36).substr(2, 6)}`;
  }, []);
  
  const userId = useMemo(() => `user_${Math.random().toString(36).substr(2, 9)}`, []);

  const [hasStarted, setHasStarted] = useState(false);
  const [connectedUser, setConnectedUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [error, setError] = useState(null);

  // Connect to Socket.IO and start match
  useEffect(() => {
    const connectAndStartMatch = async () => {
      try {
        console.log('🔌 Connecting to Socket.IO for video chat...');
        await socketService.connect();
        setIsConnected(true);
        
        console.log('🎯 Starting video match...');
        socketService.startMatch('video', username || 'Anonymous');
        
      } catch (error) {
        console.error('❌ Failed to connect:', error);
        setError('Failed to connect to video chat server');
      }
    };

    if (username && !hasStarted) {
      setHasStarted(true);
      connectAndStartMatch();
    }

    return () => {
      console.log('🧹 Cleaning up VideoChatPage...');
      socketService.clearHandlers();
      socketService.disconnect();
    };
  }, [username, hasStarted]);

  // Register Socket.IO event handlers
  useEffect(() => {
    if (!isConnected) return;

    // Register handlers only once
    const unregisterMatched = socketService.onMatched((data) => {
      console.log('🎯 Video matched with partner:', data);
      setConnectedUser(data.partner);
      setCurrentRoomId(data.roomId);
      setError(null);
    });

    const unregisterWaiting = socketService.onWaiting((data) => {
      console.log('⏳ Waiting for video partner:', data.message);
      setConnectedUser(null);
      setCurrentRoomId(null);
      setError(null);
    });

    const unregisterPartnerLeft = socketService.onPartnerLeft((data) => {
      console.log('👋 Video partner left:', data);
      setConnectedUser(null);
      setCurrentRoomId(null);
      
      // Automatically start looking for new partner
      setTimeout(() => {
        if (isConnected) {
          socketService.startMatch('video', username || 'Anonymous');
        }
      }, 2000);
    });

    socketService.onError((error) => {
      console.error('❌ Video chat error:', error);
      setError(error.message || 'Video chat error occurred');
    });

    // Cleanup function
    return () => {
      unregisterMatched();
      unregisterWaiting();
      unregisterPartnerLeft();
    };
  }, [isConnected, username]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="card max-w-md w-full text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-red-200 dark:border-red-700">
          <div className="p-8">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Oops! Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setHasStarted(false);
                  setTimeout(() => setHasStarted(true), 100);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-xl transition-colors"
              >
                🏠 Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the video chat interface even while waiting
  if (hasStarted && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 dark:from-gray-900 dark:to-black">
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-blue-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Video Chat</h1>
                <div className="text-sm text-gray-500 dark:text-gray-400">ID: {userId}</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-300"></div>
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Looking for a match...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Interface with Waiting State */}
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 dark:from-gray-900 dark:to-black">
            <div className="text-center text-white">
              <div className="relative mb-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
                <div className="absolute inset-0 rounded-full border-2 border-white opacity-20 animate-ping"></div>
              </div>
              <h2 className="text-3xl font-bold mb-4">Looking for someone to chat with...</h2>
              <p className="text-blue-200 text-lg">Please wait while we find a match for you! 🤔</p>
              <div className="mt-8 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 dark:from-gray-900 dark:to-black">
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-blue-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Video Chat</h1>
                <div className="text-sm text-gray-500 dark:text-gray-400">ID: {userId}</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900 px-4 py-2 rounded-full">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 dark:border-green-300"></div>
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium">Connecting...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Interface with Connecting State */}
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 dark:from-gray-900 dark:to-black">
            <div className="text-center text-white">
              <div className="relative mb-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
                <div className="absolute inset-0 rounded-full border-2 border-white opacity-20 animate-ping"></div>
              </div>
              <h2 className="text-3xl font-bold mb-4">Connecting to chat...</h2>
              <p className="text-blue-200 text-lg">Setting up your video chat connection! 🎥</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 dark:from-gray-900 dark:to-black">
      <VideoChatInterface
        onNext={() => {
          if (currentRoomId) {
            socketService.next(currentRoomId);
            setConnectedUser(null);
            setCurrentRoomId(null);
          }
        }}
        onEnd={() => {
          if (currentRoomId) {
            socketService.leave(currentRoomId);
          }
          socketService.disconnect();
          navigate('/');
        }}
        onBack={() => {
          if (currentRoomId) {
            socketService.leave(currentRoomId);
          }
          socketService.disconnect();
          navigate('/');
        }}
        connectedUser={connectedUser}
        userId={userId}
        roomId={currentRoomId}
      />
    </div>
  );
};

export default VideoChatPage;
