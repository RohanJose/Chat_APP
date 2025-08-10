const { AccessToken } = require('livekit-server-sdk');

class LiveKitService {
  static generateToken(roomName, userName) {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('LiveKit API key and secret are required');
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userName,
      name: userName,
    });

    at.addGrant({ room: roomName, roomJoin: true });

    return at.toJwt();
  }

  static generateRoomName() {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = LiveKitService;
