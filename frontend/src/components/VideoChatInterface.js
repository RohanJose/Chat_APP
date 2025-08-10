import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';

const VideoChatInterface = ({ onNext, onEnd, onBack, connectedUser, userId, roomId }) => {
  const navigate = useNavigate();
  
  // State management
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('prompting');
  const [isInitiator, setIsInitiator] = useState(false);
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  };

  // Initialize camera and microphone
  const initializeMedia = useCallback(async () => {
    try {
      console.log('🎥 Requesting camera and microphone permissions...');
      setCameraPermission('prompting');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('✅ Camera and microphone access granted');
      setLocalStream(stream);
      setCameraPermission('granted');
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Mute local audio to prevent echo
        localVideoRef.current.muted = true;
      }
      
      return stream;
    } catch (err) {
      console.error('❌ Failed to get camera/microphone access:', err);
      setCameraPermission('denied');
      setError(`Camera access denied: ${err.message}`);
      throw err;
    }
  }, []);

  // Create and configure peer connection
  const createPeerConnection = useCallback(() => {
    try {
      console.log('🔗 Creating peer connection...');
      const pc = new RTCPeerConnection(rtcConfig);
      
      // Add local stream tracks to peer connection
      if (localStream) {
        localStream.getTracks().forEach(track => {
          console.log('📡 Adding track to peer connection:', track.kind);
          pc.addTrack(track, localStream);
        });
      }
      
      // Handle incoming tracks
      pc.ontrack = (event) => {
        console.log('📡 Received remote track:', event.track.kind);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }
      };
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && roomId) {
          console.log('📡 Sending ICE candidate');
          socketService.sendWebRTCIceCandidate(roomId, event.candidate);
        }
      };
      
      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('🔗 Connection state changed:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
          console.log('✅ WebRTC connection established!');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setIsConnected(false);
          setIsConnecting(false);
          console.log('❌ WebRTC connection failed or disconnected');
        }
      };
      
      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', pc.iceConnectionState);
      };
      
      peerConnectionRef.current = pc;
      return pc;
    } catch (err) {
      console.error('❌ Failed to create peer connection:', err);
      setError(`Failed to create peer connection: ${err.message}`);
      throw err;
    }
  }, [localStream, roomId]);

  // Create and send offer
  const createOffer = useCallback(async () => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection not initialized');
      }
      
      console.log('📝 Creating offer...');
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      console.log('📡 Sending offer to partner');
      socketService.sendWebRTCOffer(roomId, offer);
      
    } catch (err) {
      console.error('❌ Failed to create offer:', err);
      setError(`Failed to create offer: ${err.message}`);
    }
  }, [roomId]);

  // Handle incoming offer
  const handleOffer = useCallback(async (offer) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection not initialized');
      }
      
      console.log('📝 Received offer, setting remote description...');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      console.log('📝 Creating answer...');
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      console.log('📡 Sending answer to partner');
      socketService.sendWebRTCAnswer(roomId, answer);
      
    } catch (err) {
      console.error('❌ Failed to handle offer:', err);
      setError(`Failed to handle offer: ${err.message}`);
    }
  }, [roomId]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (answer) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection not initialized');
      }
      
      console.log('📝 Received answer, setting remote description...');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      
    } catch (err) {
      console.error('❌ Failed to handle answer:', err);
      setError(`Failed to handle answer: ${err.message}`);
    }
  }, []);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (candidate) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error('Peer connection not initialized');
      }
      
      console.log('🧊 Adding ICE candidate...');
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      
    } catch (err) {
      console.error('❌ Failed to add ICE candidate:', err);
      setError(`Failed to add ICE candidate: ${err.message}`);
    }
  }, []);

  // Start WebRTC connection when matched
  useEffect(() => {
    if (connectedUser && roomId && localStream && !isConnecting) {
      console.log('🎯 Starting WebRTC connection...');
      setIsConnecting(true);
      
      try {
        const pc = createPeerConnection();
        
        // Register WebRTC event handlers
        const unregisterOffer = socketService.onWebRTCOffer(handleOffer);
        const unregisterAnswer = socketService.onWebRTCAnswer(handleAnswer);
        const unregisterIceCandidate = socketService.onWebRTCIceCandidate(handleIceCandidate);
        
        // Determine if this user should be the initiator (first to join)
        // For simplicity, we'll make the user with the smaller socket ID the initiator
        const shouldBeInitiator = !isInitiator;
        setIsInitiator(shouldBeInitiator);
        
        if (shouldBeInitiator) {
          // Create and send offer (initiator)
          setTimeout(() => createOffer(), 1000); // Small delay to ensure both sides are ready
        }
        
        // Cleanup function
        return () => {
          unregisterOffer();
          unregisterAnswer();
          unregisterIceCandidate();
        };
      } catch (err) {
        console.error('❌ Failed to start WebRTC connection:', err);
        setIsConnecting(false);
      }
    }
  }, [connectedUser, roomId, localStream, isConnecting, createPeerConnection, handleOffer, handleAnswer, handleIceCandidate, createOffer, isInitiator]);

  // Initialize media when component mounts
  useEffect(() => {
    initializeMedia();
    
    // Cleanup function
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [initializeMedia]);

  // Handle next button
  const handleNext = () => {
    console.log('🔄 Moving to next partner...');
    
    // Clean up current connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
    setIsInitiator(false);
    
    // Call parent handler
    if (onNext) {
      onNext();
    }
  };

  // Handle end button
  const handleEnd = () => {
    console.log('🏁 Ending video chat...');
    
    // Clean up
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Call parent handler
    if (onEnd) {
      onEnd();
    }
  };

  // Handle back button
  const handleBack = () => {
    console.log('⬅️ Going back...');
    
    // Clean up
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Call parent handler
    if (onBack) {
      onBack();
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-blue-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Video Chat</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Your ID: {userId}</span>
                  {connectedUser && (
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Connected to: {connectedUser.username}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-6">😢</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setError(null);
                  initializeMedia();
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                🔄 Try Again
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

  // Show camera permission error
  if (cameraPermission === 'denied') {
    return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-blue-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Video Chat</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Your ID: {userId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Permission Error */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-6">📹</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Camera Permission Required</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please allow camera and microphone access to start video chatting.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setError(null);
                  initializeMedia();
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                🔄 Try Again
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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-900 to-indigo-900 dark:from-gray-900 dark:to-black">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-blue-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Video Chat</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Your ID: {userId}</span>
                {connectedUser && (
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Connected to: {connectedUser.username}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            {isConnecting && (
              <div className="flex items-center space-x-2 bg-yellow-100 dark:bg-yellow-900 px-4 py-2 rounded-full">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 dark:border-yellow-300"></div>
                <span className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Connecting...</span>
              </div>
            )}
            {isConnected && (
              <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 dark:text-green-300 font-medium">Connected</span>
              </div>
            )}
            
            {/* Action Buttons */}
            {connectedUser && (
              <button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Next
              </button>
            )}
            <button
              onClick={handleEnd}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-xl transition-colors"
            >
              End
            </button>
          </div>
        </div>
      </div>

      {/* Video Interface */}
      <div className="flex-1 relative">
        {/* Main Remote Video */}
        <div className="h-full w-full">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center text-white">
                {isConnecting ? (
                  <>
                    <div className="relative mb-8">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-white opacity-20 animate-ping"></div>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Connecting to partner...</h2>
                    <p className="text-blue-200 text-lg">Establishing video connection</p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-6">👋</div>
                    <h2 className="text-3xl font-bold mb-4">Waiting for partner...</h2>
                    <p className="text-blue-200 text-lg">Your video will appear here once connected</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local Video Preview (Bottom Right) */}
        {localStream && (
          <div className="absolute bottom-4 right-4 z-10 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-lg border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Connection Status Overlay */}
        {isConnecting && (
          <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Establishing connection...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoChatInterface;
