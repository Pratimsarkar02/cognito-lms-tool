import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { AppContent } from "./AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { initSocket } from "../utils/socket";

axios.defaults.withCredentials = true;

export const AppContextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    isLoading: true,
    userData: null,
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const registeredUserRef = useRef(null);

  const checkAuthState = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/auth/is-auth`);

      if (data.success) {
        const userRes = await axios.get(`${backendUrl}/api/user/data`);
        const nextUser = userRes.data.userData || null;

        setAuthState({
          isLoggedIn: true,
          isLoading: false,
          userData: nextUser,
        });
        setUserData(nextUser);

        if (nextUser) {
          console.log("User Data:", nextUser);
        }
      } else {
        setAuthState({
          isLoggedIn: false,
          isLoading: false,
          userData: null,
        });
        setUserData(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [backendUrl]);

  const logout = async () => {
    try {
      const socket = initSocket(backendUrl);
      const activeUser = registeredUserRef.current;

      if (socket?.connected && activeUser?.userId && activeUser?.role) {
        socket.emit("unregister-user", activeUser);
        console.log("[Socket] Sent unregister-user payload:", activeUser);
      }

      if (socket?.connected) {
        socket.disconnect();
      }

      registeredUserRef.current = null;

      await axios.post(`${backendUrl}/api/auth/logout`);

      setAuthState({
        isLoggedIn: false,
        isLoading: false,
        userData: null,
      });
      setUserData(null);

      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error(error.message || "Logout failed");
    }
  };

  useEffect(() => {
    checkAuthState();
    const interval = setInterval(checkAuthState, 300000);
    return () => clearInterval(interval);
  }, [checkAuthState]);

  useEffect(() => {
    const socket = initSocket(backendUrl);

    if (!authState.isLoggedIn || !userData) {
      if (socket?.connected && registeredUserRef.current?.userId && registeredUserRef.current?.role) {
        socket.emit("unregister-user", registeredUserRef.current);
        console.log("[Socket] Sent unregister-user payload:", registeredUserRef.current);
      }

      registeredUserRef.current = null;

      if (socket?.connected) {
        socket.disconnect();
      }

      return;
    }

    const userId = userData._id || userData.id;
    const role = userData.role;

    const registerPayload = { userId, role };

    if (!socket.connected) {
      socket.connect();
    }

    const alreadyRegistered =
      registeredUserRef.current?.userId === userId &&
      registeredUserRef.current?.role === role;

    if (!alreadyRegistered) {
      socket.emit("register-user", registerPayload);
      console.log("[Socket] Sent register-user payload:", registerPayload);
      registeredUserRef.current = registerPayload;
    }

    const handleCreated = (payload) => {
      console.log("[Socket Event] notification:created received:", payload);
    };

    const handleUpdated = (payload) => {
      console.log("[Socket Event] notification:updated received:", payload);
    };

    const handleArchived = (payload) => {
      console.log("[Socket Event] notification:archived received:", payload);
    };

    const handlePublished = (payload) => {
      console.log("[Socket Event] notification:published received:", payload);
    };

    const handlePinned = (payload) => {
      console.log("[Socket Event] notification:pinned received:", payload);
    };

    const handleUnpinned = (payload) => {
      console.log("[Socket Event] notification:unpinned received:", payload);
    };

    const handleDeleted = (payload) => {
      console.log("[Socket Event] notification:deleted received:", payload);
    };

    const handleReacted = (payload) => {
      console.log("[Socket Event] notification:reacted received:", payload);
    };

    const handleReactionRemoved = (payload) => {
      console.log("[Socket Event] notification:reaction_removed received:", payload);
    };

    const handleCommentAdded = (payload) => {
      console.log("[Socket Event] notification:comment_added received:", payload);
    };

    const handleCommentUpdated = (payload) => {
      console.log("[Socket Event] notification:comment_updated received:", payload);
    };

    const handleCommentDeleted = (payload) => {
      console.log("[Socket Event] notification:comment_deleted received:", payload);
    };

    socket.on("notification:created", handleCreated);
    socket.on("notification:updated", handleUpdated);
    socket.on("notification:archived", handleArchived);
    socket.on("notification:published", handlePublished);
    socket.on("notification:pinned", handlePinned);
    socket.on("notification:unpinned", handleUnpinned);
    socket.on("notification:deleted", handleDeleted);
    socket.on("notification:reacted", handleReacted);
    socket.on("notification:reaction_removed", handleReactionRemoved);
    socket.on("notification:comment_added", handleCommentAdded);
    socket.on("notification:comment_updated", handleCommentUpdated);
    socket.on("notification:comment_deleted", handleCommentDeleted);

    return () => {
      socket.off("notification:created", handleCreated);
      socket.off("notification:updated", handleUpdated);
      socket.off("notification:archived", handleArchived);
      socket.off("notification:published", handlePublished);
      socket.off("notification:pinned", handlePinned);
      socket.off("notification:unpinned", handleUnpinned);
      socket.off("notification:deleted", handleDeleted);
      socket.off("notification:reacted", handleReacted);
      socket.off("notification:reaction_removed", handleReactionRemoved);
      socket.off("notification:comment_added", handleCommentAdded);
      socket.off("notification:comment_updated", handleCommentUpdated);
      socket.off("notification:comment_deleted", handleCommentDeleted);
    };
  }, [authState.isLoggedIn, userData, backendUrl]);

  return (
    <AppContent.Provider
      value={{
        authState,
        setAuthState,
        userData,
        setUserData,
        checkAuthState,
        logout,
        backendUrl,
      }}
    >
      {children}
    </AppContent.Provider>
  );
};

AppContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};