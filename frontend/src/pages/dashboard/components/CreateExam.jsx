import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import DateTimePicker from 'react-datetime-picker';
import 'react-datetime-picker/dist/DateTimePicker.css';

const CreateExam = () => {
  const { authState: { userData }, backendUrl } = useContext(AppContent);
  const navigate = useNavigate();
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000), // Default 1 hour later,
    duration: 60,
    totalMarks: 100,
    isNegativeMarking: false
  });

  // Complete form validation
  const validateForm = () => {
    const errors = [];
    if (!examData.title.trim()) errors.push('Title is required');
    if (examData.startTime >= examData.endTime) errors.push('End time must be after start time');
    if (examData.duration < 1) errors.push('Duration must be at least 1 minute');
    return errors;
  };

  // Complete submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      return errors.forEach(err => toast.error(err));
    }

    try {
      const { data } = await axios.post(`${backendUrl}/api/exams`, {
        ...examData,
        createdBy: userData._id,
        status: 'draft'
      }, { withCredentials: true });

      navigate(`/faculty-dashboard/exams/${data.exam._id}/questions`);
      toast.success('Exam created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Exam creation failed');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create New Exam</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Exam Title</label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            value={examData.title}
            onChange={(e) => setExamData({ ...examData, title: e.target.value })}
          />
        </div>

        <div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Description
  </label>
  <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
    <ReactQuill
      theme="snow"
      value={examData.description}
      onChange={(value) => setExamData({ ...examData, description: value })}
      className="min-h-[10rem]" // Tailwind: min height of 10rem (160px)
    />
  </div>
</div>


        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Start Time</label>
            <DateTimePicker
              onChange={(date) => setExamData({ ...examData, startTime: date })}
              value={examData.startTime}
              className="w-full"
              minDate={new Date()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Time</label>
            <DateTimePicker
              onChange={(date) => setExamData({ ...examData, endTime: date })}
              value={examData.endTime}
              className="w-full"
              minDate={examData.startTime}
            />
          </div>
        </div>

        <div className="mt-6">
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={handleSubmit}
        >
          Create Exam
        </button>
      </div>
      </form>
    </div>
  );
};

export default CreateExam;