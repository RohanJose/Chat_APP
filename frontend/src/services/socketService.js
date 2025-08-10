import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentRoomId = null;
    this.currentPartner = null;
    this.isWaiting = false;
    
    // Event handlers
    this.messageHandlers = new Map();
    this.typingHandlers = new Map();
    this.matchHandlers = new Map();
    this.waitingHandlers = new Map();
    this.partnerLeftHandlers = new Map();
    this.errorHandlers = new Map();
    this.deliveryHandlers = new Map();
    
    // WebRTC signaling handlers
    this.webrtcOfferHandlers = new Map();
    this.webrtcAnswerHandlers = new Map();
    this.webrtcIceCandidateHandlers = new Map();
  }

  // Connect to Socket.IO server
  connect() {
    if (this.socket && this.isConnected) {
      console.log('🔌 Socket already connected');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Attempting to connect to Socket.IO server...');
        this.socket = io('http://localhost:5001', {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true,
        });

        this.socket.on('connect', () => {
          console.log('🔌 Socket.IO connected successfully:', this.socket.id);
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket.IO disconnected:', reason);
          this.isConnected = false;
          this.currentRoomId = null;
          this.currentPartner = null;
          this.isWaiting = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket.IO connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        // Handle matched event - user found a partner
        this.socket.on('matched', (data) => {
          console.log('🎯 Matched with partner:', data);
          this.currentRoomId = data.roomId;
          this.currentPartner = data.partner;
          this.isWaiting = false;
          
          this.matchHandlers.forEach(handler => handler(data));
        });

        // Handle waiting event - user is in queue
        this.socket.on('waiting', (data) => {
          console.log('⏳ Waiting for partner:', data.message);
          this.isWaiting = true;
          this.currentRoomId = null;
          this.currentPartner = null;
          
          this.waitingHandlers.forEach(handler => handler(data));
        });

        // Handle incoming messages
        this.socket.on('receive_message', (data) => {
          console.log('📨 Received message:', data);
          this.messageHandlers.forEach(handler => handler(data));
        });

        // Handle message delivery confirmation
        this.socket.on('message_delivered', (data) => {
          console.log('✅ Message delivered:', data);
          this.deliveryHandlers.forEach(handler => handler(data));
        });

        // Handle partner left
        this.socket.on('partner_left', (data) => {
          console.log('👋 Partner left:', data);
          this.currentRoomId = null;
          this.currentPartner = null;
          this.isWaiting = false;
          
          this.partnerLeftHandlers.forEach(handler => handler(data));
        });

        // Handle WebRTC offer
        this.socket.on('webrtc_offer', (data) => {
          console.log('📡 WebRTC offer received:', data);
          this.webrtcOfferHandlers.forEach(handler => handler(data));
        });

        // Handle WebRTC answer
        this.socket.on('webrtc_answer', (data) => {
          console.log('📡 WebRTC answer received:', data);
          this.webrtcAnswerHandlers.forEach(handler => handler(data));
        });

        // Handle WebRTC ICE candidate
        this.socket.on('webrtc_ice_candidate', (data) => {
          console.log('📡 WebRTC ICE candidate received:', data);
          this.webrtcIceCandidateHandlers.forEach(handler => handler(data));
        });

        // Handle errors
        this.socket.on('error', (error) => {
          console.error('❌ Socket.IO error:', error);
          this.errorHandlers.forEach(handler => handler(error));
        });

        // Handle reconnection
        this.socket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
          this.isConnected = true;
        });

        this.socket.on('reconnect_error', (error) => {
          console.error('❌ Socket.IO reconnection error:', error);
        });

      } catch (error) {
        console.error('❌ Error creating socket connection:', error);
        reject(error);
      }
    });
  }

  // Disconnect from Socket.IO server
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting Socket.IO...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoomId = null;
      this.currentPartner = null;
      this.isWaiting = false;
    }
  }

  // Start match - find a chat partner
  startMatch(mode = 'text', username = 'Anonymous') {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    console.log(`🎯 Starting match for mode: ${mode}, username: ${username}`);
    this.socket.emit('start_match', { mode, username });
  }

  // WebRTC Signaling - Send Offer
  sendWebRTCOffer(roomId, offer) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    console.log(`📡 Sending WebRTC offer to room ${roomId}`);
    this.socket.emit('webrtc_offer', { roomId, offer });
  }

  // WebRTC Signaling - Send Answer
  sendWebRTCAnswer(roomId, answer) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    console.log(`📡 Sending WebRTC answer to room ${roomId}`);
    this.socket.emit('webrtc_answer', { roomId, answer });
  }

  // WebRTC Signaling - Send ICE Candidate
  sendWebRTCIceCandidate(roomId, candidate) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    console.log(`📡 Sending WebRTC ICE candidate to room ${roomId}`);
    this.socket.emit('webrtc_ice_candidate', { roomId, candidate });
  }

  // Send a message
  sendMessage(roomId, messageId, text, timestamp) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    if (!roomId || !messageId || !text || !timestamp) {
      console.error('❌ Invalid message payload');
      return;
    }

    console.log(`💬 Sending message to room ${roomId}: "${text}"`);
    this.socket.emit('send_message', { roomId, messageId, text, timestamp });
  }

  // Next - find a new partner
  next(roomId) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    console.log(`🔄 Requesting next partner in room ${roomId}`);
    this.socket.emit('next', { roomId });
  }

  // Leave room
  leave(roomId) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    console.log(`👋 Leaving room ${roomId}`);
    this.socket.emit('leave', { roomId });
  }

  // Event handler registration methods
  onMatched(handler) {
    const id = Date.now() + Math.random();
    this.matchHandlers.set(id, handler);
    console.log('🎯 Match handler added:', id);
    return () => {
      this.matchHandlers.delete(id);
      console.log('🎯 Match handler removed:', id);
    };
  }

  onWaiting(handler) {
    const id = Date.now() + Math.random();
    this.waitingHandlers.set(id, handler);
    console.log('⏳ Waiting handler added:', id);
    return () => {
      this.waitingHandlers.delete(id);
      console.log('⏳ Waiting handler removed:', id);
    };
  }

  onMessage(handler) {
    const id = Date.now() + Math.random();
    this.messageHandlers.set(id, handler);
    console.log('📨 Message handler added:', id);
    return () => {
      this.messageHandlers.delete(id);
      console.log('📨 Message handler removed:', id);
    };
  }

  onMessageDelivered(handler) {
    const id = Date.now() + Math.random();
    this.deliveryHandlers.set(id, handler);
    console.log('✅ Delivery handler added:', id);
    return () => {
      this.deliveryHandlers.delete(id);
      console.log('✅ Delivery handler removed:', id);
    };
  }

  onPartnerLeft(handler) {
    const id = Date.now() + Math.random();
    this.partnerLeftHandlers.set(id, handler);
    console.log('👋 Partner left handler added:', id);
    return () => {
      this.partnerLeftHandlers.delete(id);
      console.log('👋 Partner left handler removed:', id);
    };
  }

  onError(handler) {
    const id = Date.now() + Math.random();
    this.errorHandlers.set(id, handler);
    console.log('❌ Error handler added:', id);
    return () => {
      this.errorHandlers.delete(id);
      console.log('❌ Error handler removed:', id);
    };
  }

  // WebRTC signaling event handlers
  onWebRTCOffer(handler) {
    const id = Date.now() + Math.random();
    this.webrtcOfferHandlers.set(id, handler);
    console.log('📡 WebRTC offer handler added:', id);
    return () => {
      this.webrtcOfferHandlers.delete(id);
      console.log('📡 WebRTC offer handler removed:', id);
    };
  }

  onWebRTCAnswer(handler) {
    const id = Date.now() + Math.random();
    this.webrtcAnswerHandlers.set(id, handler);
    console.log('📡 WebRTC answer handler added:', id);
    return () => {
      this.webrtcAnswerHandlers.delete(id);
      console.log('📡 WebRTC answer handler removed:', id);
    };
  }

  onWebRTCIceCandidate(handler) {
    const id = Date.now() + Math.random();
    this.webrtcIceCandidateHandlers.set(id, handler);
    console.log('📡 WebRTC ICE candidate handler added:', id);
    return () => {
      this.webrtcIceCandidateHandlers.delete(id);
      console.log('📡 WebRTC ICE candidate handler removed:', id);
    };
  }

  // Get current state
  getState() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      currentRoomId: this.currentRoomId,
      currentPartner: this.currentPartner,
      isWaiting: this.isWaiting,
      transport: this.socket?.io?.engine?.transport?.name
    };
  }

  // Test connection
  testConnection() {
    if (!this.socket || !this.isConnected) {
      console.log('❌ Socket not connected for testing');
      return false;
    }
    
    console.log('✅ Socket connection test passed');
    console.log('Socket ID:', this.socket.id);
    console.log('Transport:', this.socket.io?.engine?.transport?.name);
    console.log('Current state:', this.getState());
    return true;
  }

  // Clear all handlers
  clearHandlers() {
    this.messageHandlers.clear();
    this.typingHandlers.clear();
    this.matchHandlers.clear();
    this.waitingHandlers.clear();
    this.partnerLeftHandlers.clear();
    this.errorHandlers.clear();
    this.deliveryHandlers.clear();
    this.webrtcOfferHandlers.clear();
    this.webrtcAnswerHandlers.clear();
    this.webrtcIceCandidateHandlers.clear();
    console.log('🧹 All handlers cleared');
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
