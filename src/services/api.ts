import axios from "axios";
import { getToken, clearSession } from "@/services/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://dash3.yonkou.info/api/v1", // URL de ton API Laravel
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Ajoute le token Sanctum à chaque requête
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token absent, expiré ou révoqué : retour à l'écran de connexion
let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export async function login(email: string, password: string) {
  const { data } = await api.post("/login", { email, password, device_name: "dash3-mobile" });
  return data as { user: any; token: string };
}

export async function logout() {
  try {
    await api.post("/logout");
  } finally {
    clearSession();
  }
}

export default api;
