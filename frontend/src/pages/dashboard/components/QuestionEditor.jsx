import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Eye, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Minimize2,
  Maximize2
} from 'lucide-react';

const QuestionEditor = ({ initialQuestions = null }) => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, authState: { userData } } = useContext(AppContent);
  
  const [examDetails, setExamDetails] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [collapsedQuestions, setCollapsedQuestions] = useState(new Set());

  // Initialize with one empty question
  const emptyQuestion = {
    questionText: '',
    questionType: 'mcq',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    marks: 1,
    explanation: ''
  };

  // React Quill configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  // Load exam details and existing questions
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load exam details
        const examRes = await axios.get(`${backendUrl}/api/exams/${examId}`, {
          withCredentials: true
        });
        setExamDetails(examRes.data.exam);

        // Use initialQuestions if provided, otherwise fetch from API
        if (initialQuestions && initialQuestions.length > 0) {
          console.log('Using provided initial questions:', initialQuestions);
          const questionsWithExplanation = initialQuestions.map(q => ({
            ...q,
            explanation: q.explanation || ''
          }));
          setQuestions(questionsWithExplanation);
        } else {
          // Try to load existing questions from API
          try {
            const questionsRes = await axios.get(`${backendUrl}/api/questions/${examId}/questions/manage`, {
              withCredentials: true
            });
            if (questionsRes.data.questions?.length > 0) {
              console.log('Fetched questions from API:', questionsRes.data.questions);
              const questionsWithExplanation = questionsRes.data.questions.map(q => ({
                ...q,
                explanation: q.explanation || ''
              }));
              setQuestions(questionsWithExplanation);
            } else {
              console.log('No existing questions found, starting with empty question');
              setQuestions([{ ...emptyQuestion }]);
            }
          } catch (error) {
            console.log('Error fetching questions, starting with empty question', error);
            setQuestions([{ ...emptyQuestion }]);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load exam details');
        navigate(`/${userData.role.toLowerCase()}-dashboard/exams`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [examId, backendUrl, navigate, userData.role, initialQuestions]);

  // Toggle question collapse/expand
  const toggleQuestionCollapse = (index) => {
    const newCollapsed = new Set(collapsedQuestions);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedQuestions(newCollapsed);
  };

  // Collapse all questions except the last one
  const collapseAllExceptLast = () => {
    const newCollapsed = new Set();
    for (let i = 0; i < questions.length - 1; i++) {
      newCollapsed.add(i);
    }
    setCollapsedQuestions(newCollapsed);
  };

  // Expand all questions
  const expandAll = () => {
    setCollapsedQuestions(new Set());
  };

  // Add new question
  const addQuestion = () => {
    setQuestions([...questions, { ...emptyQuestion }]);
    collapseAllExceptLast();
  };

  // Remove question (handles both existing and new questions)
  const removeQuestion = async (index) => {
    if (questions.length === 1) {
      toast.warning('At least one question is required');
      return;
    }

    const questionToRemove = questions[index];
    
    // If it's an existing question (has _id), delete from backend
    if (questionToRemove._id) {
      try {
        await axios.delete(
          `${backendUrl}/api/questions/question/${questionToRemove._id}/delete`,
          { withCredentials: true }
        );
        toast.success('Question deleted successfully');
      } catch (error) {
        console.error('Error deleting question:', error);
        toast.error('Failed to delete question');
        return; // Don't remove from UI if backend deletion failed
      }
    }

    // Remove from UI
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    
    // Update collapsed set indices
    const newCollapsed = new Set();
    collapsedQuestions.forEach(collapsedIndex => {
      if (collapsedIndex < index) {
        newCollapsed.add(collapsedIndex);
      } else if (collapsedIndex > index) {
        newCollapsed.add(collapsedIndex - 1);
      }
    });
    setCollapsedQuestions(newCollapsed);
  };

  // Update question field
  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  // Add option to question
  const addOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push({ text: '', isCorrect: false });
    setQuestions(newQuestions);
  };

  // Remove option from question
  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length > 2) {
      newQuestions[questionIndex].options.splice(optionIndex, 1);
      setQuestions(newQuestions);
    } else {
      toast.warning('At least two options are required');
    }
  };

  // Update option
  const updateOption = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex][field] = value;
    
    // For MCQ, ensure only one correct answer
    if (field === 'isCorrect' && value && newQuestions[questionIndex].questionType === 'mcq') {
      newQuestions[questionIndex].options.forEach((opt, idx) => {
        if (idx !== optionIndex) opt.isCorrect = false;
      });
    }
    
    setQuestions(newQuestions);
  };

  // Validate questions
  const validateQuestions = () => {
    const errors = [];
    
    questions.forEach((question, qIndex) => {
      const questionText = question.questionText?.replace(/<[^>]*>/g, '').trim();
      if (!questionText || questionText === '') {
        errors.push(`Question ${qIndex + 1}: Question text is required`);
      }
      
      if (question.marks <= 0) {
        errors.push(`Question ${qIndex + 1}: Marks must be greater than 0`);
      }
      
      const validOptions = question.options.filter(opt => opt.text && opt.text.trim());
      if (validOptions.length < 2) {
        errors.push(`Question ${qIndex + 1}: At least 2 options with text are required`);
      }
      
      const correctOptions = question.options.filter(opt => opt.isCorrect && opt.text && opt.text.trim());
      if (correctOptions.length === 0) {
        errors.push(`Question ${qIndex + 1}: At least one correct option is required`);
      }
      
      if (question.questionType === 'mcq' && correctOptions.length > 1) {
        errors.push(`Question ${qIndex + 1}: MCQ can have only one correct answer`);
      }
    });
    
    return errors;
  };

  // Save questions (handles both new and existing questions)
  const saveQuestions = async () => {
    const errors = validateQuestions();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setSaving(true);
    try {
      // Separate new questions (without _id) from existing questions (with _id)
      const newQuestions = questions.filter(q => !q._id);
      const existingQuestions = questions.filter(q => q._id);

      // Handle new questions
      if (newQuestions.length > 0) {
        const newQuestionsData = newQuestions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options.filter(opt => opt.text && opt.text.trim()),
          marks: q.marks,
          explanation: q.explanation || ''
        }));

        await axios.post(
          `${backendUrl}/api/questions/${examId}/questions/add`,
          newQuestionsData,
          { withCredentials: true }
        );
      }

      // Handle existing questions updates
      for (const question of existingQuestions) {
        const questionData = {
          questionText: question.questionText,
          questionType: question.questionType,
          options: question.options.filter(opt => opt.text && opt.text.trim()),
          marks: question.marks,
          explanation: question.explanation || ''
        };

        await axios.put(
          `${backendUrl}/api/questions/question/${question._id}/update`,
          questionData,
          { withCredentials: true }
        );
      }

      toast.success('Questions saved successfully!');
      navigate(`/${userData.role.toLowerCase()}-dashboard/exams`);
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error(error.response?.data?.message || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  // Calculate total marks
  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  // Get question summary for collapsed view
  const getQuestionSummary = (question, index) => {
    const questionText = question.questionText?.replace(/<[^>]*>/g, '').substring(0, 50) || 'Untitled Question';
    const optionCount = question.options.filter(opt => opt.text && opt.text.trim()).length;
    const correctCount = question.options.filter(opt => opt.isCorrect).length;
    
    return {
      text: questionText + (questionText.length > 50 ? '...' : ''),
      type: question.questionType.toUpperCase(),
      marks: question.marks,
      options: optionCount,
      correct: correctCount
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Manage Questions
                </h1>
                <p className="text-sm text-gray-500">
                  {examDetails?.title || 'Loading...'}
                </p>
                {questions.length > 1 && (
                  <p className="text-xs text-blue-600">
                    {questions.filter(q => q._id).length} existing • {questions.filter(q => !q._id).length} new
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                Total Questions: <span className="font-semibold">{questions.length}</span> | 
                Total Marks: <span className="font-semibold">{totalMarks}</span>
              </div>
              <button
                onClick={expandAll}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center space-x-1"
              >
                <Maximize2 className="h-3 w-3" />
                <span>Expand All</span>
              </button>
              <button
                onClick={collapseAllExceptLast}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center space-x-1"
              >
                <Minimize2 className="h-3 w-3" />
                <span>Collapse All</span>
              </button>
              <button
                onClick={() => navigate(`/${userData.role.toLowerCase()}-dashboard/exams`)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Exams</span>
              </button>
              <button
                onClick={saveQuestions}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Questions'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="p-6">
          <div className="space-y-4">
            {questions.map((question, qIndex) => {
              const isCollapsed = collapsedQuestions.has(qIndex);
              const summary = getQuestionSummary(question, qIndex);
              const isExisting = !!question._id;
              
              return (
                <div key={qIndex} className={`border border-gray-200 rounded-lg transition-all duration-200 ${
                  isCollapsed ? 'shadow-sm' : 'shadow-md'
                } ${isExisting ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  {/* Question Header - Always Visible */}
                  <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleQuestionCollapse(qIndex)}>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-medium text-gray-900">Question {qIndex + 1}</span>
                        {isExisting && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Existing
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          question.questionType === 'mcq' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {question.questionType.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {question.marks} marks
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isCollapsed && (
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mr-4">
                          <span>{summary.options} options</span>
                          <span>{summary.correct} correct</span>
                          <span className="max-w-xs truncate">{summary.text}</span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeQuestion(qIndex);
                        }}
                        disabled={questions.length === 1}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {isCollapsed ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronUp className="h-5 w-5 text-gray-400" />}
                    </div>
                  </div>

                  {/* Question Content - Collapsible */}
                  {!isCollapsed && (
                    <div className="px-6 pb-6 border-t border-gray-200">
                      {/* Question Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question Type
                          </label>
                          <select
                            value={question.questionType}
                            onChange={(e) => updateQuestion(qIndex, 'questionType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="mcq">Multiple Choice (Single Answer)</option>
                            <option value="msq">Multiple Select (Multiple Answers)</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Marks
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={question.marks}
                            onChange={(e) => updateQuestion(qIndex, 'marks', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex items-end">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            {question.questionType === 'mcq' ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                                <span>Single correct answer</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                                <span>Multiple correct answers</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Text
                        </label>
                        <ReactQuill
                          theme="snow"
                          value={question.questionText}
                          onChange={(content) => updateQuestion(qIndex, 'questionText', content)}
                          modules={quillModules}
                          placeholder="Enter your question here..."
                          style={{ height: '120px', marginBottom: '42px' }}
                        />
                      </div>

                      {/* Options */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Answer Options
                          </label>
                          <button
                            onClick={() => addOption(qIndex)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Option</span>
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-3">
                              <input
                                type={question.questionType === 'mcq' ? 'radio' : 'checkbox'}
                                name={`question-${qIndex}-correct`}
                                checked={option.isCorrect}
                                onChange={(e) => updateOption(qIndex, optIndex, 'isCorrect', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <input
                                type="text"
                                value={option.text}
                                onChange={(e) => updateOption(qIndex, optIndex, 'text', e.target.value)}
                                placeholder={`Option ${optIndex + 1}`}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <button
                                onClick={() => removeOption(qIndex, optIndex)}
                                disabled={question.options.length <= 2}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Explanation (Optional) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Explanation (Optional)
                        </label>
                        <ReactQuill
                          theme="snow"
                          value={question.explanation || ''}
                          onChange={(content) => updateQuestion(qIndex, 'explanation', content || '')}
                          modules={quillModules}
                          placeholder="Add explanation for the correct answer..."
                          style={{ height: '100px', marginBottom: '42px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Question Button */}
          <div className="mt-6 text-center">
            <button
              onClick={addQuestion}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Add Another Question</span>
            </button>
          </div>

          {/* Summary */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Exam Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Total Questions:</span>
                <span className="ml-2 text-blue-700">{questions.length}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Existing Questions:</span>
                <span className="ml-2 text-blue-700">{questions.filter(q => q._id).length}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Total Marks:</span>
                <span className="ml-2 text-blue-700">{totalMarks}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Exam Duration:</span>
                <span className="ml-2 text-blue-700">{examDetails?.duration || 0} minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
