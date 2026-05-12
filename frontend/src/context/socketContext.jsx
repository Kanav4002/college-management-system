/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const trimTrailingSlashes = (value) => value.replace(/\/+$/, "");

function getSocketURL() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (!configured) return window.location.origin;
  return trimTrailingSlashes(configured).replace(/\/api$/, "");
}

export function SocketProvider({ children }) {
  const { auth } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    if (!auth?.token) {
      setSocket(null);
      setOnlineUsers({});
      return undefined;
    }

    const nextSocket = io(getSocketURL(), {
      auth: { token: auth.token },
      autoConnect: false,
      transports: ["websocket", "polling"],
    });

    nextSocket.on("presence:update", ({ userId, online }) => {
      setOnlineUsers((users) => ({ ...users, [userId]: online }));
    });

    nextSocket.on("connect_error", (error) => {
      console.warn("Socket connection failed:", error.message);
    });

    const connectTimer = window.setTimeout(() => {
      nextSocket.connect();
    }, 100);

    setSocket(nextSocket);

    return () => {
      window.clearTimeout(connectTimer);
      if (nextSocket.connected || nextSocket.active) {
        nextSocket.disconnect();
      }
    };
  }, [auth?.token]);

  const value = useMemo(() => ({ socket, onlineUsers }), [socket, onlineUsers]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext) || { socket: null, onlineUsers: {} };
}
