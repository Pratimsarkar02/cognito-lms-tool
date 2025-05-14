import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  User,
  Settings,
  Users
} from 'lucide-react';
import { useContext } from 'react';
import { AppContent } from '../../contexts/AppContext';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  
  const { authState: {userData} } = useContext(AppContent);
  return (
    <aside
      className={`mt-16 fixed left-0 h-screen bg-white border-r border-gray-200 z-30 transition-all duration-300 overflow-hidden ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            {!isCollapsed && <span className="text-xl font-bold text-gray-900">COGNITO</span>}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600 cursor-pointer" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600 cursor-pointer" />
            )}
          </button>
        </div>
        {/* Student Navlinks */}
        {userData.role === 'Student' && (
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          <NavLink
            to="/student-dashboard"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to="/student-dashboard/exams"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <ClipboardList className="w-5 h-5" />
            {!isCollapsed && <span>Exams</span>}
          </NavLink>

          <NavLink
            to="/student-dashboard/results"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <FileText className="w-5 h-5" />
            {!isCollapsed && <span>Results</span>}
          </NavLink>
          
          <NavLink
            to="/student-dashboard/profile"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <User className="w-5 h-5" />
            {!isCollapsed && <span>Profile</span>}
          </NavLink>

          <NavLink
            to="/student-dashboard/settings"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>
        </nav>
        )}
        {/* Faculty Navlinks */}
        {userData.role === 'Faculty' && (
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          <NavLink
            to="/faculty-dashboard"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to="/faculty-dashboard/exams"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <ClipboardList className="w-5 h-5" />
            {!isCollapsed && <span>Exams</span>}
          </NavLink>

          <NavLink
            to="/faculty-dashboard/results"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <FileText className="w-5 h-5" />
            {!isCollapsed && <span>Results</span>}
          </NavLink>
          
          <NavLink
            to="/faculty-dashboard/profile"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <User className="w-5 h-5" />
            {!isCollapsed && <span>Profile</span>}
          </NavLink>

          <NavLink
            to="/faculty-dashboard/settings"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>
        </nav>
        )}
        {/* Admin Navlinks */}
        {userData.role === 'Admin' && (
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          <NavLink
            to="/admin-dashboard"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to="/admin-dashboard/exams"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <ClipboardList className="w-5 h-5" />
            {!isCollapsed && <span>Exams</span>}
          </NavLink>
          <NavLink
            to="/admin-dashboard/users"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <Users className="w-5 h-5" />
            {!isCollapsed && <span>Users</span>}
          </NavLink>

          <NavLink
            to="/admin-dashboard/results"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <FileText className="w-5 h-5" />
            {!isCollapsed && <span>Results</span>}
          </NavLink>
          
          <NavLink
            to="/admin-dashboard/profile"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <User className="w-5 h-5" />
            {!isCollapsed && <span>Profile</span>}
          </NavLink>

          <NavLink
            to="/admin-dashboard/settings"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg transition-colors ${
isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
              ${isCollapsed ? 'justify-center' : 'space-x-3'}`
            }
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>
        </nav>
        )}
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  setIsCollapsed: PropTypes.func.isRequired
};
