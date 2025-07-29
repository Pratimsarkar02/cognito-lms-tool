import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Calendar, Clock, FileText, Settings, Save, X, AlertCircle } from 'lucide-react';

const CreateExam = () => {
  const navigate = useNavigate();
  const { backendUrl, authState: { userData } } = useContext(AppContent);
  const [isLoading, setIsLoading] = useState(false);

  const [examData, setExamData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: 60, // in minutes
    totalMarks: 0, // Will be auto-calculated based on questions
    passingPercentage: 40,
    maxAttempts: 1,
    isNegativeMarking: false,
    negativeMarkingPercentage: 25,
    isShuffleQuestions: true,
    instructions: ''
  });

  // React Quill modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'color', 'background', 'align'
  ];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExamData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle Quill editor changes
  const handleDescriptionChange = (content) => {
    setExamData(prev => ({
      ...prev,
      description: content
    }));
  };

  const handleInstructionsChange = (content) => {
    setExamData(prev => ({
      ...prev,
      instructions: content
    }));
  };

  // Validate form data
  const validateForm = () => {
    const errors = [];

    if (!examData.title.trim()) {
      errors.push('Exam title is required');
    }

    if (!examData.startTime) {
      errors.push('Start time is required');
    }

    if (!examData.endTime) {
      errors.push('End time is required');
    }

    if (new Date(examData.startTime) >= new Date(examData.endTime)) {
      errors.push('End time must be after start time');
    }

    if (new Date(examData.startTime) <= new Date()) {
      errors.push('Start time must be in the future');
    }

    if (examData.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (examData.passingPercentage < 0 || examData.passingPercentage > 100) {
      errors.push('Passing percentage must be between 0 and 100');
    }

    if (examData.maxAttempts < 0) {
      errors.push('Max attempts cannot be negative');
    }

    if (examData.isNegativeMarking && (examData.negativeMarkingPercentage < 0 || examData.negativeMarkingPercentage > 100)) {
      errors.push('Negative marking percentage must be between 0 and 100');
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setIsLoading(true);
    
    try {
      // Format data according to your backend schema
      const payload = {
        title: examData.title.trim(),
        description: examData.description,
        startTime: examData.startTime,
        endTime: examData.endTime,
        duration: parseInt(examData.duration),
        maxAttempts: parseInt(examData.maxAttempts),
        isShuffleQuestions: examData.isShuffleQuestions,
        isNegativeMarking: examData.isNegativeMarking,
        negativeMarkingPercentage: examData.isNegativeMarking ? parseFloat(examData.negativeMarkingPercentage) : 0,
        passingPercentage: parseFloat(examData.passingPercentage),
        instructions: examData.instructions
      };

      console.log('Sending payload:', payload);

      const response = await axios.post(
        `${backendUrl}/api/exams/`,
        payload,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Exam created successfully!');
        // Navigate to manage questions for the newly created exam
        navigate(`/${userData.role.toLowerCase()}-dashboard/exams/${response.data.exam._id}/questions`);
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error(error.response?.data?.message || 'Failed to create exam');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/${userData.role.toLowerCase()}-dashboard/exams`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-900">Create New Exam</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                form="exam-form"
                disabled={isLoading}
                className="px-4 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isLoading ? 'Creating...' : 'Create Exam'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form id="exam-form" onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Title *
              </label>
              <input
                type="text"
                name="title"
                value={examData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter exam title"
                required
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="border border-gray-300 rounded-lg">
                <ReactQuill
                  theme="snow"
                  value={examData.description}
                  onChange={handleDescriptionChange}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Enter exam description..."
                  style={{ height: '150px', marginBottom: '42px' }}
                />
              </div>
            </div>
          </div>

          {/* Timing Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Timing Configuration</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={examData.startTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={examData.endTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                name="duration"
                value={examData.duration}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Attempts
              </label>
              <input
                type="number"
                name="maxAttempts"
                value={examData.maxAttempts}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">0 = unlimited attempts</p>
            </div>
          </div>

          {/* Grading Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Grading Configuration</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Percentage *
              </label>
              <input
                type="number"
                name="passingPercentage"
                value={examData.passingPercentage}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex items-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">Total marks will be calculated automatically based on questions</span>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isNegativeMarking"
                  name="isNegativeMarking"
                  checked={examData.isNegativeMarking}
                  onChange={handleInputChange}
                  className="h-4 w-4 cursor-pointer text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isNegativeMarking" className="text-sm font-medium cursor-pointer text-gray-700">
                  Enable Negative Marking
                </label>
              </div>
              {examData.isNegativeMarking && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Negative Marking Percentage
                  </label>
                  <input
                    type="number"
                    name="negativeMarkingPercentage"
                    value={examData.negativeMarkingPercentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Percentage of marks to deduct for wrong answers
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Exam Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Exam Settings</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isShuffleQuestions"
                  name="isShuffleQuestions"
                  checked={examData.isShuffleQuestions}
                  onChange={handleInputChange}
                  className="h-4 w-4 cursor-pointer text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isShuffleQuestions" className="text-sm cursor-pointer font-medium text-gray-700">
                  Shuffle Questions
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  Additional settings like &quot;Show Results Immediately&quot; can be configured after adding questions
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Exam Instructions</h3>
            </div>
            <div className="border border-gray-300 rounded-lg">
              <ReactQuill
                theme="snow"
                value={examData.instructions}
                onChange={handleInstructionsChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Enter exam instructions for students..."
                style={{ height: '200px', marginBottom: '42px' }}
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Next Steps:</strong> After creating the exam, you&apos;ll be redirected to add questions. 
                  The exam will be saved as a draft until you publish it.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;
