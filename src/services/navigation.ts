/**
 * Règles de navigation communes.
 *
 *  - « Retour » = page précédente de l'historique (comme le bouton retour
 *    d'Android) ; l'adresse `back` d'une page ne sert que s'il n'y a pas
 *    d'historique (page ouverte directement ou rechargée).
 *  - « Remonter » vers une page parente (fil d'Ariane, après une suppression,
 *    lien vers le projet d'une tâche) : si c'est la page précédente, simple
 *    retour, sinon ouverture sans laisser de doublon dans l'historique.
 */
import type { useIonRouter } from "@ionic/vue";

type IonRouter = ReturnType<typeof useIonRouter>;

const pathOf = (p: string) => p.split("?")[0];

/** Adresse précédente dans l'historique du navigateur (renseignée par vue-router) */
export function previousPath(): string | null {
  const back = window.history.state?.back;
  return typeof back === "string" ? back : null;
}

/** Retour arrière, ou `fallback` quand il n'y a pas d'historique */
export function goBack(router: IonRouter, fallback = "/tabs/home") {
  if (router.canGoBack()) router.back();
  else router.navigate(fallback, "back", "replace");
}

/**
 * Remonte vers `to`.
 *  - `push`    : ajoute la page (lien vers un parent depuis le contenu) ;
 *  - `replace` : remplace la page courante (après une suppression ou un enregistrement) ;
 *  - `root`    : la page devient la racine de l'onglet (fil d'Ariane).
 */
export function goUp(router: IonRouter, to: string, mode: "push" | "replace" | "root" = "push") {
  const prev = previousPath();
  if (router.canGoBack() && prev && pathOf(prev) === pathOf(to)) {
    router.back();
    return;
  }
  if (mode === "root") router.navigate(to, "root", "replace");
  else router.navigate(to, "back", mode);
}
