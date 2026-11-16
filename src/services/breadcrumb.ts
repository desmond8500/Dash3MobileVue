/**
 * Fil d'Ariane : calculé à partir de l'adresse de la page.
 *  - pages du menu (/tabs/home/…) : Accueil › Projets › Chantier X ;
 *  - page ouverte depuis une autre (`?from=`) : le fil de la page d'origine,
 *    puis la page courante (ex. Accueil › Projets › Chantier X › Devis D-001).
 * Les noms des pages déjà visitées (nom du projet, référence du devis…) sont
 * retenus pour la session ; à défaut, un libellé générique est utilisé.
 */
import { reactive } from "vue";

export interface Crumb {
  label: string;
  /** Adresse complète (avec son `?from=`) ; null = élément non cliquable */
  to: string | null;
}

const HOME = "/tabs/home";
/** Profondeur maximale de `?from=` imbriqués suivis */
const MAX_DEPTH = 6;

/** Listes : libellé du segment */
const LISTS: Record<string, string> = {
  articles: "Articles",
  providers: "Fournisseurs",
  brands: "Marques",
  projets: "Projets",
  devis: "Devis",
  taches: "Tâches",
  journaux: "Journaux",
  galaxy: "Galaxy Dimension",
};
/** Élément d'une liste (segment suivant = identifiant) */
const ITEMS: Record<string, string> = {
  articles: "Article",
  projets: "Projet",
  devis: "Devis",
  taches: "Tâche",
  journaux: "Journal",
};
const ACTIONS: Record<string, string> = { new: "Nouveau", edit: "Modification" };
/** Sections du menu sans page propre : omises du fil */
const SECTIONS = new Set(["stock", "erp", "tools"]);
/** Pages des onglets (hors menu) */
const TABS: Record<string, string> = {
  planning: "Planning",
  search: "Recherche",
  settings: "Paramètres",
  favorites: "Favoris",
  customers: "Clients",
};

/** Noms retenus des pages visitées, par chemin (sans `?…`) */
const labels = reactive(new Map<string, string>());

export function setCrumbLabel(path: string, label: string) {
  if (label) labels.set(path, label);
}

function parse(fullPath: string): { path: string; from: string | null } {
  const [path, query = ""] = fullPath.split("?");
  const from = new URLSearchParams(query).get("from");
  return { path, from: from && from.startsWith("/tabs/") ? from : null };
}

function segmentLabel(seg: string, prev: string | undefined): string {
  return LISTS[seg] ?? ACTIONS[seg] ?? (prev ? ITEMS[prev] : undefined) ?? TABS[seg] ?? seg;
}

/** Fil jusqu'à `fullPath` inclus (le dernier élément pointe sur `fullPath`) */
function trail(fullPath: string, exists: (path: string) => boolean, depth: number): Crumb[] {
  const { path, from } = parse(fullPath);
  if (from && depth < MAX_DEPTH) {
    const segs = path.split("/").filter(Boolean);
    const label = labels.get(path) ?? segmentLabel(segs[segs.length - 1], segs[segs.length - 2]);
    return [...trail(from, exists, depth + 1), { label, to: fullPath }];
  }

  if (!path.startsWith(HOME)) {
    const seg = path.split("/").filter(Boolean)[1] ?? "";
    return [{ label: labels.get(path) ?? TABS[seg] ?? seg, to: fullPath }];
  }

  const out: Crumb[] = [{ label: "Accueil", to: HOME }];
  const segs = path.slice(HOME.length).split("/").filter(Boolean);
  let p = HOME;
  segs.forEach((seg, i) => {
    p += `/${seg}`;
    if (SECTIONS.has(seg)) return;
    out.push({ label: labels.get(p) ?? segmentLabel(seg, segs[i - 1]), to: exists(p) ? p : null });
  });
  out[out.length - 1].to = fullPath;
  return out;
}

/**
 * Fil d'Ariane de la page `fullPath`, dont le dernier élément (non cliquable)
 * porte `title`. Vide s'il n'y a rien au-dessus de la page.
 */
export function buildCrumbs(fullPath: string, title: string, exists: (path: string) => boolean): Crumb[] {
  const crumbs = trail(fullPath, exists, 0);
  if (crumbs.length < 2) return [];
  const last = crumbs[crumbs.length - 1];
  crumbs[crumbs.length - 1] = { label: title || last.label, to: null };
  return crumbs;
}
