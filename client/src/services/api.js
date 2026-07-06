import axios from "axios";

// API Base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for session cookies
});

// Interceptor to manage errors or session expiry
apiInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCheck = err.config?.url?.includes("/admin/auth/me");
    if (err.response?.status === 401 && !isAuthCheck) {
      if (window.handleUnauthorized) {
        window.handleUnauthorized();
      }
    }
    return Promise.reject(err);
  }
);

// Public API Services
export const getProjects = async (params) => {
  return apiInstance.get("/projects", { params });
};

export const getProjectBySlug = async (slug) => {
  return apiInstance.get(`/projects/${slug}`);
};

export const getGallery = async (params) => {
  return apiInstance.get("/gallery", { params });
};

export const getTestimonials = async (params) => {
  return apiInstance.get("/testimonials", { params });
};

export const getTeam = async () => {
  return apiInstance.get("/team");
};

export const getSettings = async () => {
  return apiInstance.get("/settings");
};

export const submitContactForm = async (formData) => {
  return apiInstance.post("/contact", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const submitCallbackRequest = async (data) => {
  return apiInstance.post("/callback-request", data);
};

export default apiInstance;
