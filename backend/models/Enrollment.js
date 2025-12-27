import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    },
      testSeriesId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestSeries',
      },
      bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentId: {
      type: String, // Stripe or payment provider transaction ID
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    completionDate: Date,
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    certificate: {
      issued: { type: Boolean, default: false },
      url: String, // Certificate PDF URL from Appwrite
      issuedDate: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraints: one enrollment per user per specific resource (course/testseries/book)
// Use partialFilterExpression to ensure uniqueness only when the resource field exists and is not null.
enrollmentSchema.index(
  { userId: 1, courseId: 1 },
  { unique: true, partialFilterExpression: { courseId: { $exists: true, $ne: null } } }
);
enrollmentSchema.index(
  { userId: 1, testSeriesId: 1 },
  { unique: true, partialFilterExpression: { testSeriesId: { $exists: true, $ne: null } } }
);
enrollmentSchema.index(
  { userId: 1, bookId: 1 },
  { unique: true, partialFilterExpression: { bookId: { $exists: true, $ne: null } } }
);

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
