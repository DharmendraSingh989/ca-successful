import mongoose from 'mongoose';

const testSeriesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a test series title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please provide a category'],
    },
    instructor: {
      type: String,
      trim: true,
    },
    thumbnail: {
      type: String, // URL from Appwrite
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    totalTests: {
      type: Number,
      required: true,
      min: [1, 'Must have at least 1 test'],
    },
    tests: [
      {
        title: String,
        duration: Number, // in minutes
        totalQuestions: Number,
        pdfUrl: String, // PDF URL from Appwrite
        solutionUrl: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publishStatus: {
      type: String,
      enum: ['draft', 'pending', 'published', 'rejected'],
      default: 'draft',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const TestSeries = mongoose.model('TestSeries', testSeriesSchema);

export default TestSeries;
