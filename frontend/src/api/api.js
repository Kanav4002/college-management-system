import axios from "axios";

const trimTrailingSlashes = (value) => value.replace(/\/+$/, "");

const getBaseURL = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (!configuredUrl) {
    return "/api";
  }

  const withoutTrailingSlash = trimTrailingSlashes(configuredUrl);
  return withoutTrailingSlash.endsWith("/api")
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
};

export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (typeof error?.message === "string") return error.message;

  return fallback;
};

/**
 * Pre-configured axios instance.
 * Automatically attaches the JWT token from localStorage to every request.
 */
const api = axios.create({
  baseURL: getBaseURL(),
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
