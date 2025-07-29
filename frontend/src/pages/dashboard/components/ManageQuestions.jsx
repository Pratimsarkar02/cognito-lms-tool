import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import QuestionEditor from './QuestionEditor';
import axios from 'axios';

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { backendUrl } = useContext(AppContent);
  const { examId } = useParams();

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching questions for management...'); // Debug log
        
        // Use the new management-specific endpoint
        const { data } = await axios.get(
          `${backendUrl}/api/questions/${examId}/questions/manage`, 
          { withCredentials: true }
        );
        
        console.log('ManageQuestions: Fetched questions:', data.questions); // Debug log
        
        setQuestions(data.questions || []);
      } catch (error) {
        console.error('ManageQuestions: Error fetching questions:', error);
        const errorMessage = error.response?.data?.message || 'Failed to fetch questions';
        setError(errorMessage);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (examId) {
      fetchQuestions();
    }
  }, [examId, backendUrl]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error Loading Questions</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <QuestionEditor examId={examId} initialQuestions={questions} />
    </div>
  );
};

export default ManageQuestions;
