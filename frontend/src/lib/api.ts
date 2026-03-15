import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem("refresh_token");
        const res = await axios.post(`${API_URL}/users/token/refresh/`, { refresh });
        localStorage.setItem("access_token", res.data.access);
        original.headers.Authorization = `Bearer ${res.data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; username: string; password: string; password2: string }) =>
    api.post("/users/register/", data),
  login: (data: { email: string; password: string }) =>
    api.post("/users/login/", data),
  getProfile: () => api.get("/users/profile/"),
};

// ── Quizzes ───────────────────────────────────────────
export const quizzesApi = {
  list: () => api.get("/quizzes/"),
  get: (id: number) => api.get(`/quizzes/${id}/`),
  create: (data: { topic: string; difficulty: string; num_questions: number; is_public: boolean }) =>
    api.post("/quizzes/create/", data),
  review: (id: number) => api.get(`/quizzes/${id}/review/`),
  leaderboard: (id: number) => api.get(`/quizzes/${id}/leaderboard/`),
  getSchedules: () => api.get("/quizzes/schedules/"),
  createSchedule: (data: { topic: string; difficulty: string; frequency: string }) =>
    api.post("/quizzes/schedules/", data),
  deleteSchedule: (id: number) => api.delete(`/quizzes/schedules/${id}/`),
};

// ── Attempts ──────────────────────────────────────────
export const attemptsApi = {
  start: (quizId: number) => api.post(`/attempts/start/${quizId}/`),
  submit: (
    attemptId: number,
    data: { answers: { question_id: number; selected_option: string }[]; time_taken: number }
  ) => api.post(`/attempts/${attemptId}/submit/`, data),
  history: () => api.get("/attempts/history/"),
  detail: (id: number) => api.get(`/attempts/${id}/`),
  stats: () => api.get("/attempts/stats/"),
};

export default api;
