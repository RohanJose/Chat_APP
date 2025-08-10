const express = require('express');
const RoomController = require('../controllers/roomController');

const router = express.Router();

// Create a room and find a match
router.post('/create', RoomController.createRoom);

// Get room details
router.get('/:roomName', RoomController.getRoom);

// End a room
router.put('/:roomName/end', RoomController.endRoom);

// Get waiting status
router.get('/waiting/status', RoomController.getWaitingStatus);

// Get online user count
router.get('/online/count', RoomController.getOnlineCount);

module.exports = router;
