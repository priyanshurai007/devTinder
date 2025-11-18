import { io } from "socket.io-client";
import { BASE_URL } from "./constants";

// Use same origin as API
export const socket = io(BASE_URL, {
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

