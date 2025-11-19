import { io } from "socket.io-client";
import { BASE_URL } from "./constants";

// Connect socket to the frontend origin (dev server) so cookies are sent
// during the handshake. The Vite dev server proxies `/socket.io` to the
// backend (see `vite.config.js`) in development.
export const socket = io(window.location.origin, {
  withCredentials: true,
  autoConnect: false, // connect manually after login
});

// Small helpers to centralize socket lifecycle operations
export const connectSocket = () => {
  try {
    if (!socket.connected) socket.connect();
  } catch (e) {
    // no-op: keep helpers safe
  }
};

export const disconnectSocket = () => {
  try {
    if (socket.connected) socket.disconnect();
  } catch (e) {}
};

export const joinRoom = (roomId) => {
  try {
    socket.emit("joinRoom", roomId);
  } catch (e) {}
};

export const leaveRoom = (roomId) => {
  try {
    socket.emit("leaveRoom", roomId);
  } catch (e) {}
};

