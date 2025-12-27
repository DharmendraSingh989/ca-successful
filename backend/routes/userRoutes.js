import express from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserProfile,
  sendPhoneOTP,
  verifyPhoneOTP,
  createUser,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
];

// User profile routes (protected, available to all users)
router.put('/profile/update', protect, updateUserProfile);
router.post('/phone/send-otp', protect, sendPhoneOTP);
router.post('/phone/verify-otp', protect, verifyPhoneOTP);

// Admin routes (require admin access)
router.use(protect, admin);

router.post('/', createUser);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUserValidation, updateUser);
router.delete('/:id', deleteUser);

export default router;

