/**
 * Préférences locales de l'application (stockées sur l'appareil).
 */
export type ThemeMode = "system" | "light" | "dark";

const THEME_KEY = "dash3.theme";

const media = window.matchMedia("(prefers-color-scheme: dark)");

export function getTheme(): ThemeMode {
  const v = localStorage.getItem(THEME_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

/** Applique le thème : la palette sombre d'Ionic s'active avec la classe ion-palette-dark */
export function applyTheme(mode: ThemeMode = getTheme()) {
  const dark = mode === "dark" || (mode === "system" && media.matches);
  document.documentElement.classList.toggle("ion-palette-dark", dark);
}

export function setTheme(mode: ThemeMode) {
  localStorage.setItem(THEME_KEY, mode);
  applyTheme(mode);
}

/** À appeler au démarrage : applique le thème et suit les changements du système */
export function initTheme() {
  applyTheme();
  media.addEventListener("change", () => {
    if (getTheme() === "system") applyTheme("system");
  });
}

export const API_URL: string = import.meta.env.VITE_API_URL || "https://dash3.yonkou.info/api/v1";
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION || "0.0.1";
