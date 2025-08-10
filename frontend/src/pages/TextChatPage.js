import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';

const TextChatPage = ({ onNext, onEnd, onBack, connectedUser, userId: propUserId, username: propUsername }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [currentPartner, setCurrentPartner] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [error, setError] = useState(null);
  
  const messageEndRef = useRef(null);
  const messageHandlersRef = useRef(new Set());

  // Get username and userId from props or generate stable ones
  const username = useMemo(() => 
    propUsername || localStorage.getItem('chatUsername') || `Anonymous_${Math.random().toString(36).substr(2, 6)}`,
    [propUsername]
  );
  
  const userId = useMemo(() => 
    propUserId || `user_${Math.random().toString(36).substr(2, 9)}`,
    [propUserId]
  );

  // Default handlers if not provided
  const handleNext = onNext || (() => {
    if (currentRoomId) {
      console.log('🔄 Requesting next partner...');
      socketService.next(currentRoomId);
      
      // Clear current state
      setCurrentPartner(null);
      setCurrentRoomId(null);
      setIsWaiting(true);
      
      // Clear messages and add system message
      setMessages([{
        id: Date.now() + Math.random(),
        type: 'system',
        message: 'Looking for a new partner...',
        timestamp: new Date().toISOString()
      }]);
    }
  });

  const handleEnd = onEnd || (() => {
    if (currentRoomId) {
      socketService.leave(currentRoomId);
    }
    socketService.disconnect();
    navigate('/');
  });

  const handleBack = onBack || (() => {
    if (currentRoomId) {
      socketService.leave(currentRoomId);
    }
    socketService.disconnect();
    navigate('/');
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to Socket.IO and start match
  useEffect(() => {
    const connectAndStartMatch = async () => {
      try {
        console.log('🔌 Connecting to Socket.IO...');
        await socketService.connect();
        setIsConnected(true);
        
        console.log('🎯 Starting match...');
        socketService.startMatch('text', username || 'Anonymous');
        
      } catch (error) {
        console.error('❌ Failed to connect:', error);
        setError('Failed to connect to chat server');
      }
    };

    if (username) {
      connectAndStartMatch();
    }

    return () => {
      console.log('🧹 Cleaning up TextChatPage...');
      socketService.clearHandlers();
      socketService.disconnect();
    };
  }, [username]);

  // Register Socket.IO event handlers
  useEffect(() => {
    if (!isConnected) return;

    // Register handlers only once
    if (!messageHandlersRef.current.has('matched')) {
      const unregisterMatched = socketService.onMatched((data) => {
        console.log('🎯 Matched with partner:', data);
        setCurrentPartner(data.partner);
        setCurrentRoomId(data.roomId);
        setIsWaiting(false);
        setError(null);
        
        // Clear previous messages and add system message
        setMessages([{
          id: Date.now() + Math.random(),
          type: 'system',
          message: `You are now chatting with ${data.partner.username}!`,
          timestamp: new Date().toISOString()
        }]);
      });
      messageHandlersRef.current.add('matched');
    }

    if (!messageHandlersRef.current.has('waiting')) {
      const unregisterWaiting = socketService.onWaiting((data) => {
        console.log('⏳ Waiting for partner:', data.message);
        setIsWaiting(true);
        setCurrentPartner(null);
        setCurrentRoomId(null);
        setError(null);
        
        // Clear messages when waiting
        setMessages([{
          id: Date.now() + Math.random(),
          type: 'system',
          message: 'Looking for a chat partner...',
          timestamp: new Date().toISOString()
        }]);
      });
      messageHandlersRef.current.add('waiting');
    }

    if (!messageHandlersRef.current.has('message')) {
      const unregisterMessage = socketService.onMessage((data) => {
        console.log('📨 Received message:', data);
        
        // Only add messages from partner (not our own)
        if (data.senderSocketId !== socketService.socket?.id) {
          setMessages(prev => [...prev, {
            id: data.messageId,
            type: 'received',
            message: data.text,
            sender: data.senderUsername,
            timestamp: data.timestamp
          }]);
        }
      });
      messageHandlersRef.current.add('message');
    }

    if (!messageHandlersRef.current.has('delivery')) {
      const unregisterDelivery = socketService.onMessageDelivered((data) => {
        console.log('✅ Message delivered:', data);
        // Could update message status here if needed
      });
      messageHandlersRef.current.add('delivery');
    }

    if (!messageHandlersRef.current.has('partnerLeft')) {
      const unregisterPartnerLeft = socketService.onPartnerLeft((data) => {
        console.log('👋 Partner left:', data);
        setCurrentPartner(null);
        setCurrentRoomId(null);
        setIsWaiting(false);
        
        // Add system message
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          type: 'system',
          message: 'Your partner has left the chat. Looking for a new partner...',
          timestamp: new Date().toISOString()
        }]);
        
        // Automatically start looking for new partner
        setTimeout(() => {
          if (isConnected) {
            socketService.startMatch('text', username || 'Anonymous');
          }
        }, 2000);
      });
      messageHandlersRef.current.add('partnerLeft');
    }

    if (!messageHandlersRef.current.has('error')) {
      const unregisterError = socketService.onError((error) => {
        console.error('❌ Socket error:', error);
        setError(error.message || 'An error occurred');
      });
      messageHandlersRef.current.add('error');
    }

  }, [isConnected, username]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentRoomId || !currentPartner) {
      console.log('❌ Cannot send message - no room or partner');
      return;
    }

    const messageId = Date.now() + Math.random();
    const timestamp = new Date().toISOString();
    const messageText = newMessage.trim();

    // Add message to local state immediately (optimistic update)
    setMessages(prev => [...prev, {
      id: messageId,
      type: 'sent',
      message: messageText,
      timestamp: timestamp
    }]);

    // Send message via Socket.IO
    socketService.sendMessage(currentRoomId, messageId, messageText, timestamp);

    // Clear input
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };





  // Show error state
  if (error) {
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-white shadow-lg border-b border-red-200 px-6 py-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Text Chat</h1>
                <div className="text-sm text-gray-500">Your ID: {userId}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-red-900 to-pink-900">
          <div className="text-center text-white max-w-md mx-auto p-8">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
            <p className="text-red-200 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                🔄 Retry
              </button>
              <button
                onClick={handleBack}
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

  // Show waiting state
  if (isWaiting) {
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-blue-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Text Chat</h1>
                <div className="text-sm text-gray-500 dark:text-gray-400">Your ID: {userId}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-xl transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
          <div className="text-center text-white max-w-md mx-auto p-8">
            <div className="text-6xl mb-6">⏳</div>
            <h2 className="text-2xl font-bold mb-4">Looking for a Partner</h2>
            <p className="text-blue-200 mb-6">Please wait while we find someone to chat with...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm text-blue-300">This usually takes a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-blue-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Text Chat</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Your ID: {userId}</span>
                {currentPartner && (
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Chatting with: {currentPartner.username}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {currentPartner && (
              <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 font-medium">Connected</span>
              </div>
            )}

            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Next
            </button>
            <button
              onClick={handleEnd}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-xl transition-colors"
            >
              End
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-gradient-to-br from-blue-900 to-indigo-900 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.type === 'sent'
                    ? 'bg-blue-500 text-white'
                    : msg.type === 'received'
                    ? 'bg-white text-gray-800'
                    : 'bg-yellow-500 text-white text-center mx-auto'
                }`}
              >
                {msg.type === 'system' ? (
                  <span className="text-sm">{msg.message}</span>
                ) : (
                  <div>
                    {msg.type === 'received' && (
                      <div className="text-xs text-gray-600 mb-1">{msg.sender}</div>
                    )}
                    <div className="text-sm">{msg.message}</div>
                    <div className={`text-xs mt-1 ${
                      msg.type === 'sent' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-blue-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentPartner ? "Type your message..." : "Waiting for partner..."}
              disabled={!currentPartner}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !currentPartner}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextChatPage;
