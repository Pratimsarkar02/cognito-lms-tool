import { useContext, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppContent } from '../../contexts/AppContext';
import { LoadingSkeleton } from '../dashboard/LoadingSkeleton';

const ProtectedRoute = () => {
  const location = useLocation();
  const { authState:{ isLoggedIn, isLoading, userData } , checkAuthState} = useContext(AppContent);

  useEffect(() =>{
    checkAuthState();
  },[location.pathname]);

  if (isLoading) {
    return <LoadingSkeleton type="fullscreen" />;
  }
   if(!isLoggedIn) {
    return <Navigate to="/login?state=login" state={{ from: location }} replace />;
   }

   // Role-based redirection
  if (location.pathname === '/') {
    const redirectPath = userData?.role === 'Student' ? '/student-dashboard' :
                        userData?.role === 'Faculty' ? '/faculty-dashboard' :
                        userData?.role === 'Admin' ? '/admin-dashboard' : '/login';
    return <Navigate to={redirectPath} replace />;
  }
  
    // Verify route access permissions
  const allowedRoutes = {
    Student: ['/student-dashboard'],
    Faculty: ['/faculty-dashboard'],
    Admin: ['/admin-dashboard']
  };

  if (!allowedRoutes[userData?.role]?.some(path => location.pathname.startsWith(path))) {
    return <Navigate to={userData?.role ? `/${userData.role.toLowerCase()}-dashboard` : '/'} replace />;
  }
  
   return <Outlet />;
};

export default ProtectedRoute;