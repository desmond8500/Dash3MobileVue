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
