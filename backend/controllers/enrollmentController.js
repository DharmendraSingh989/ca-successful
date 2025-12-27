import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import TestSeries from '../models/TestSeries.js';
import Book from '../models/Book.js';
import Cart from '../models/Cart.js';
import { validationResult } from 'express-validator';

// @desc    Get user enrollments
// @route   GET /api/enrollments
// @access  Private
export const getEnrollments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const query = { userId: req.user._id };
    // Only show paid enrollments in user dashboard (unless status filter is provided)
    if (status) {
      query.paymentStatus = status;
    } else {
      query.paymentStatus = 'paid';
    }
    
    const enrollments = await Enrollment.find(query)
      .populate('courseId', 'title price thumbnail')
      .populate('testSeriesId', 'title price thumbnail')
      .populate('bookId', 'title price thumbnail')
      .sort({ enrollmentDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Enrollment.countDocuments(query);

    res.json({
      enrollments,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get enrollment by ID
// @route   GET /api/enrollments/:id
// @access  Private
export const getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('courseId', 'title description price thumbnail content videoUrl resources chapters')
      .populate('testSeriesId', 'title description price thumbnail tests')
      .populate('bookId', 'title description price thumbnail fileUrl');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check authorization
    if (enrollment.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(enrollment);
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create enrollment (initiate purchase)
// @route   POST /api/enrollments
// @access  Private
export const createEnrollment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, testSeriesId, bookId, amount } = req.body;

    // Prevent admin/subadmin from creating enrollments
    if (req.user && (req.user.role === 'admin' || req.user.role === 'subadmin')) {
      return res.status(403).json({ message: 'Admins and sub-admins cannot enroll in courses' });
    }

    let resource;
    let resourceType = null;

    if (courseId) {
      resource = await Course.findById(courseId);
      resourceType = 'course';
    } else if (testSeriesId) {
      resource = await TestSeries.findById(testSeriesId);
      resourceType = 'testseries';
    } else if (bookId) {
      resource = await Book.findById(bookId);
      resourceType = 'book';
    }

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if already enrolled/purchased in THIS SPECIFIC resource only
    // Use sparse index - only check the specific resource type field
    const existingQuery = { userId: req.user._id };
    if (resourceType === 'course') {
      existingQuery.courseId = courseId;
    } else if (resourceType === 'testseries') {
      existingQuery.testSeriesId = testSeriesId;
    } else if (resourceType === 'book') {
      existingQuery.bookId = bookId;
    }

    let existingEnrollment = await Enrollment.findOne(existingQuery);
    if (existingEnrollment && existingEnrollment.paymentStatus === 'paid') {
      // If already enrolled and paid in THIS specific resource, return the existing enrollment (200)
      const populated = await Enrollment.findById(existingEnrollment._id)
        .populate('courseId', 'title price thumbnail')
        .populate('testSeriesId', 'title price thumbnail')
        .populate('bookId', 'title price thumbnail');
      return res.status(200).json(populated);
    }
    
    if (existingEnrollment) {
      // If enrollment exists but not paid, upgrade it when caller requests paid
      if (req.body && (req.body.paymentStatus === 'paid' || req.body.paymentStatus === 'completed')) {
        existingEnrollment.paymentStatus = 'paid';
        existingEnrollment.transactionDate = new Date();
        await existingEnrollment.save();
        // Increment course count if applicable
        if (existingEnrollment.courseId) {
          try {
            await Course.findByIdAndUpdate(existingEnrollment.courseId, { $inc: { enrollmentCount: 1 } });
          } catch (err) {
            console.error('Failed to increment course enrollment count on upgrade:', err);
          }
        }
        const populated = await Enrollment.findById(existingEnrollment._id)
          .populate('courseId', 'title price thumbnail')
          .populate('testSeriesId', 'title price thumbnail')
          .populate('bookId', 'title price thumbnail');
        return res.status(200).json(populated);
      }

      // If enrollment exists but not paid and no upgrade requested, return it
      const populated = await Enrollment.findById(existingEnrollment._id)
        .populate('courseId', 'title price thumbnail')
        .populate('testSeriesId', 'title price thumbnail')
        .populate('bookId', 'title price thumbnail');
      return res.status(200).json(populated);
    }

    const createObj = {
      userId: req.user._id,
      paymentStatus: 'pending',
      amount: amount || resource.price || 0,
    };
    if (resourceType === 'course') createObj.courseId = courseId;
    if (resourceType === 'testseries') createObj.testSeriesId = testSeriesId;
    if (resourceType === 'book') createObj.bookId = bookId;

    // Allow immediate completion when caller includes paymentStatus: 'completed' or 'paid'
    if (req.body && (req.body.paymentStatus === 'completed' || req.body.paymentStatus === 'paid')) {
      createObj.paymentStatus = 'paid';
      createObj.transactionDate = new Date();
    }

    try {
      const enrollment = await Enrollment.create(createObj);

      // If just created as paid, update related counts for course only
      if (enrollment.paymentStatus === 'paid' && enrollment.courseId) {
        try {
          await Course.findByIdAndUpdate(enrollment.courseId, { $inc: { enrollmentCount: 1 } });
        } catch (err) {
          console.error('Failed to increment course enrollment count:', err);
        }
      }

      // Remove the enrolled course from user's cart if it exists
      try {
        if (enrollment.paymentStatus === 'paid' && enrollment.courseId) {
          const cart = await Cart.findOne({ user: enrollment.userId });
          if (cart) {
            cart.items = cart.items.filter(item => item.courseId.toString() !== enrollment.courseId.toString());
            await cart.save();
          }
        }
      } catch (e) {
        console.warn('Failed to remove course from cart:', e.message);
      }

      const populatedEnrollment = await Enrollment.findById(enrollment._id)
        .populate('courseId', 'title price thumbnail')
        .populate('testSeriesId', 'title price thumbnail')
        .populate('bookId', 'title price thumbnail');

      res.status(201).json(populatedEnrollment);
    } catch (createError) {
      // Handle duplicate key (unique index) errors - this means enrollment already exists for THIS specific resource
      if (createError && createError.code === 11000) {
        // Try to find the existing enrollment for this specific resource
        const existing = await Enrollment.findOne(existingQuery)
          .populate('courseId', 'title price thumbnail')
          .populate('testSeriesId', 'title price thumbnail')
          .populate('bookId', 'title price thumbnail');
        
        if (existing && existing.paymentStatus === 'paid') {
          // If enrollment already exists and is paid, return it as success so callers can proceed.
          return res.status(200).json(existing);
        }
        // If exists but not paid, return it as-is (caller can upgrade/payment flow)
        if (existing) {
          return res.status(200).json(existing);
        }
        // As a last resort, return a generic 400
        return res.status(400).json({ message: 'Already purchased/enrolled in this resource' });
      }
      throw createError;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update enrollment (payment success/update progress)
// @route   PUT /api/enrollments/:id
// @access  Private/Admin
export const updateEnrollment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check authorization
    if (enrollment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { paymentStatus, paymentId, progress, isCompleted, completionDate } = req.body;

    if (paymentStatus) {
      enrollment.paymentStatus = paymentStatus;
      if (paymentId) enrollment.paymentId = paymentId;
      if (paymentStatus === 'paid') {
        enrollment.transactionDate = new Date();
        // Increment enrollment count in course
        await Course.findByIdAndUpdate(enrollment.courseId, { $inc: { enrollmentCount: 1 } });
        // Remove the enrolled course from user's cart if it exists
        try {
          if (enrollment.courseId) {
            const cart = await Cart.findOne({ user: enrollment.userId });
            if (cart) {
              cart.items = cart.items.filter(item => item.courseId.toString() !== enrollment.courseId.toString());
              await cart.save();
            }
          }
        } catch (e) {
          console.warn('Failed to remove course from cart:', e.message);
        }
      }
    }

    if (progress !== undefined) enrollment.progress = progress;
    if (isCompleted !== undefined) {
      enrollment.isCompleted = isCompleted;
      if (isCompleted) {
        enrollment.completionDate = completionDate || new Date();
      }
    }

    const updatedEnrollment = await enrollment.save();
    const populatedEnrollment = await Enrollment.findById(updatedEnrollment._id)
      .populate('courseId', 'title price');

    res.json(populatedEnrollment);
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete enrollment (admin only)
// @route   DELETE /api/enrollments/:id
// @access  Private/Admin
export const deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await enrollment.deleteOne();
    res.json({ message: 'Enrollment deleted' });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check if user is enrolled in course
// @route   GET /api/enrollments/check?courseId=...&testSeriesId=...&bookId=...
// @access  Private
export const checkEnrollment = async (req, res) => {
  try {
    const { courseId, testSeriesId, bookId } = req.query;

    const query = { userId: req.user._id };
    if (courseId) query.courseId = courseId;
    if (testSeriesId) query.testSeriesId = testSeriesId;
    if (bookId) query.bookId = bookId;
    
    // Check for any enrollment (paid or pending), but prefer paid
    const enrollment = await Enrollment.findOne(query)
      .populate('courseId', 'title')
      .populate('testSeriesId', 'title')
      .populate('bookId', 'title');
    
    // Return true if enrollment exists and is paid
    const isEnrolled = enrollment && enrollment.paymentStatus === 'paid';

    res.json({ enrolled: isEnrolled, enrollment: isEnrolled ? enrollment : null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
