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
        <main className={`flex-1 transition-all duration-300 pt-24 px-4 pb-8 ${isCollapsed ? 'md:ml-[70px]' : 'md:ml-64'}`}>
          {/* Dashboard content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">Faculty Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Faculty Dashboard Cards */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h2 className="text-lg font-medium text-blue-700 mb-2">My Courses</h2>
                <p className="text-3xl font-bold">5</p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                <h2 className="text-lg font-medium text-green-700 mb-2">Active Exams</h2>
                <p className="text-3xl font-bold">3</p>
              </div>
              
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
                <h2 className="text-lg font-medium text-amber-700 mb-2">Student Submissions</h2>
                <p className="text-3xl font-bold">48</p>
              </div>
            </div>
            
            {/* Recent Activity Section */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Activity</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="divide-y divide-gray-200">
                  <li className="py-3">Student Raj Kumar submitted exam for Web Development</li>
                  <li className="py-3">You published Database Management exam</li>
                  <li className="py-3">5 students completed Software Engineering exam</li>
                </ul>
              </div>
            </div>
            
            {/* For nested routes */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default FacultyDashboard;