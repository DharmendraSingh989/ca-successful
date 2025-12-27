import express from 'express';
import { body } from 'express-validator';
import { protect, subadmin, admin } from '../middleware/auth.js';
import {
  getTestSeries,
  getTestSeriesById,
  getTestSeriesByCategory,
  createTestSeries,
  updateTestSeries,
  deleteTestSeries,
  publishTestSeries,
} from '../controllers/testSeriesController.js';

const router = express.Router();

const createTestSeriesValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('totalTests').isNumeric().withMessage('Total tests must be a number'),
];

const updateTestSeriesValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  body('totalTests').optional().isNumeric().withMessage('Total tests must be a number'),
];

// Public
router.get('/', getTestSeries);
router.get('/category/:categoryId', getTestSeriesByCategory);
router.get('/:id', getTestSeriesById);

// Protected - subadmin/admin
router.post('/', protect, subadmin, createTestSeriesValidation, createTestSeries);
router.put('/:id', protect, subadmin, updateTestSeriesValidation, updateTestSeries);
router.delete('/:id', protect, subadmin, deleteTestSeries);

// Admin only
router.put('/:id/publish', protect, admin, publishTestSeries);

export default router;
