/** Définition d'un champ pour EntityFormModal */
export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "url" | "textarea" | "date" | "select";
  required?: boolean;
  /** Choix proposés pour un champ « select » */
  options?: { value: string | number | null; label: string }[];
}
