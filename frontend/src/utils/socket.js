import { io } from "socket.io-client";

// Module-level singleton so the same socket instance is reused across the app.
let socketInstance = null;

// Creates the socket only once, using the backendUrl passed in from AppContext.
// Does not auto-connect — connection is triggered explicitly after login.
export const initSocket = (backendUrl) => {
  if (socketInstance) {
    return socketInstance;
  }

  socketInstance = io(backendUrl, {
    withCredentials: true,
    autoConnect: false,
  });

  // Fired once when the underlying transport connects successfully.
  socketInstance.on("connect", () => {
    console.log("[Socket] Connected with id:", socketInstance.id);
  });

  // Fired when the socket disconnects (logout, server restart, network drop).
  socketInstance.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected. Reason:", reason);
  });

  // Fired if the initial connection attempt fails (server down, CORS issue, etc).
  socketInstance.on("connect_error", (error) => {
    console.log("[Socket] Connection error:", error.message);
  });

  return socketInstance;
};

// Returns the existing socket instance, or null if initSocket has not run yet.
export const getSocket = () => socketInstance;