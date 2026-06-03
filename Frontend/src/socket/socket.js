import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "/api";
const fallbackSocketUrl =
  apiUrl === "/api"
    ? "http://localhost:5000"
    : apiUrl.replace(/\/api\/?$/, "");

const socket = io(import.meta.env.VITE_SOCKET_URL || fallbackSocketUrl);

export default socket;
