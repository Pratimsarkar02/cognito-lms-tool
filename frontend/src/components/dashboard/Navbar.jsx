// frontend/src/components/dashboard/Navbar.jsx
import { useContext } from "react";
import PropTypes from "prop-types";
import { AppContent } from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import UserAvatar from "./UserAvatar";

// Map each role to its profile route
const PROFILE_ROUTES = {
  Admin:   "/admin-profile",
  Faculty: "/faculty-profile",
  Student: "/student-profile",
};

const Navbar = ({ userRole = "Student" }) => {
  const navigate = useNavigate();
  const {
    authState: { userData },
    logout,
  } = useContext(AppContent);

  const firstName = userData?.firstName || "";
  const lastName  = userData?.lastName  || "";
  const greeting  = firstName || userRole;
  const profileRoute = PROFILE_ROUTES[userRole] || "/student-profile";

  return (
    <nav className="fixed top-0 w-full flex justify-between items-center px-4 h-16 bg-gray-800 text-white z-40">
      {/* Left: greeting */}
      <span className="font-medium text-lg">Hey {greeting}!</span>

      {/* Right: avatar + logout */}
      <div className="flex items-center gap-3">

        <button
          onClick={logout}
          className="flex items-center hover:text-gray-300 transition-colors cursor-pointer"
          aria-label="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
};

Navbar.propTypes = { userRole: PropTypes.string };
export default Navbar;