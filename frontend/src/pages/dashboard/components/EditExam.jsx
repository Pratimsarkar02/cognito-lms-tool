import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import DateTimePicker from 'react-datetime-picker';
import ReactQuill from 'react-quill';
import { toast } from 'react-toastify';

const EditExam = () => {
  const {authState:{userData}, backendUrl} = useContext(AppContent);
  const [exam, setExam] = useState(null);
  const navigate = useNavigate();
  const { examId } = useParams();
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: 60,
    totalMarks: 100,
    isNegativeMarking: false
  });
  
  useEffect(() => {
    const fetchExam = async () => {
      const { data } = await axios.get(`${backendUrl}/api/exams/${examId}`);
      setExam(data.exam);
    };
    fetchExam();
  }, [examId]);

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const payload = {
          ...examData,
          creatorId: userData._id,
          status: 'draft'
        };
  
        const { data } = await axios.post(`${backendUrl}/api/exams`, payload, {
          withCredentials: true
        });
        
        toast.success('Exam created successfully!');
        navigate(`/faculty-dashboard/exams/${data.exam._id}/questions`);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Exam creation failed');
      }
    };

  return (
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Create New Exam</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Exam Title</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded"
              value={examData.title}
              onChange={(e) => setExamData({ ...examData, title: e.target.value })}
            />
          </div>
  
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <ReactQuill
              theme="snow"
              value={examData.description}
              onChange={(value) => setExamData({ ...examData, description: value })}
              className="h-40 mb-8"
            />
          </div>
            <div>
              <div className="flex gap-6"><div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <DateTimePicker
                    onChange={(value) => setExamData({ ...examData, startTime: value })}
                    value={examData.startTime}
                    className="w-full"
                    format="y-MM-dd h:mm a"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <DateTimePicker
                    onChange={(value) => setExamData({ ...examData, endTime: value })}
                    value={examData.endTime}
                    className="w-full"
                    format="y-MM-dd h:mm a"
                    required
                  />
                </div>
              </div>
            </div>
          {/* Add more form fields for exam details */}
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">
            Create Exam
          </button>
        </form>
      </div>
    );
};

export default EditExam;