const express = require('express');
const otpController = require('../controller/otpController');
// const authController = require('../controller/authController');

const router = express.Router();

// These routes probably don't need the full auth protection
// router.use(authController.protect);

router.post('/verify', otpController.verifyOtp);
router.post('/resend', otpController.resendOtp);

module.exports = router;
