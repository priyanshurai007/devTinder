import { io } from "socket.io-client";
import { BASE_URL } from "./constants";

// Use same origin as API
export const socket = io(BASE_URL, {
  withCredentials: true,
  autoConnect: false, // connect manually after login
});

