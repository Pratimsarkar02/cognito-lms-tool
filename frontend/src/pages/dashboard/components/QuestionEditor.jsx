import ReactQuill from 'react-quill';
import { useContext, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { AppContent } from '../../../contexts/AppContext';

const QuestionEditor = ({ examId, initialQuestions }) => {
  const { backendUrl } = useContext(AppContent);
  const [questions, setQuestions] = useState(initialQuestions);
  
  const handleAddQuestion = () => {
    setQuestions([...questions, {
      questionText: '',
      questionType: 'mcq',
      options: [{ text: '', isCorrect: false }],
      marks: 1
    }]);
  };

  const handleSave = async () => {
    await axios.post(`${backendUrl}/api/exams/${examId}/questions/add`, questions);
    // Show success toast
  };

  return (
    <div>
      {questions.map((q, idx) => (
        <div key={idx} className="mb-6 p-4 border rounded">
          <ReactQuill 
            value={q.questionText}
            onChange={(val) => updateQuestion(idx, 'questionText', val)}
          />
          {/* Option management UI */}
        </div>
      ))}
      <button onClick={handleAddQuestion}>Add Question</button>
      <button onClick={handleSave}>Save All</button>
    </div>
  );
};
QuestionEditor.propTypes = {
  examId: PropTypes.string.isRequired,
  initialQuestions: PropTypes.arrayOf(PropTypes.shape({
    questionText: PropTypes.string,
    questionType: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
      text: PropTypes.string,
      isCorrect: PropTypes.bool
    })),
    marks: PropTypes.number
  })).isRequired
};

export default QuestionEditor;