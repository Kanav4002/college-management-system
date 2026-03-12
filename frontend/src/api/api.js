import axios from "axios";

/**
 * Pre-configured axios instance.
 * Automatically attaches the JWT token from localStorage to every request.
 */
const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("auth");
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
