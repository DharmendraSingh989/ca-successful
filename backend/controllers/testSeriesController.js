import TestSeries from '../models/TestSeries.js';
import { validationResult } from 'express-validator';

// @desc    Get all published test series
// @route   GET /api/testseries
// @access  Public
export const getTestSeries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, search } = req.query;

    const query = { isActive: true, publishStatus: 'published' };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const testSeries = await TestSeries.find(query)
      .populate('category', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TestSeries.countDocuments(query);

    res.json({
      testSeries,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get test series by category
// @route   GET /api/testseries/category/:categoryId
// @access  Public
export const getTestSeriesByCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { categoryId } = req.params;

    const query = { 
      isActive: true, 
      publishStatus: 'published',
      category: categoryId 
    };

    const testSeries = await TestSeries.find(query)
      .populate('category', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TestSeries.countDocuments(query);

    res.json({
      testSeries,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get test series by ID
// @route   GET /api/testseries/:id
// @access  Public
export const getTestSeriesById = async (req, res) => {
  try {
    const testSeries = await TestSeries.findById(req.params.id)
      .populate('category', 'name')
      .populate('createdBy', 'name email');

    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found' });
    }

    if (!testSeries.isActive || testSeries.publishStatus !== 'published') {
      if (!req.user || (req.user.role !== 'admin' && req.user._id.toString() !== testSeries.createdBy._id.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(testSeries);
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Test series not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create test series (subadmin/admin)
// @route   POST /api/testseries
// @access  Private
export const createTestSeries = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, instructor, thumbnail, price, totalTests, tests } = req.body;

    const testSeries = await TestSeries.create({
      title,
      description,
      category,
      instructor,
      thumbnail,
      price,
      totalTests,
      tests: tests || [],
      createdBy: req.user._id,
      publishStatus: 'draft',
    });

    const populatedTestSeries = await TestSeries.findById(testSeries._id)
      .populate('category', 'name')
      .populate('createdBy', 'name');

    res.status(201).json(populatedTestSeries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update test series (creator or admin)
// @route   PUT /api/testseries/:id
// @access  Private
export const updateTestSeries = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let testSeries = await TestSeries.findById(req.params.id);
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found' });
    }

    if (testSeries.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, category, instructor, thumbnail, price, totalTests, tests } = req.body;

    if (title) testSeries.title = title;
    if (description) testSeries.description = description;
    if (category) testSeries.category = category;
    if (instructor) testSeries.instructor = instructor;
    if (thumbnail !== undefined) testSeries.thumbnail = thumbnail;
    if (price !== undefined) testSeries.price = price;
    if (totalTests !== undefined) testSeries.totalTests = totalTests;
    if (tests) testSeries.tests = tests;

    const updatedTestSeries = await testSeries.save();
    const populatedTestSeries = await TestSeries.findById(updatedTestSeries._id)
      .populate('category', 'name')
      .populate('createdBy', 'name');

    res.json(populatedTestSeries);
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Test series not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete test series (creator or admin)
// @route   DELETE /api/testseries/:id
// @access  Private
export const deleteTestSeries = async (req, res) => {
  try {
    const testSeries = await TestSeries.findById(req.params.id);
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found' });
    }

    if (testSeries.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await testSeries.deleteOne();
    res.json({ message: 'Test series deleted' });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Test series not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Publish test series (admin approval)
// @route   PUT /api/testseries/:id/publish
// @access  Private/Admin
export const publishTestSeries = async (req, res) => {
  try {
    const testSeries = await TestSeries.findById(req.params.id);
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found' });
    }

    const { action, notes } = req.body;

    if (action === 'approve') {
      testSeries.publishStatus = 'published';
    } else if (action === 'reject') {
      testSeries.publishStatus = 'rejected';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const updatedTestSeries = await testSeries.save();
    const populatedTestSeries = await TestSeries.findById(updatedTestSeries._id)
      .populate('category', 'name')
      .populate('createdBy', 'name');

    res.json(populatedTestSeries);
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Test series not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
