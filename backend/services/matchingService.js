const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Room = require('../models/Room');

// In-memory storage for waiting users
const waitingUsers = {
  video: [],
  text: []
};

class MatchingService {
  // Add user to waiting list
  static async addToWaitingList(userId, username, chatType) {
    const user = {
      userId,
      username,
      chatType,
      joinedAt: new Date()
    };

    // Remove user from any existing waiting lists
    this.removeFromWaitingList(userId);

    // Add to appropriate waiting list
    waitingUsers[chatType].push(user);

    // Update user in database
    await User.findOneAndUpdate(
      { userId },
      { 
        userId,
        username,
        chatType,
        isWaiting: true,
        lastActive: new Date()
      },
      { upsert: true, new: true }
    );

    return user;
  }

  // Remove user from waiting list
  static removeFromWaitingList(userId) {
    waitingUsers.video = waitingUsers.video.filter(user => user.userId !== userId);
    waitingUsers.text = waitingUsers.text.filter(user => user.userId !== userId);
  }

  // Find a match for a user
  static async findMatch(userId, chatType) {
    const waitingList = waitingUsers[chatType];
    
    // Remove the current user from the list
    const currentUser = waitingList.find(user => user.userId === userId);
    if (!currentUser) return null;

    // Find another user in the waiting list
    const otherUser = waitingList.find(user => user.userId !== userId);
    if (!otherUser) return null;

    // Remove both users from waiting list
    this.removeFromWaitingList(userId);
    this.removeFromWaitingList(otherUser.userId);

    // Create a room
    const roomName = `room_${uuidv4()}`;
    const room = new Room({
      roomName,
      chatType,
      participants: [
        { userId: currentUser.userId, username: currentUser.username },
        { userId: otherUser.userId, username: otherUser.username }
      ],
      status: 'active'
    });

    await room.save();

    // Update users in database
    await User.updateMany(
      { userId: { $in: [userId, otherUser.userId] } },
      { 
        isWaiting: false,
        currentRoom: roomName,
        lastActive: new Date()
      }
    );

    return {
      roomName,
      participants: [currentUser, otherUser]
    };
  }

  // Get waiting list status
  static getWaitingStatus(chatType) {
    return {
      count: waitingUsers[chatType].length,
      users: waitingUsers[chatType]
    };
  }

  // Clean up inactive users (called periodically)
  static async cleanupInactiveUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Clean up in-memory waiting lists
    waitingUsers.video = waitingUsers.video.filter(user => 
      user.joinedAt > fiveMinutesAgo
    );
    waitingUsers.text = waitingUsers.text.filter(user => 
      user.joinedAt > fiveMinutesAgo
    );

    // Clean up database
    await User.updateMany(
      { lastActive: { $lt: fiveMinutesAgo }, isWaiting: true },
      { isWaiting: false, currentRoom: null }
    );
  }
}

module.exports = MatchingService;
