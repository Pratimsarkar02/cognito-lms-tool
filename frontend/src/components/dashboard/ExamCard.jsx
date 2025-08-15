// components/dashboard/ExamCard.jsx
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ExamCard = ({ exam, userRole, onStart }) => (
  <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
    <h3 className="font-semibold text-lg mb-2">{exam.title}</h3>
    <div className="text-sm text-gray-600 space-y-1">
      <p>Start: {new Date(exam.startTime).toLocaleDateString('en-GB')}</p>
      <p>Duration: {exam.duration} mins</p>
      <p>Status: {exam.status}</p>
    </div>

    {userRole === 'Student' && (
      <Link
        to={`/student-dashboard/exams/${exam._id}`}
        className="mt-3 inline-block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700"
      >
        View Details
      </Link>
    )}
  </div>
);

ExamCard.propTypes = {
  exam: PropTypes.object.isRequired,
  userRole: PropTypes.string.isRequired,
  onStart: PropTypes.func
};

export default ExamCard;