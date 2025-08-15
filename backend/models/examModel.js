// models/examModel.js
import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user-details', 
    required: true 
  }, // Admin/Faculty ID
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  duration: { 
    type: Number, 
    required: true 
  }, // Minutes
  totalMarks: {
    type: Number,
    default: 0
  },
  maxAttempts: { 
    type: Number, 
    default: 1,
    validate: {
      validator: Number.isInteger,
      message: 'Max attempts must be an integer'
    }
  }, // 0 = unlimited
  isShuffleQuestions: { 
    type: Boolean, 
    default: false 
  },
  isNegativeMarking: { 
    type: Boolean, 
    default: false 
  },
  passingPercentage: {
    type: Number,
    default: 40
  }, //40% by default
  negativeMarkingPercentage: { 
    type: Number, 
    default: 0 
  }, // e.g., 25% per wrong answer
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  instructions: { 
    type: String, 
    default: '' 
  }, // HTML allowed
  timezone: {
    type: String,
    default: 'Asia/Kolkata' // Default to IST
  }
}, { timestamps: true });

const examModel = mongoose.models['Exam'] || mongoose.model('Exam', examSchema);

export default examModel;