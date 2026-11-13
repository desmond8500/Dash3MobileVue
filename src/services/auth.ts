import { ref } from "vue";

/**
 * Stockage du token Sanctum.
 * localStorage fonctionne dans la WebView Capacitor. Pour un stockage natif
 * plus robuste, on pourra passer à @capacitor/preferences plus tard.
 */
const TOKEN_KEY = "dash3.token";
const USER_KEY = "dash3.user";

export const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));

export function getToken(): string | null {
  return token.value;
}

export function setSession(newToken: string, user: unknown) {
  token.value = newToken;
  localStorage.setItem(TOKEN_KEY, newToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user ?? null));
}

export function clearSession() {
  token.value = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function currentUser(): any {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!token.value;
}
