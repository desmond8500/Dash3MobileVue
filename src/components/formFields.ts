/** Définition d'un champ pour EntityFormModal */
export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "url" | "textarea";
  required?: boolean;
}
