import mongoose from "mongoose";

const examLogSchema = new mongoose.Schema({
  examId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Exam', 
    required: true 
  },
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user-details', 
    required: true 
  },
  attemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAttempt',
    required: true
  },
  events: [{
    type: {
      type: String,
      enum: ['start', 'answer', 'complete'],
      required: true
    },
    questionId: mongoose.Schema.Types.ObjectId,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  warnings: [String],
  duration: Number // Total active duration in seconds
}, { timestamps: true });

examLogSchema.pre('save', function(next) {
  if (this.isModified('events')) {
    const startEvent = this.events.find(e => e.type === 'start');
    const completeEvent = this.events.find(e => e.type === 'complete');
    
    if (startEvent && completeEvent) {
      this.duration = Math.round(
        (completeEvent.timestamp - startEvent.timestamp) / 1000
      );
    }
  }
  next();
});

  const examLogModel = mongoose.models['ExamLog'] || mongoose.model('ExamLog', examLogSchema);
  export default examLogModel;