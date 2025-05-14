import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import QuestionEditor from './QuestionEditor';
import axios from 'axios';

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const { backendUrl } = useContext(AppContent);
  const { examId } = useParams();

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await axios.get(`${backendUrl}/api/exams/${examId}/questions`);
      setQuestions(data.questions);
    };
    fetchQuestions();
  }, [examId]);

  return (
    <div className="p-6">
      <QuestionEditor examId={examId} initialQuestions={questions} />
    </div>
  );
};

export default ManageQuestions;