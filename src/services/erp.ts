import api from "@/services/api";
import { normalizeList } from "@/services/ui";

// ---------- Types ----------

export interface Projet {
  id: number;
  client_id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  favorite: number | boolean | null;
}

export interface ProjetDetail extends Projet {
  client_name: string | null;
  img?: string;
  invoices: { id: number; reference: string; description: string | null; statut: string | null }[];
  tasks: { id: number; name: string; statut_id: number | null; priority_id: number | null; expiration_date: string | null }[];
  buildings: { id: number; name: string }[];
  contacts: { id: number; firstname: string | null; lastname: string | null; fonction: string | null; societe: string | null; phone: string | null; email: string | null }[];
  journals: { id: number; title: string | null; date: string | null; description: string | null }[];
}

export interface Devis {
  id: number;
  projet_id: number;
  client_name: string | null;
  projet_name: string | null;
  reference: string;
  description: string | null;
  modalite: string | null;
  note: string | null;
  statut: string | null;
  tax: number | string | null;
  remise: number | string | null;
  favorite: number | boolean | null;
  facture_date: string | null;
  paydate: string | null;
  montant: number;
}

export interface DevisRow {
  id: number;
  designation: string;
  reference: string | null;
  quantite: number;
  coef: number;
  prix: number;
  total: number;
  comment: string | null;
}

export interface DevisDetail extends Devis {
  sections: { id: number; section: string; ordre: number | null; rows: DevisRow[]; total: number }[];
  acomptes: { id: number; name: string | null; montant: number; date: string | null; statut: string | null }[];
  acompte_total: number;
}

export interface Tache {
  id: number;
  name: string;
  description: string | null;
  priority_id: number | null;
  statut_id: number | null;
  expiration_date: string | null;
  start_date: string | null;
  end_date: string | null;
  priority?: { id: number; name: string } | null;
  statut?: { id: number; name: string } | null;
}

export interface TacheDetail extends Tache {
  client?: { id: number; name: string } | null;
  projet?: { id: number; name: string } | null;
  subtasks?: { id: number; name: string; status_id: number | null }[];
}

// ---------- Couleurs (mêmes conventions que le site web) ----------

/** Statut de tâche : 1 Nouveau, 2 En cours, 3 En pause, 4 Terminé, 5 Clôturé */
export const taskStatusColor = (id: number | null | undefined) =>
  ({ 1: "primary", 2: "warning", 3: "medium", 4: "success", 5: "dark" } as Record<number, string>)[id ?? 0] ?? "medium";

/** Priorité de tâche : 1 Basse, 2 Moyenne, 3 Haute */
export const taskPriorityColor = (id: number | null | undefined) =>
  ({ 1: "primary", 2: "warning", 3: "danger" } as Record<number, string>)[id ?? 0] ?? "medium";

export const TASK_STATUS_NAMES: Record<number, string> = { 1: "Nouveau", 2: "En cours", 3: "En pause", 4: "Terminé", 5: "Clôturé" };
export const TASK_PRIORITY_NAMES: Record<number, string> = { 1: "Basse", 2: "Moyenne", 3: "Haute" };

/** Statut de devis (texte libre côté Dash3) */
export const devisStatusColor = (statut: string | null | undefined) => {
  const s = (statut ?? "").toLowerCase();
  if (/(pay|réglé|regle|termin|accept|valid)/.test(s)) return "success";
  if (/(refus|annul|perdu)/.test(s)) return "danger";
  if (/(attente|envoy|cours)/.test(s)) return "warning";
  return "medium";
};

// ---------- Formatage ----------

export const formatAmount = (n: number | string | null | undefined) =>
  n === null || n === undefined || n === "" ? "—" : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(n)) + " F";

export const formatDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

// ---------- Projets ----------

export async function listProjets(page = 1, search = "", clientId?: string | number) {
  const { data } = await api.get("/projets", {
    params: { page, search: search || undefined, client_id: clientId || undefined },
  });
  return normalizeList<Projet>(data);
}

export async function getProjet(id: string | number): Promise<ProjetDetail> {
  const { data } = await api.get(`/projets/${id}`);
  return data.data;
}

// ---------- Devis ----------

export async function listDevis(page = 1, search = "") {
  // per_page force la réponse paginée (sinon l'API renvoie tous les devis)
  const { data } = await api.get("/invoices", { params: { page, per_page: 20, search: search || undefined } });
  return normalizeList<Devis>(data);
}

export async function getDevis(id: string | number): Promise<DevisDetail> {
  const { data } = await api.get(`/invoices/${id}`);
  if (!data?.success) throw { response: { data } };
  return data.data;
}

// ---------- Tâches ----------

export async function listTaches(page = 1, search = "", statut: "active" | "finished" | "" = "active") {
  const { data } = await api.get("/tasks", {
    params: { page, per_page: 20, search: search || undefined, statut: statut || undefined },
  });
  return normalizeList<Tache>(data);
}

export async function getTache(id: string | number): Promise<TacheDetail> {
  const { data } = await api.get(`/tasks/${id}`);
  if (!data?.success) throw { response: { data } };
  return data.data;
}

// ---------- Planning hebdomadaire ----------

/** Date locale au format AAAA-MM-JJ (sans décalage UTC) */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Tâches dont l'échéance tombe entre from et to (inclus) */
export async function listWeekTasks(from: string, to: string): Promise<Tache[]> {
  const { data } = await api.get("/tasks", { params: { from, to, per_page: 100 } });
  return normalizeList<Tache>(data).items;
}

/** Statut : 4 = Terminé, 1 = Nouveau */
export async function setTaskStatut(id: number, statut_id: number) {
  await api.post(`/tasks/${id}/statut`, { statut_id });
}

/** Crée une tâche avec une échéance au jour donné */
export async function createDayTask(name: string, date: string): Promise<Tache> {
  const { data } = await api.post("/tasks", { name, expiration_date: date, statut_id: 1, priority_id: 1 });
  return data.data;
}
