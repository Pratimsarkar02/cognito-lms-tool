import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
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
    questionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Question', 
      required: true 
    },
    examAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAttempt',
      required: true
    },
    selectedOptions: [{
      type: Number, // Index of the option (e.g., [0, 2] for options[0] and options[2])
      required: true 
    }],
    isCorrect: { 
      type: Boolean, 
      default: null 
    }, // Populated post-grading
    marksObtained: { 
      type: Number, 
      default: 0 
    },
    timeSpent: {
      type: Number,
      required: true
    }
  });
  
  const responseModel = mongoose.models['Response'] || mongoose.model('Response', responseSchema);
  
  export default responseModel;