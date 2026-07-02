// Updated AppContext.jsx
import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { AppContent } from "./AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { initSocket, getSocket } from "../utils/socket";

axios.defaults.withCredentials = true;

export const AppContextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    isLoading: true,
    userData: null,
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
          userData: userRes.data.userData,
        });
        if (userRes.data.userData) {
          setUserData(userRes.data.userData);
          console.log("User Data:", userRes.data.userData);
        }
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          isLoggedIn: false,
          userData: null,
        }));
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
      await axios.post(`${backendUrl}/api/auth/logout`);
      setAuthState({
        isLoggedIn: false,
        isLoading: false,
        userData: null,
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

  // Socket.IO lifecycle — connects only when logged in, disconnects on logout/unmount.
  useEffect(() => {
    if (!authState.isLoggedIn || !userData) {
      return;
    }

    const socket = initSocket(backendUrl);
    const userId = userData._id || userData.id;
    const role = userData.role;

    socket.connect();

    // Fired locally right after we tell the server which room to join.
    socket.emit("register-user", { userId, role });
    console.log("[Socket] Sent register-user payload:", { userId, role });

    // --- Temporary diagnostic listeners (safe to remove once feed UI exists) ---

    // Confirms a new notification reached this client in real time.
    const handleCreated = (payload) => {
      console.log("[Socket Event] notification:created received:", payload);
    };

    // Confirms an existing notification update reached this client.
    const handleUpdated = (payload) => {
      console.log("[Socket Event] notification:updated received:", payload);
    };

    // Confirms archive/publish/pin/unpin state changes reached this client.
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

    // Confirms deletion event reached this client.
    const handleDeleted = (payload) => {
      console.log("[Socket Event] notification:deleted received:", payload);
    };

    // Confirms reaction add/change/remove events reached this client.
    const handleReacted = (payload) => {
      console.log("[Socket Event] notification:reacted received:", payload);
    };
    const handleReactionRemoved = (payload) => {
      console.log("[Socket Event] notification:reaction_removed received:", payload);
    };

    // Confirms comment add/edit/delete events reached this client.
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
      // Fired locally right before we leave rooms and disconnect (logout or unmount).
      socket.emit("unregister-user", { userId, role });
      console.log("[Socket] Sent unregister-user payload:", { userId, role });

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

      socket.disconnect();
    };
  }, [authState.isLoggedIn, userData, backendUrl]);

  return (
    <AppContent.Provider
      value={{
        userData,
        authState,
        backendUrl,
        logout,
        checkAuthState,
        getSocket,
      }}
    >
      {children}
    </AppContent.Provider>
  );
};

AppContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};