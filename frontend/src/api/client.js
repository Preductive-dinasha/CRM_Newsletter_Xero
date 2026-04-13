import axios from "axios";

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrf_access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const client = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const method = (config.method || "").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      config.headers["X-CSRF-TOKEN"] = csrf;
    }
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(err);
  }
);

export default client;
