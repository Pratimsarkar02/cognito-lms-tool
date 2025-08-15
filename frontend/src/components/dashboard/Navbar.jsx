import { useContext, useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AppContent } from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";

const Navbar = ({ userRole = "user" }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { 
    authState: { userData }, 
    logout 
  } = useContext(AppContent);

  // Get display name from userData
  const getDisplayName = () => {
    if (!userData) return userRole;
    return userData.name || `${userData.firstName} ${userData.lastName}` || userRole;
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get role-specific navigation items
  const getRoleSpecificMenuItems = () => {
    const menuItems = {
      Admin: [
        { label: "Settings", icon: Settings, action: () => navigate("/admin-settings") },
        { label: "Profile", icon: User, action: () => navigate("/admin-profile") }
      ],
      Faculty: [
        { label: "My Courses", icon: User, action: () => navigate("/faculty-courses") },
        { label: "Profile", icon: User, action: () => navigate("/faculty-profile") }
      ],
      Student: [
        { label: "My Learning", icon: User, action: () => navigate("/student-learning") },
        { label: "Profile", icon: User, action: () => navigate("/student-profile") }
      ]
    };

    return menuItems[userRole] || menuItems.Student;
  };

  const menuItems = getRoleSpecificMenuItems();
  const displayName = getDisplayName();

  return (
    <nav className="navbar fixed top-0 w-full flex justify-between items-center p-4 bg-gray-800 text-white z-40 h-16">
      <div className="navbar-brand font-medium text-lg">
        Hey {displayName}!
      </div>
      
      <ul className="navbar-menu flex items-center list-none m-0 p-0">
        <div 
          ref={dropdownRef}
          className="mx-4 relative"
        >
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex justify-center items-center text-white bg-gray-500 w-8 h-8 border-2 border-white rounded-full hover:bg-gray-600 transition-colors cursor-pointer"
          >
            {displayName[0].toUpperCase()}
          </button>
          
          {dropdownOpen && (
            <ul className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white text-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              {menuItems.map((item, index) => (
                <li
                  key={index}
                  onClick={() => {
                    item.action();
                    setDropdownOpen(false);
                  }}
                  className="py-2 px-4 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-sm"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={logout}
          className="navbar-item mx-4 flex items-center cursor-pointer hover:text-gray-300 transition-colors"
          aria-label="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </ul>
    </nav>
  );
};

Navbar.propTypes = {
  userRole: PropTypes.string
};

export default Navbar;