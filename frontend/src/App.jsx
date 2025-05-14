import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/landing/LandingPage'
import About from './pages/landing/About'
import Login from './pages/auth/Login'
import EmailVerify from './pages/auth/EmailVerify'

import ResetPassword from './pages/auth/ResetPassword'
import StudentDashboard from './pages/dashboard/StudentDashboard'
import FacultyDashboard from './pages/dashboard/FacultyDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import Contact from './pages/landing/ContactUs'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'
import { ToastContainer } from 'react-toastify';
import 'react-loading-skeleton/dist/skeleton.css';
import DashboardHome from './pages/dashboard/components/DashboardHome'
import ExamList from './pages/dashboard/components/ExamList'
import ExamDetails from './pages/dashboard/components/ExamDetails'
import ExamInstructionsModal from './pages/dashboard/components/ExamInstructionsModal'
import ExamInterface from './pages/dashboard/components/ExamInterface'
import ExamReview from './pages/dashboard/components/ExamReview'
import ExamResults from './pages/dashboard/components/ExamResults'
import UserProfile from './pages/dashboard/components/UserProfile'
import SettingsPage from './pages/dashboard/components/SettingsPage'
import CreateExam from './pages/dashboard/components/CreateExam'
import EditExam from './pages/dashboard/components/EditExam'
import ManageQuestions from './pages/dashboard/components/ManageQuestions'
import UserManagement from './pages/dashboard/components/UserManagement'
import UserDetails from './pages/dashboard/components/UserDetails'

const App = () => {
  return (
    <div>
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/email-verify" element={<EmailVerify />} />

          {/* Nested Routes for Student Dashboard */}
          <Route path="student-dashboard" element={<StudentDashboard />}>
            <Route index element={<DashboardHome />} />

            <Route path="exams">
              <Route index element={<ExamList />} />
              <Route path=":examId">
                <Route index element={<ExamDetails />} />
                <Route
                  path="instructions"
                  element={<ExamInstructionsModal />}
                />
                <Route path="attempt" element={<ExamInterface />} />
                <Route path="review" element={<ExamReview />} />
              </Route>
            </Route>
            <Route path="results" element={<ExamResults />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Nested Routes for Faculty Dashboard */}
          <Route path="faculty-dashboard" element={<FacultyDashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="exams">
              <Route index element={<ExamList />} />
              <Route path="create" element={<CreateExam />} />
              <Route path=":examId">
                <Route index element={<ExamDetails />} />
                <Route path="edit" element={<EditExam />} />
                <Route path="questions" element={<ManageQuestions />} />
              </Route>
            </Route>
              <Route path="results" element={<ExamResults />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          {/* Nested Routes for Admin Dashboard */}
          <Route path="admin-dashboard" element={<AdminDashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="exams">
              <Route index element={<ExamList />} />
              <Route path="create" element={<CreateExam />} />
              <Route path=":examId">
                <Route index element={<ExamDetails />} />
                <Route path="edit" element={<EditExam />} />
                <Route path="questions" element={<ManageQuestions />} />
              </Route>
            </Route>
            <Route path="users">
              <Route index element={<UserManagement />} />
              <Route path=":userId" element={<UserDetails />} />
            </Route>
            <Route path="results" element={<ExamResults />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App

