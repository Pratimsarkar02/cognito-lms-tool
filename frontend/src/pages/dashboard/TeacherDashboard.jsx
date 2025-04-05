import EmailVerificationBanner from "../../components/dashboard/EmailBanner"
import Navbar from "../../components/dashboard/Navbar"
import { Routes, Route, NavLink } from 'react-router-dom';
import ExamManagement from '../../components/Teacher/ExamManagement';
import CreateExam from '../../components/Teacher/CreateExam';
import EditExam from '../../components/Teacher/EditExam';
import QuestionManagement from '../../components/Teacher/QuestionManagement';
import QuestionForm from '../../components/Teacher/QuestionForm';


const TeacherDashboard = () => {
  return (
    <>
      <Navbar userRole="Faculty" />
      <EmailVerificationBanner />
      <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Teacher Panel</h2>
        <nav>
          <ul>
            <li><NavLink to="/teacher/exams">Exam Management</NavLink></li>
            <li><NavLink to="/teacher/questions">Question Bank</NavLink></li>
            <li><NavLink to="/teacher/grades">Grade Students</NavLink></li>
          </ul>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/exams" element={<ExamManagement />} />
          <Route path="/questions" element={<QuestionBank />} />
          <Route path="/grades" element={<GradeStudents />} />
          <Route path="/exams" element={<ExamManagement />} />
          <Route path="/exams/create" element={<CreateExam />} />
          <Route path="/exams/edit/:examId" element={<EditExam />} />
          <Route path="/exams/:examId/questions" element={<QuestionManagement />} />
          <Route path="/exams/:examId/questions/create" element={<QuestionForm mode="create" />} />
          <Route path="/questions/edit/:questionId" element={<QuestionForm mode="edit" />} />
        </Routes>
      </main>
    </div>
    </>
  )
}

export default TeacherDashboard
