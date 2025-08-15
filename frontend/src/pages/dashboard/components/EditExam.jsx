import { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Calendar, 
  FileText, 
  Settings, 
  Save, 
  ArrowLeft, 
  AlertCircle,
  Eye,
  Edit3,
  CheckCircle
} from 'lucide-react';

const EditExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, authState: { userData } } = useContext(AppContent);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [originalExam, setOriginalExam] = useState(null);
  
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: 60,
    maxAttempts: 1,
    isShuffleQuestions: true,
    isNegativeMarking: false,
    negativeMarkingPercentage: 25,
    passingPercentage: 40,
    instructions: '',
    status: 'draft'
  });
const [originalFormattedData, setOriginalFormattedData] = useState(null);

// FIXED: Enhanced datetime formatting with timezone handling
const formatDateTimeForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  // Use proper local timezone offset for consistent formatting
  const offset = d.getTimezoneOffset() * 60000;
  const localTime = new Date(d.getTime() - offset);
  return localTime.toISOString().slice(0, 16);
};

const convertUTCToIST = (utcDateTime) => {
  if (!utcDateTime) return '';
  const utcDate = new Date(utcDateTime);
  // JavaScript automatically converts to local timezone for datetime-local
  const offset = utcDate.getTimezoneOffset() * 60000;
  const localTime = new Date(utcDate.getTime() - offset);
  return localTime.toISOString().slice(0, 16);
};

const convertISTToUTC = (istDateTime) => {
  if (!istDateTime) return null;
  const localDate = new Date(istDateTime);
  return localDate.toISOString();
};

  // React Quill configuration
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

  // Load exam data
  useEffect(() => {
    const loadExam = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get(`${backendUrl}/api/exams/${examId}`, {
          withCredentials: true
        });
        
        const exam = data.exam;
        setOriginalExam(exam);
        
        // FIXED: Format dates consistently and store the formatted values
      const formattedStartTime = formatDateTimeForInput(exam.startTime);
      const formattedEndTime = formatDateTimeForInput(exam.endTime);
        
        const formattedExamData = {
          title: exam.title || '',
          description: exam.description || '',
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          duration: exam.duration || 60,
          maxAttempts: exam.maxAttempts || 1,
          isShuffleQuestions: exam.isShuffleQuestions ?? true,
          isNegativeMarking: exam.isNegativeMarking || false,
          negativeMarkingPercentage: exam.negativeMarkingPercentage || 25,
          passingPercentage: exam.passingPercentage || 40,
          instructions: exam.instructions || '',
          status: exam.status || 'draft'
        };
        
      setExamData(formattedExamData);
      
      // FIXED: Store the original formatted data for comparison
      setOriginalFormattedData(formattedExamData);
      
      } catch (error) {
        console.error('Error loading exam:', error);
        toast.error('Failed to load exam details');
        navigate(`/${userData.role.toLowerCase()}-dashboard/exams`);
      } finally {
        setIsLoading(false);
      }
    };

    loadExam();
  }, [examId, backendUrl, navigate, userData.role]);

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

    // Only validate future start time for draft exams
    if (examData.status === 'draft' && new Date(examData.startTime) <= new Date()) {
      errors.push('Start time must be in the future for draft exams');
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

    setSaving(true);
    
    try {
      const payload = {
        title: examData.title.trim(),
        description: examData.description,
        startTime: convertISTToUTC(examData.startTime),
        endTime: convertISTToUTC(examData.endTime),
        duration: parseInt(examData.duration),
        maxAttempts: parseInt(examData.maxAttempts),
        isShuffleQuestions: examData.isShuffleQuestions,
        isNegativeMarking: examData.isNegativeMarking,
        negativeMarkingPercentage: examData.isNegativeMarking ? parseFloat(examData.negativeMarkingPercentage) : 0,
        passingPercentage: parseFloat(examData.passingPercentage),
        instructions: examData.instructions
      };

      const response = await axios.put(
        `${backendUrl}/api/exams/${examId}`,
        payload,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Exam updated successfully!');
        navigate(`/${userData.role.toLowerCase()}-dashboard/exams`);
      }
    } catch (error) {
      console.error('Error updating exam:', error);
      toast.error(error.response?.data?.message || 'Failed to update exam');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/${userData.role.toLowerCase()}-dashboard/exams`);
  };

  // Navigate to question management
  const handleManageQuestions = () => {
    navigate(`/${userData.role.toLowerCase()}-dashboard/exams/${examId}/questions`);
  };

  // Check if exam has been modified
  const hasChanges = () => {
    if (!originalFormattedData) return false;
    
    return (
      examData.title !== (originalFormattedData.title || '') ||
      examData.description !== (originalFormattedData.description || '') ||
      examData.startTime !== convertUTCToIST(originalFormattedData.startTime) ||
      examData.endTime !== convertUTCToIST(originalFormattedData.endTime) ||
      examData.duration !== originalFormattedData.duration ||
      examData.maxAttempts !== originalFormattedData.maxAttempts ||
      examData.isShuffleQuestions !== originalFormattedData.isShuffleQuestions ||
      examData.isNegativeMarking !== originalFormattedData.isNegativeMarking ||
      examData.negativeMarkingPercentage !== originalFormattedData.negativeMarkingPercentage ||
      examData.passingPercentage !== originalFormattedData.passingPercentage ||
      examData.instructions !== (originalFormattedData.instructions || '')
    );
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
              <Edit3 className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Edit Exam</h1>
                <p className="text-sm text-gray-500">
                  {originalExam?.title || 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {originalExam && (
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    originalExam.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {originalExam.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Total Marks: {originalExam.totalMarks || 0}
                  </span>
                </div>
              )}
              
              <button
                onClick={handleManageQuestions}
                className="px-4 py-2 cursor-pointer text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Manage Questions</span>
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Exams</span>
              </button>
              
              <button
                type="submit"
                form="edit-exam-form"
                disabled={isSaving || !hasChanges()}
                className="px-4 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Updating...' : 'Update Exam'}</span>
              </button>
            </div>
          </div>
          
          {hasChanges() && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>You have unsaved changes</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form id="edit-exam-form" onSubmit={handleSubmit} className="p-6 space-y-8">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Current Total Marks: {originalExam?.totalMarks || 0}
                </span>
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isNegativeMarking" className="text-sm font-medium text-gray-700">
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isShuffleQuestions" className="text-sm font-medium text-gray-700">
                  Shuffle Questions
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  Status: {examData.status === 'published' ? 'Published' : 'Draft'}
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

          {/* Summary Box */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <Eye className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Exam Summary:</strong> This exam will be available from{' '}
                  {examData.startTime ? new Date(examData.startTime).toLocaleString('en-GB') : 'Not set'} to{' '}
                  {examData.endTime ? new Date(examData.endTime).toLocaleString('en-GB') : 'Not set'} with a duration of{' '}
                  {examData.duration} minutes.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExam;
