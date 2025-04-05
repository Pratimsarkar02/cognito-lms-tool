import EmailVerificationBanner from "../../components/dashboard/EmailBanner"
import Navbar from "../../components/dashboard/Navbar"


const StudentDashboard = () => {
  return (
    <>
      <Navbar userRole="Student" />
      <EmailVerificationBanner />
      <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Student Portal</h2>
        <nav>
          <ul>
            <li><NavLink to="/student/exams">My Exams</NavLink></li>
            <li><NavLink to="/student/results">My Results</NavLink></li>
            <li><NavLink to="/student/profile">My Profile</NavLink></li>
          </ul>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/exams" element={<StudentExams />} />
          <Route path="/results" element={<StudentResults />} />
          <Route path="/profile" element={<StudentProfile />} />
        </Routes>
      </main>
    </div>
    </>
  )
}

export default StudentDashboard
