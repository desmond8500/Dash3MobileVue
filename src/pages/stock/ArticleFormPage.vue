<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSpinner,
  IonText,
  onIonViewWillEnter,
  useIonRouter,
} from "@ionic/vue";
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/header.vue";
import {
  PRIORITIES,
  getArticle,
  listBrands,
  listProviders,
  saveArticle,
  type ArticlePayload,
  type Brand,
  type Provider,
} from "@/services/stock";
import { errorMessage, toast } from "@/services/ui";

const route = useRoute();
const router = useIonRouter();

const id = computed(() => (route.params.id as string | undefined) || undefined);
const isEdit = computed(() => !!id.value);

const empty = (): ArticlePayload => ({
  designation: "",
  reference: "",
  description: "",
  spec: "",
  price: 0,
  quantity: 0,
  quantity_min: 0,
  priority_id: 1,
  weight: null,
  tva: null,
  brand_id: null,
  provider_id: null,
});

const form = reactive<ArticlePayload>(empty());
const brands = ref<Brand[]>([]);
const providers = ref<Provider[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const fieldErrors = ref<Record<string, string[]>>({});

onIonViewWillEnter(async () => {
  loading.value = true;
  error.value = "";
  fieldErrors.value = {};
  Object.assign(form, empty());
  try {
    const [b, p] = await Promise.all([listBrands(), listProviders()]);
    brands.value = b;
    providers.value = p;
    if (id.value) {
      const a = await getArticle(id.value);
      Object.assign(form, {
        designation: a.designation ?? "",
        reference: a.reference ?? "",
        description: a.description ?? "",
        spec: a.spec ?? "",
        price: a.price ?? 0,
        quantity: a.quantity ?? 0,
        quantity_min: a.quantity_min ?? 0,
        priority_id: a.priority_id ?? 1,
        weight: a.weight,
        tva: a.tva,
        brand_id: a.brand_id,
        provider_id: a.provider_id,
      });
    }
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
});

// ion-input renvoie des chaînes : on convertit les champs numériques
const num = (v: unknown, integer = false) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(",", "."));
  if (Number.isNaN(n)) return null;
  return integer ? Math.trunc(n) : n;
};

const save = async () => {
  saving.value = true;
  error.value = "";
  fieldErrors.value = {};
  try {
    const payload: ArticlePayload = {
      ...form,
      designation: form.designation.trim(),
      reference: (form.reference ?? "").trim(),
      price: num(form.price),
      quantity: num(form.quantity, true),
      quantity_min: num(form.quantity_min, true),
      weight: num(form.weight),
      tva: num(form.tva),
    };
    const saved = await saveArticle(payload, id.value);
    await toast(isEdit.value ? "Article modifié" : "Article créé");
    router.navigate(`/tabs/home/stock/articles/${saved?.id ?? id.value}`, "back", "replace");
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
  <ion-page>
    <Header :title="isEdit ? 'Modifier l\'article' : 'Nouvel article'" />
    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>

      <form v-else @submit.prevent="save">
        <p v-if="error" class="ion-padding-horizontal"><ion-text color="danger">{{ error }}</ion-text></p>

        <ion-list inset>
          <ion-list-header><ion-label>Identification</ion-label></ion-list-header>
          <ion-item>
            <ion-input
              v-model="form.designation"
              label="Désignation *"
              label-placement="stacked"
              required
              :class="{ 'ion-invalid ion-touched': fieldError('designation') }"
              :error-text="fieldError('designation')"
            />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="form.reference"
              label="Référence *"
              label-placement="stacked"
              required
              :class="{ 'ion-invalid ion-touched': fieldError('reference') }"
              :error-text="fieldError('reference')"
            />
          </ion-item>
          <ion-item>
            <ion-select v-model="form.priority_id" label="Catégorie" label-placement="stacked" interface="action-sheet" cancel-text="Annuler">
              <ion-select-option v-for="p in PRIORITIES" :key="p.id" :value="p.id">{{ p.name }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-select v-model="form.brand_id" label="Marque" label-placement="stacked" interface="action-sheet" cancel-text="Annuler">
              <ion-select-option :value="null">Aucune</ion-select-option>
              <ion-select-option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-select v-model="form.provider_id" label="Fournisseur" label-placement="stacked" interface="action-sheet" cancel-text="Annuler">
              <ion-select-option :value="null">Aucun</ion-select-option>
              <ion-select-option v-for="p in providers" :key="p.id" :value="p.id">{{ p.name }}</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <ion-list inset>
          <ion-list-header><ion-label>Stock et prix</ion-label></ion-list-header>
          <ion-item>
            <ion-input v-model="form.price" label="Prix (F)" label-placement="stacked" type="number" inputmode="decimal" min="0" :error-text="fieldError('price')" :class="{ 'ion-invalid ion-touched': fieldError('price') }" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.tva" label="TVA (%)" label-placement="stacked" type="number" inputmode="decimal" min="0" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.quantity" label="Quantité" label-placement="stacked" type="number" inputmode="numeric" min="0" :error-text="fieldError('quantity')" :class="{ 'ion-invalid ion-touched': fieldError('quantity') }" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.quantity_min" label="Seuil minimum" label-placement="stacked" type="number" inputmode="numeric" min="0" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.weight" label="Poids (kg)" label-placement="stacked" type="number" inputmode="decimal" min="0" />
          </ion-item>
        </ion-list>

        <ion-list inset>
          <ion-list-header><ion-label>Détails</ion-label></ion-list-header>
          <ion-item>
            <ion-textarea v-model="form.description" label="Description" label-placement="stacked" :auto-grow="true" />
          </ion-item>
          <ion-item>
            <ion-textarea v-model="form.spec" label="Caractéristiques" label-placement="stacked" :auto-grow="true" />
          </ion-item>
        </ion-list>

        <div class="ion-padding">
          <ion-button expand="block" type="submit" :disabled="saving || !form.designation || !form.reference">
            <ion-spinner v-if="saving" name="crescent" />
            <span v-else>{{ isEdit ? "Enregistrer" : "Créer l'article" }}</span>
          </ion-button>
        </div>
      </form>
    </ion-content>
  </ion-page>
</template>
