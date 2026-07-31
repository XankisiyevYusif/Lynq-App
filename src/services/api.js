import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://linkedinapi-xvld.onrender.com/api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const API_ROOT = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

/* 🔐 request */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const requestUrl = String(config.url || "").toLowerCase();
  const isPublicAuthRequest = [
    "/auth/login",
    "/auth/verify-two-factor",
    "/auth/google-login",
    "/auth/refresh",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/confirm-email",
    "/auth/resend-confirmation",
    "/auth/validate-password-reset-token",
  ].some((path) => requestUrl.includes(path));

  if (token && !isPublicAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

/* 🔁 response */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      throw error;
    }

    const requestUrl = String(originalRequest.url || "").toLowerCase();
    const isAuthenticationRequest = [
      "/auth/login",
      "/auth/verify-two-factor",
      "/auth/google-login",
      "/auth/refresh",
    ].some((path) => requestUrl.includes(path));

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthenticationRequest
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        logout();
        throw error;
      }

      try {
        const res = await axios.post(`${API_ROOT}/api/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem("token", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);

        processQueue(null, res.data.accessToken);

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        logout();
        throw err;
      } finally {
        isRefreshing = false;
      }
    }

    throw error;
  },
);

function logout() {
  localStorage.clear();
  window.location.href = "/";
}

export default api;
