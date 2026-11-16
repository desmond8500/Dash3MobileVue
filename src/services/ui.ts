import { alertController, toastController } from "@ionic/vue";

/** Message lisible à partir d'une erreur Axios / Laravel */
export function errorMessage(err: any): string {
  const data = err?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(" ");
  if (err?.response?.status === 403) return "Vous n'avez pas la permission pour cette action.";
  if (data?.message) return data.message;
  if (!err?.response) return "Impossible de joindre le serveur.";
  return "Une erreur est survenue.";
}

export async function toast(message: string, color: "success" | "danger" | "medium" = "success") {
  const t = await toastController.create({ message, color, duration: 2200, position: "bottom" });
  await t.present();
}

/** Demande une confirmation ; renvoie true si l'utilisateur accepte */
export async function confirmAction(header: string, message: string, confirmText = "Supprimer"): Promise<boolean> {
  const alert = await alertController.create({
    header,
    message,
    buttons: [
      { text: "Annuler", role: "cancel" },
      { text: confirmText, role: "confirm", cssClass: "alert-danger" },
    ],
  });
  await alert.present();
  const { role } = await alert.onDidDismiss();
  return role === "confirm";
}

/** Les listes Dash3 renvoient soit { data: [...], meta }, soit { data: { data: [...] , ... } } */
export function normalizeList<T = any>(body: any) {
  const d = body?.data;
  const items: T[] = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
  const meta = body?.meta ?? (Array.isArray(d) ? {} : d) ?? {};
  return {
    items,
    page: Number(meta.current_page ?? 1),
    lastPage: Number(meta.last_page ?? 1),
    total: Number(meta.total ?? items.length),
  };
}

/**
 * Lien de retour d'une page de détail : la page d'origine passée en `?from=`
 * (ex. le projet qui a ouvert le devis), sinon la liste par défaut.
 */
export function backTarget(query: Record<string, unknown>, fallback: string): string {
  const from = Array.isArray(query.from) ? query.from[0] : query.from;
  return typeof from === "string" && from.startsWith("/tabs/") ? from : fallback;
}

/** Ajoute `from=<origine>` à un lien de page de détail (le lien peut déjà avoir des paramètres) */
export const withFrom = (path: string, from: string) =>
  `${path}${path.includes("?") ? "&" : "?"}from=${encodeURIComponent(from)}`;

/**
 * Adresse de la page courante à passer en `?from=` à ses pages de détail,
 * en gardant sa propre origine : le fil d'Ariane et les retours suivent ainsi
 * toute la chaîne (projet › journal › tâche).
 */
export function selfLink(base: string, query: Record<string, unknown>): string {
  const from = backTarget(query, "");
  return from ? withFrom(base, from) : base;
}
