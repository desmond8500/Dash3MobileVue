import api from "@/services/api";
import { errorMessage, normalizeList } from "@/services/ui";

export interface SearchSection<T = any> {
  items: T[];
  total: number;
  error: string;
}

const empty = (): SearchSection => ({ items: [], total: 0, error: "" });

async function run(endpoint: string, search: string): Promise<SearchSection> {
  try {
    const { data } = await api.get(endpoint, { params: { search, per_page: 10 } });
    const list = normalizeList(data);
    return { items: list.items, total: list.total, error: "" };
  } catch (err: any) {
    return { ...empty(), error: errorMessage(err) };
  }
}

/** Recherche simultanée dans les clients, projets et devis */
export async function globalSearch(search: string) {
  const [clients, projets, devis] = await Promise.all([
    run("/clients", search),
    run("/projets", search),
    run("/invoices", search),
  ]);
  return { clients, projets, devis };
}
