import api from "@/services/api";
import { normalizeList } from "@/services/ui";

export interface Article {
  id: number;
  designation: string;
  reference: string | null;
  description: string | null;
  spec: string | null;
  price: number | null;
  quantity: number | null;
  quantity_min: number | null;
  priority_id: number | null;
  priority?: string | null;
  weight: number | null;
  tva: number | null;
  brand_id: number | null;
  brand_name?: string | null;
  provider_id: number | null;
  provider_name?: string | null;
  image?: string;
  tags?: string[];
}

export interface ArticleImage {
  id: number;
  image: string;
  path: string;
  is_default: boolean;
}

export interface Dependance {
  id: number;
  quantity: number;
  article: Article;
}

export interface Provider {
  id: number;
  name: string;
  address: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}

export interface Brand {
  id: number;
  name: string;
  description: string | null;
}

/** Catégories d'articles (priority_id), identiques au modèle Article de Dash3 */
export const PRIORITIES = [
  { id: 0, name: "Centrale 1" },
  { id: 1, name: "Centrale 2" },
  { id: 2, name: "Organe 1" },
  { id: 3, name: "Organe 2" },
  { id: 4, name: "Organe 3" },
  { id: 5, name: "Câble" },
  { id: 6, name: "Accessoires" },
  { id: 7, name: "Forfait" },
];

// ---------- Articles ----------

export async function listArticles(page = 1, search = "", perPage = 20) {
  const { data } = await api.get("/items", {
    params: { page, per_page: perPage, search: search || undefined },
  });
  return normalizeList<Article>(data);
}

export async function getArticle(id: number | string): Promise<Article> {
  const { data } = await api.get(`/items/${id}`);
  if (!data?.success) throw { response: { data } };
  return data.data;
}

export async function getArticleImages(id: number | string): Promise<ArticleImage[]> {
  const { data } = await api.get(`/items_image/${id}`);
  return data?.data ?? [];
}

export async function getArticleLinks(id: number | string): Promise<{ id: number; name: string; link: string }[]> {
  const { data } = await api.get(`/items_link/${id}`);
  return data?.data ?? [];
}

export async function getArticleDocuments(id: number | string): Promise<{ id: number; name: string; folder: string }[]> {
  const { data } = await api.get(`/items_document/${id}`);
  return data?.data ?? [];
}

export type ArticlePayload = Omit<Article, "id" | "priority" | "brand_name" | "provider_name" | "image">;

export async function saveArticle(payload: ArticlePayload, id?: number | string): Promise<Article> {
  const { data } = id ? await api.put(`/items/${id}`, payload) : await api.post("/items", payload);
  return data.data;
}

export async function deleteArticle(id: number | string) {
  await api.delete(`/items/${id}`);
}

// ---------- Fournisseurs ----------

export async function listProviders(search = ""): Promise<Provider[]> {
  const { data } = await api.get("/providers", { params: { search: search || undefined } });
  return data?.data ?? [];
}

export async function saveProvider(payload: Partial<Provider>, id?: number): Promise<Provider> {
  const { data } = id ? await api.put(`/providers/${id}`, payload) : await api.post("/providers", payload);
  return data.data;
}

export async function deleteProvider(id: number) {
  await api.delete(`/providers/${id}`);
}

// ---------- Marques ----------

export async function listBrands(search = ""): Promise<Brand[]> {
  const { data } = await api.get("/brands", { params: { search: search || undefined } });
  return data?.data ?? [];
}

export async function saveBrand(payload: Partial<Brand>, id?: number): Promise<Brand> {
  const { data } = id ? await api.put(`/brands/${id}`, payload) : await api.post("/brands", payload);
  return data.data;
}

export async function deleteBrand(id: number) {
  await api.delete(`/brands/${id}`);
}

// ---------- Page article : mêmes actions que Dash3 ----------

/** Quantité en stock +/− */
export async function adjustQuantity(id: number, delta: number): Promise<number> {
  const { data } = await api.post(`/items/${id}/quantity`, { delta });
  return data.data.quantity;
}

/** Ajoute l'article aux commandes (achats) */
export async function orderArticle(id: number, quantity = 1) {
  await api.post(`/items/${id}/commande`, { quantity });
}

export async function attachTag(id: number, name: string): Promise<string[]> {
  const { data } = await api.post(`/items/${id}/tags`, { name });
  return data.data;
}

export async function detachTag(id: number, name: string): Promise<string[]> {
  const { data } = await api.delete(`/items/${id}/tags`, { params: { name } });
  return data.data;
}

export async function uploadImages(id: number, files: File[]): Promise<ArticleImage[]> {
  const form = new FormData();
  files.forEach((f) => form.append("images[]", f));
  const { data } = await api.post(`/items/${id}/images`, form);
  return data.data;
}

export async function setDefaultImage(id: number, path: string): Promise<string> {
  const { data } = await api.post(`/items/${id}/image-default`, { path });
  return data.data.image;
}

export async function deleteImage(id: number, path: string): Promise<ArticleImage[]> {
  const { data } = await api.delete(`/items/${id}/images`, { params: { path } });
  return data.data;
}

export async function getDependances(id: number | string): Promise<Dependance[]> {
  const { data } = await api.get(`/items/${id}/dependances`);
  return data.data ?? [];
}

export async function addDependance(id: number, dependenceId: number): Promise<Dependance[]> {
  const { data } = await api.post(`/items/${id}/dependances`, { dependence_id: dependenceId });
  return data.data ?? [];
}

export async function adjustDependance(depId: number, delta: number): Promise<number> {
  const { data } = await api.post(`/dependances/${depId}/quantity`, { delta });
  return data.data.quantity;
}

export async function removeDependance(depId: number) {
  await api.delete(`/dependances/${depId}`);
}
