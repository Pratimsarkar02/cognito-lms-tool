import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppContent } from '../../contexts/AppContext';
import { LoadingSkeleton } from '../dashboard/LoadingSkeleton';

const ProtectedRoute = () => {
  const location = useLocation();
  const { authState:{ isLoggedIn, isLoading, userData } } = useContext(AppContent);
  
  if (isLoading) {
    return <LoadingSkeleton type="fullscreen" />;
  }
   if(!isLoggedIn) {
    return <Navigate to="/login?state=login" state={{ from: location }} replace />;
   }

   if(!userData?.role) {
    return <Navigate to="/" replace />;
   }
  
   return <Outlet />;
};

export default ProtectedRoute;