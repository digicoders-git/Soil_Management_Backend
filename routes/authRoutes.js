import express from 'express';
import { register, login, getMe, logout, updateProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.post('/logout', logout);
router.put('/profile', authMiddleware, updateProfile);


export default router;