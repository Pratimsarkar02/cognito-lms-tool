// Updated AppContext.jsx
import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types"
import { AppContent } from "./AppContext";
import axios from "axios";
import { toast } from "react-toastify";

axios.defaults.withCredentials = true;

export const AppContextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    isLoading: true,
    userData: null
  });
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const checkAuthState = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/auth/is-auth`);
      if (data.success) {
        const userRes = await axios.get(`${backendUrl}/api/user/data`);
        setAuthState({
          isLoggedIn: true,
          isLoading: false,
          userData: userRes.data.userData
        });
        if(userRes.data.userData){
          setUserData(userRes.data.userData);
          console.log('User Data:', userRes.data.userData);
        }
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false,
          isLoggedIn: false,
          userData: null
        }));
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false
      }));
    }
  },[backendUrl]);

  
  const logout = async () => {
    try {
      await axios.post(`${backendUrl}/api/auth/logout`);
      setAuthState({
        isLoggedIn: false,
        isLoading: false,
        userData: null
      });
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error(error.message || "Logout failed");
    }
  };

  // Add refresh interval
  useEffect(() => {
    checkAuthState();
    const interval = setInterval(checkAuthState, 300000);
    return () => clearInterval(interval);
  }, [checkAuthState]);

  return (
    <AppContent.Provider value={{
      authState,
      setAuthState,
      userData,
      setUserData,
      checkAuthState,
      logout,
      backendUrl
    }}>
      {children}
    </AppContent.Provider>
  );
};

AppContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};