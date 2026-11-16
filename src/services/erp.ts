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
  journals: { id: number; title: string | null; date: string | null; description: string | null; type?: string | null }[];
}

export type ProjetContact = ProjetDetail["contacts"][number];

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
  /** Statuts acceptés par l'API pour la modification */
  statuses?: string[];
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
  client_id?: number | null;
  projet_id?: number | null;
  devis_id?: number | null;
  client?: { id: number; name: string } | null;
  projet?: { id: number; name: string; client_id?: number } | null;
}

export interface TacheDetail extends Tache {
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

/** Statuts de devis de Dash3 (InvoiceController::statut), si l'API ne les renvoie pas */
export const DEVIS_STATUSES = [
  "Proforma",
  "Nouveau",
  "En Cours",
  "En Pause",
  "Annulé",
  "Bl a faire",
  "A Facturer",
  "Paiement en attente",
  "Terminé",
];

export interface NewDevis {
  projet_id: number;
  description: string;
  statut?: string | null;
  modalite?: string | null;
  note?: string | null;
}

/** Crée un devis rattaché à un projet ; la référence est calculée par l'API */
export async function createDevis(devis: NewDevis): Promise<{ id: number; reference: string }> {
  const { data } = await api.post("/invoices", devis);
  return data.data;
}

/** Modifie un devis ; l'API renvoie le devis complet */
export async function updateDevis(id: string | number, values: Record<string, any>): Promise<DevisDetail> {
  const { data } = await api.put(`/invoices/${id}`, values);
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

/** Crée (sans id) ou modifie une tâche ; en modification seuls les champs envoyés changent */
export async function saveTask(values: Record<string, any>, id?: number | string): Promise<Tache> {
  const { data } = id ? await api.put(`/tasks/${id}`, values) : await api.post("/tasks", { statut_id: 1, priority_id: 1, ...values });
  return data.data;
}

export async function deleteTask(id: number | string) {
  await api.delete(`/tasks/${id}`);
}

/** Options de liste de choix pour les statuts et priorités */
export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUS_NAMES).map(([value, label]) => ({ value: Number(value), label }));
export const TASK_PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_NAMES).map(([value, label]) => ({ value: Number(value), label }));

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

export interface NewTask {
  name: string;
  description?: string | null;
  expiration_date: string;
  client_id?: number | null;
  projet_id?: number | null;
  devis_id?: number | null;
}

/** Tâche ajoutée manuellement au planning, liée ou non à un client, un projet ou un devis */
export async function createTask(task: NewTask): Promise<Tache> {
  const { data } = await api.post("/tasks", { statut_id: 1, priority_id: 1, ...task });
  return data.data;
}

/** Clients pour les listes de choix */
export async function listClientsLite(): Promise<{ id: number; name: string }[]> {
  const { data } = await api.get("/clients", { params: { per_page: 100 } });
  return normalizeList<{ id: number; name: string }>(data).items;
}

/** Projets d'un client (ou tous) pour les listes de choix */
export async function listProjetsLite(clientId?: number | null): Promise<Projet[]> {
  const { data } = await api.get("/projets", { params: { per_page: 100, client_id: clientId || undefined } });
  return normalizeList<Projet>(data).items;
}

// ---------- Contacts (client ou projet) ----------

/** Crée (sans id) ou modifie un contact ; à la création, projet_id ou client_id est obligatoire */
export async function saveContact(values: Record<string, any>, id?: number) {
  const { data } = id ? await api.put(`/contacts/${id}`, values) : await api.post("/contacts", values);
  return data.data as ProjetContact;
}

export async function deleteContact(id: number) {
  await api.delete(`/contacts/${id}`);
}

// ---------- Journaux ----------

export interface Journal {
  id: number;
  projet_id: number | null;
  devis_id: number | null;
  title: string;
  date: string | null;
  description: string | null;
  type: string | null;
}

export interface JournalDetail extends Journal {
  projet?: { id: number; name: string; client_id: number | null; client?: { id: number; name: string } | null } | null;
  invoices?: { id: number; reference: string; description: string | null; statut: string | null }[];
  sections?: {
    id: number;
    name: string;
    description: string | null;
    images?: { id: number; url: string; caption: string | null }[];
    tasks?: Tache[];
  }[];
  intervenants?: {
    id: number;
    contact?: { id: number; firstname: string | null; lastname: string | null; fonction: string | null; societe: string | null; phone: string | null } | null;
    team?: { id: number; firstname: string | null; lastname: string | null; function: string | null } | null;
  }[];
  tasks?: Tache[];
  images?: { id: number; url: string; caption: string | null }[];
}

export async function getJournal(id: string | number): Promise<JournalDetail> {
  const { data } = await api.get(`/journaux/${id}`);
  if (!data?.success) throw { response: { data } };
  return data.data;
}

/** Crée (sans id) ou modifie un journal ; title et date sont obligatoires à la création */
export async function saveJournal(values: Record<string, any>, id?: number | string): Promise<Journal> {
  const { data } = id ? await api.put(`/journaux/${id}`, values) : await api.post("/journaux", values);
  return data.data;
}

export async function deleteJournal(id: number | string) {
  await api.delete(`/journaux/${id}`);
}

// ---------- Notes de projet ----------

export interface ProjetNote {
  id: number;
  projet_id: number;
  titre: string;
  description: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Notes d'un projet (l'API répond en erreur « Aucune note » quand la liste est vide) */
export async function listProjetNotes(projetId: number | string): Promise<ProjetNote[]> {
  try {
    const { data } = await api.get(`/get_projet_notes/${projetId}`);
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err: any) {
    if (err?.response?.data?.success === false && [400, 404].includes(err.response.status)) return [];
    throw err;
  }
}

/** Crée (sans id) ou modifie une note ; titre et description sont obligatoires */
export async function saveNote(values: Record<string, any>, id?: number): Promise<ProjetNote> {
  const { data } = id ? await api.put(`/projet_notes/${id}`, values) : await api.post("/projet_notes", values);
  return data.data;
}

export async function deleteNote(id: number) {
  await api.delete(`/projet_notes/${id}`);
}
