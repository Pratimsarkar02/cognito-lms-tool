import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    unique: true
  },
  totalStudentsAttempted: Number,
  passPercentage: Number,
  scoreDistribution: [{
    range: String,
    count: Number
  }],
  questionStats: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    correctAttempts: Number,
    totalAttempts: Number
  }],
  participation: {
    hourly: [{
      hour: Date,
      count: Number
    }],
    daily: [{
      date: Date,
      count: Number
    }]
  },
  lastUpdated: Date
}, { timestamps: true });
  
  const analyticsModel = mongoose.models['Analytics'] || mongoose.model('Analytics', analyticsSchema);
  export default analyticsModel;