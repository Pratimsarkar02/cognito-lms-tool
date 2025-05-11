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

const App = () => {
  return (
    <div>
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LandingPage/>} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/email-verify" element={<EmailVerify />} />
          
          {/* Nested Routes for Student Dashboard */}
          <Route path="student-dashboard" element={<StudentDashboard />} >
            
            <Route index element={<DashboardHome />} />
            
              <Route path="exams" >
                <Route index element={<ExamList />} />
                <Route path=":examId" >
                  <Route index element={<ExamDetails />} />
                  <Route path="instructions" element={<ExamInstructionsModal />} />
                  <Route path="attempt" element={<ExamInterface />} />
                  <Route path="review" element={<ExamReview />} />
                </Route>
              </Route>
            <Route path="results" element={<ExamResults />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          <Route path="/faculty-dashboard/*" element={<FacultyDashboard />} />
          <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
        
        </Route>
        <Route path="*" element={<Navigate to='/' replace />} />
      </Routes>
    </div>
  );
};

export default App

