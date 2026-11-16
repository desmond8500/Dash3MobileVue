/**
 * Ouverture des PDF générés par Dash3 (journal…), protégés par le token :
 * on les récupère par l'API puis on les affiche dans un nouvel onglet.
 */
import { getJournalPdf } from "@/services/erp";
import { errorMessage, toast } from "@/services/ui";

/**
 * Affiche un fichier reçu de l'API. `win` : onglet ouvert d'avance au moment du
 * clic (les navigateurs bloquent une ouverture faite après une attente) ; s'il
 * n'a pas pu s'ouvrir, le fichier est téléchargé.
 */
function showBlob(blob: Blob, filename: string, win: Window | null) {
  const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  if (win && !win.closed) {
    win.location.href = url;
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

const safeName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, "-").trim();

export async function openJournalPdf(journal: { id: number; title?: string | null; date?: string | null }) {
  const win = window.open("", "_blank");
  if (win) {
    win.document.title = "PDF du journal";
    win.document.body.textContent = "Chargement du PDF…";
  }
  try {
    const blob = await getJournalPdf(journal.id);
    showBlob(blob, `${safeName([journal.date?.slice(0, 10), journal.title || "Journal"].filter(Boolean).join(" - "))}.pdf`, win);
  } catch (err: any) {
    win?.close();
    const message =
      err?.response?.status === 404
        ? "PDF indisponible : journal introuvable ou serveur Dash3 pas encore à jour."
        : errorMessage(err);
    await toast(message, "danger");
  }
}
