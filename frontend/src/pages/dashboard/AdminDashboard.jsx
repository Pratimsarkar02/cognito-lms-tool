import { useContext } from "react"
import EmailVerificationBanner from "../../components/dashboard/EmailBanner"
import Navbar from "../../components/dashboard/Navbar"
import { AppContent } from "../../contexts/AppContext"

const AdminDashboard = () => {

  const { userData } = useContext(AppContent);

  return (
    <>
      <Navbar userRole={userData?.role} />
      <EmailVerificationBanner />
      <div className="dashboard-container">
        <aside className="sidebar">
          <h2>Admin Panel</h2>
          <nav>
            <ul>
              <li><NavLink to="/admin/users">User Management</NavLink></li>
              <li><NavLink to="/admin/courses">Course Management</NavLink></li>
              <li><NavLink to="/admin/reports">Reports</NavLink></li>
            </ul>
          </nav>
        </aside>
        <main className="content">
          <Routes>
            <Route path="/users" element={<UserManagement />} />
            <Route path="/courses" element={<CourseManagement />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default AdminDashboard
