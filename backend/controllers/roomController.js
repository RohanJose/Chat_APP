const MatchingService = require('../services/matchingService');
const Room = require('../models/Room');
const User = require('../models/User');

class RoomController {
  // Create a room and find a match
  static async createRoom(req, res) {
    try {
      console.log('📝 Creating room with data:', req.body);
      const { userId, username, chatType } = req.body;

      if (!userId || !username || !chatType) {
        console.log('❌ Missing required fields:', { userId, username, chatType });
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!['video', 'text'].includes(chatType)) {
        console.log('❌ Invalid chat type:', chatType);
        return res.status(400).json({ error: 'Invalid chat type' });
      }

      console.log('👤 Adding user to waiting list:', { userId, username, chatType });
      // Add user to waiting list
      await MatchingService.addToWaitingList(userId, username, chatType);

      console.log('🔍 Looking for a match...');
      // Try to find a match
      const match = await MatchingService.findMatch(userId, chatType);

      if (match) {
        console.log('✅ Match found!', match.roomName);
        // Found a match, return room details
        return res.json({
          success: true,
          roomName: match.roomName,
          participants: match.participants,
          message: 'Match found!'
        });
      } else {
        console.log('⏳ No match found, user is waiting');
        // No match found, user is waiting
        const waitingStatus = MatchingService.getWaitingStatus(chatType);
        return res.json({
          success: true,
          waiting: true,
          roomName: null,
          participants: [],
          waitingCount: waitingStatus.count,
          message: 'Waiting for a match...'
        });
      }
    } catch (error) {
      console.error('❌ Error creating room:', error);
      res.status(500).json({ error: 'Failed to create room', message: error.message });
    }
  }

  // Get room details
  static async getRoom(req, res) {
    try {
      const { roomName } = req.params;
      console.log('🔍 Getting room details:', roomName);
      
      const room = await Room.findOne({ roomName });

      if (!room) {
        console.log('❌ Room not found:', roomName);
        return res.status(404).json({ error: 'Room not found' });
      }

      console.log('✅ Room found:', room);
      res.json({ room });
    } catch (error) {
      console.error('❌ Error getting room:', error);
      res.status(500).json({ error: 'Failed to get room' });
    }
  }

  // End a room
  static async endRoom(req, res) {
    try {
      const { roomName } = req.params;
      console.log('🛑 Ending room:', roomName);
      
      const room = await Room.findOneAndUpdate(
        { roomName },
        { status: 'ended', endedAt: new Date() },
        { new: true }
      );

      if (!room) {
        console.log('❌ Room not found for ending:', roomName);
        return res.status(404).json({ error: 'Room not found' });
      }

      // Update users to remove them from the room
      await User.updateMany(
        { currentRoom: roomName },
        { currentRoom: null, isWaiting: false }
      );

      console.log('✅ Room ended successfully:', roomName);
      res.json({ success: true, message: 'Room ended successfully' });
    } catch (error) {
      console.error('❌ Error ending room:', error);
      res.status(500).json({ error: 'Failed to end room' });
    }
  }

  // Get waiting status
  static async getWaitingStatus(req, res) {
    try {
      const { chatType } = req.query;
      console.log('📊 Getting waiting status for:', chatType);
      
      const status = MatchingService.getWaitingStatus(chatType);
      res.json(status);
    } catch (error) {
      console.error('❌ Error getting waiting status:', error);
      res.status(500).json({ error: 'Failed to get waiting status' });
    }
  }

  // Get online user count
  static async getOnlineCount(req, res) {
    try {
      console.log('📊 Getting online user count');
      
      const videoWaiting = MatchingService.getWaitingStatus('video');
      const textWaiting = MatchingService.getWaitingStatus('text');
      
      // Get active rooms count
      const activeRooms = await Room.countDocuments({ status: 'active' });
      const activeUsers = activeRooms * 2; // Each room has 2 users
      
      const totalOnline = videoWaiting.count + textWaiting.count + activeUsers;
      
      res.json({
        total: totalOnline,
        videoWaiting: videoWaiting.count,
        textWaiting: textWaiting.count,
        activeRooms: activeRooms,
        activeUsers: activeUsers
      });
    } catch (error) {
      console.error('❌ Error getting online count:', error);
      res.status(500).json({ error: 'Failed to get online count' });
    }
  }
}

module.exports = RoomController;
