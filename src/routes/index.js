const express = require('express');
const verifyToken = require('../middleware');
const { authController, resumeController }= require('../controllers/firebase-auth-controller');

const router = express.Router();

router.post('/api/register', authController.registerUser);
router.post('/api/login', authController.loginUser);
router.post('/api/logout', authController.logoutUser);
router.post('/api/reset-password', authController.resetPassword);

router.post('api/update-resume', verifyToken, resumeController.updateUserResume);
router.get('api/get-resume', resumeController.getPublicResumes);

module.exports = router;