import { useState } from "react";
import { Outlet } from "react-router-dom";
import EmailVerificationBanner from "../../components/dashboard/EmailBanner";
import Navbar from "../../components/dashboard/Navbar";
import Sidebar from "../../components/dashboard/Sidebar";

const FacultyDashboard = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar userRole="Faculty" />
      
      {/* Email Verification Banner - if needed */}
      <EmailVerificationBanner />
      
      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        
        {/* Main Content Area - adjusts based on sidebar state */}
        <main className={`transition-all duration-300 w-full ${
          isCollapsed ? 'ml-20' : 'ml-64'
        } p-4`}>
            <EmailVerificationBanner />
          {/* Dashboard content */}
          <div className="mt-18 bg-white rounded-lg shadow-sm p-1">
            
            
            {/* For nested routes */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default FacultyDashboard;