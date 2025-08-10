const LiveKitService = require('../services/livekitService');

class TokenController {
  // Generate a LiveKit token for a user
  static async generateToken(req, res) {
    try {
      const { roomName, userName } = req.query;

      if (!roomName || !userName) {
        return res.status(400).json({ error: 'Missing roomName or userName' });
      }

      const token = LiveKitService.generateToken(roomName, userName);

      res.json({
        success: true,
        token,
        roomName,
        userName
      });
    } catch (error) {
      console.error('Error generating token:', error);
      res.status(500).json({ error: 'Failed to generate token' });
    }
  }
}

module.exports = TokenController;
