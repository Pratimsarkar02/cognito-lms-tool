import Joi from 'joi';

const questionSchema = Joi.object({
  questionText: Joi.string().required().trim(),
  questionType: Joi.string().valid('mcq', 'msq').required(),
  options: Joi.array().items(
    Joi.object({
      text: Joi.string().required().trim(),
      isCorrect: Joi.boolean().required()
    })
  ).min(2).required(),
  marks: Joi.number().min(0).required(),
  explanation: Joi.string().allow('', null).optional() // FIX: Allow empty explanation
}).custom((value, helpers) => {
  // Validate MCQ has exactly one correct answer
  if (value.questionType === 'mcq' &&
    value.options.filter(o => o.isCorrect).length !== 1) {
    return helpers.error('mcq.singleCorrect');
  }
  
  // Validate MSQ has at least one correct answer
  if (value.questionType === 'msq' &&
    value.options.filter(o => o.isCorrect).length === 0) {
    return helpers.error('msq.atLeastOne');
  }

  return value;
});

export const validateQuestions = (req, res, next) => {
  try {
    const questions = Array.isArray(req.body) ? req.body : [req.body];
    
    const validationErrors = [];
    
    questions.forEach((question, index) => {
      const { error } = questionSchema.validate(question, { 
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
        messages: {
          'mcq.singleCorrect': 'MCQ questions must have exactly one correct answer',
          'msq.atLeastOne': 'MSQ questions must have at least one correct answer'
        }
      });
      
      if (error) {
        error.details.forEach(detail => {
          validationErrors.push(`Question ${index + 1}: ${detail.message}`);
        });
      }
    });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: validationErrors
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Validation error: ' + error.message
    });
  }
};
