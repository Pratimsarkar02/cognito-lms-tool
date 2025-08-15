import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppContent } from '../../contexts/AppContext';

const PublicRoute = () => {
  const { isLoggedIn, isLoading, userData } = useContext(AppContent);

  if (isLoading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading...</div>;
  }

  return !isLoggedIn ? <Outlet /> : <Navigate to={`/${userData?.role.toLowerCase()}-dashboard`} replace />;
};

export default PublicRoute;