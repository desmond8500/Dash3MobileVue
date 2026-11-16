<script setup lang="ts">
/**
 * Fenêtre de formulaire générique (ajout / modification) pour les entités
 * simples : fournisseurs, marques, contacts, notes, journaux…
 */
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from "@ionic/vue";
import { reactive, ref, watch } from "vue";
import { errorMessage } from "@/services/ui";
import type { FieldDef } from "@/components/formFields";

const props = defineProps<{
  isOpen: boolean;
  title: string;
  fields: FieldDef[];
  /** Valeurs initiales (null = création) */
  initial: Record<string, any> | null;
  /** Fonction d'enregistrement : doit lever l'erreur Axios en cas d'échec */
  submit: (values: Record<string, any>) => Promise<void>;
}>();

const emit = defineEmits<{ (e: "close"): void; (e: "saved"): void }>();

const values = reactive<Record<string, any>>({});
const saving = ref(false);
const error = ref("");
const fieldErrors = ref<Record<string, string[]>>({});

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return;
    for (const f of props.fields) {
      const v = props.initial?.[f.name] ?? (f.type === "select" ? null : "");
      // Les dates de l'API (AAAA-MM-JJ ou ISO complet) sont ramenées au format du champ date
      values[f.name] = f.type === "date" && typeof v === "string" ? v.slice(0, 10) : v;
    }
    error.value = "";
    fieldErrors.value = {};
  },
  { immediate: true }
);

const canSave = () => props.fields.every((f) => !f.required || String(values[f.name] ?? "").trim() !== "");

const save = async () => {
  saving.value = true;
  error.value = "";
  fieldErrors.value = {};
  try {
    // Les champs vides partent en null pour passer la validation « nullable »
    const payload: Record<string, any> = {};
    for (const f of props.fields) {
      const v = typeof values[f.name] === "string" ? values[f.name].trim() : values[f.name];
      payload[f.name] = v === "" ? null : v;
    }
    await props.submit(payload);
    emit("saved");
  } catch (err: any) {
    fieldErrors.value = err?.response?.data?.errors ?? {};
    error.value = errorMessage(err);
  } finally {
    saving.value = false;
  }
};

const fieldError = (name: string) => fieldErrors.value[name]?.[0];
</script>

<template>
  <ion-modal :is-open="isOpen" @didDismiss="emit('close')">
    <ion-header>
      <ion-toolbar color="secondary">
        <ion-buttons slot="start">
          <ion-button @click="emit('close')">Annuler</ion-button>
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :strong="true" :disabled="saving || !canSave()" @click="save">
            <ion-spinner v-if="saving" name="crescent" />
            <span v-else>OK</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <form @submit.prevent="save">
        <p v-if="error" class="ion-padding-horizontal"><ion-text color="danger">{{ error }}</ion-text></p>
        <ion-list inset>
          <ion-item v-for="f in fields" :key="f.name">
            <ion-select
              v-if="f.type === 'select'"
              v-model="values[f.name]"
              :label="f.label + (f.required ? ' *' : '')"
              label-placement="stacked"
              interface="action-sheet"
              :cancel-text="'Annuler'"
              placeholder="—"
            >
              <ion-select-option v-for="o in f.options ?? []" :key="String(o.value)" :value="o.value">{{ o.label }}</ion-select-option>
            </ion-select>
            <ion-textarea
              v-else-if="f.type === 'textarea'"
              v-model="values[f.name]"
              :label="f.label + (f.required ? ' *' : '')"
              label-placement="stacked"
              :auto-grow="true"
            />
            <ion-input
              v-else
              v-model="values[f.name]"
              :label="f.label + (f.required ? ' *' : '')"
              label-placement="stacked"
              :type="f.type || 'text'"
              :inputmode="f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : 'text'"
              :required="f.required"
              :class="{ 'ion-invalid ion-touched': fieldError(f.name) }"
              :error-text="fieldError(f.name)"
            />
          </ion-item>
        </ion-list>
        <!-- Permet la validation avec la touche Entrée du clavier -->
        <button type="submit" hidden></button>
      </form>
    </ion-content>
  </ion-modal>
</template>
