import PropTypes from 'prop-types';
import { NavLink, useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';
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
  const navigate = useNavigate();

const role = userData?.role || 'Student';
const firstName = userData?.firstName || '';
const lastName = userData?.lastName || '';
const fullName = `${firstName} ${lastName}`.trim() || role;

const profileRoute =
  role === 'Admin'
    ? '/admin-dashboard/profile'
    : role === 'Faculty'
    ? '/faculty-dashboard/profile'
    : '/student-dashboard/profile';
  return (
    <aside
      className={`mt-16 fixed left-0 h-screen bg-white border-r border-gray-200 z-30 transition-all duration-300 overflow-hidden ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex-1 px-3 py-4">
        <div className="px-3 pt-4 pb-3 border-b border-gray-200">
  <div className="relative min-h-[56px]">
    {/* Expanded brand row */}
    <div
      className={`absolute inset-0 flex items-center justify-between transition-all duration-300 ease-in-out ${
        isCollapsed
          ? 'opacity-0 -translate-y-1 pointer-events-none'
          : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl text-blue-600 shadow-sm">
          <GraduationCap size={22} />
        </div>

        <div className="min-w-0">
          <p className="text-base font-bold tracking-wide text-gray-900">
            Cognito
          </p>
          <p className="text-[11px] text-gray-400">LMS Dashboard</p>
        </div>
      </div>

      <button
        onClick={() => setIsCollapsed(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
      >
        <ChevronLeft size={18} />
      </button>
    </div>

    {/* Collapsed avatar replacing logo */}
    <div
      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
        isCollapsed
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-75 pointer-events-none'
      }`}
    >
      <button
        onClick={() => {
          setIsCollapsed(false);
          navigate(profileRoute);
        }}
        className=" rounded-full transition hover:scale-105 cursor-pointer"
        aria-label="Open profile and expand sidebar"
        title="My Profile"
      >
        <UserAvatar
          firstName={firstName}
          lastName={lastName}
          size="md"
        />
      </button>
      <div className="absolute -bottom-1.5 w-8 h-1 rounded-full" >
      <button
        onClick={() => setIsCollapsed(false)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
      >
        <ChevronRight size={18} />
      </button>

      </div>
    </div>
    
  </div>

  {/* Expanded user card above navlinks */}
  <button
    type="button"
    onClick={() => navigate(profileRoute)}
    className={`mt-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-left transition-all duration-300 hover:bg-gray-100 cursor-pointer ${
      isCollapsed
        ? 'max-h-0 overflow-hidden border-transparent py-0 opacity-0 mt-0'
        : 'max-h-32 opacity-100'
    }`}
    aria-label="Open my profile"
    title="Open my profile"
  >
    <div className="flex items-center gap-3">
      <UserAvatar
        firstName={firstName}
        lastName={lastName}
        size="lg"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">
          {fullName}
        </p>
        <p className="truncate text-xs text-gray-500">{role}</p>
      </div>
    </div>
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
