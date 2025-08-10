const express = require('express');
const TokenController = require('../controllers/tokenController');

const router = express.Router();

// Generate a LiveKit token
router.get('/', TokenController.generateToken);

module.exports = router;
