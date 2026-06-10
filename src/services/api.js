import axios from 'axios';

const api = axios.create({
  baseURL: 'https://linkedinapi-xvld.onrender.com/api',
});

/* 🔐 request */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

/* 🔁 response */
api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) logout();

      try {
        const res = await axios.post(
          'https://localhost:7257/api/auth/refresh',
          { refreshToken }
        );

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
  }
);

function logout() {
  localStorage.clear();
  window.location.href = "/";
}

export default api;
