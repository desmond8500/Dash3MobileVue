<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonSpinner,
  IonText,
  IonFab,
  IonFabButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  onIonViewWillEnter,
} from "@ionic/vue";
import { add, trashOutline } from "ionicons/icons";
import { computed, ref } from "vue";
import Header from "@/components/header.vue";
import EntityFormModal from "@/components/EntityFormModal.vue";
import type { FieldDef } from "@/components/formFields";
import { deleteBrand, listBrands, saveBrand, type Brand } from "@/services/stock";
import { confirmAction, errorMessage, toast } from "@/services/ui";

const brands = ref<Brand[]>([]);
const search = ref("");
const loading = ref(false);
const error = ref("");

const fields: FieldDef[] = [
  { name: "name", label: "Nom", required: true },
  { name: "description", label: "Description", type: "textarea" },
];

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    brands.value = await listBrands();
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};

onIonViewWillEnter(load);

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return q ? brands.value.filter((b) => b.name?.toLowerCase().includes(q)) : brands.value;
});

const editing = ref<Brand | null>(null);
const modalOpen = ref(false);
const openForm = (b: Brand | null = null) => {
  editing.value = b;
  modalOpen.value = true;
};
const submit = async (values: Record<string, any>) => {
  await saveBrand(values, editing.value?.id);
};
const onSaved = async () => {
  modalOpen.value = false;
  await toast(editing.value ? "Marque modifiée" : "Marque créée");
  await load();
};

const remove = async (b: Brand) => {
  if (!(await confirmAction("Supprimer la marque", `Supprimer « ${b.name} » ?`))) return;
  try {
    await deleteBrand(b.id);
    await toast("Marque supprimée");
    await load();
  } catch (err) {
    await toast(errorMessage(err), "danger");
  }
};

const refresh = async (ev: CustomEvent) => {
  await load();
  (ev.target as HTMLIonRefresherElement).complete();
};
</script>

<template>
  <ion-page>
    <Header title="Marques" back="/tabs/home" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content /></ion-refresher>

      <ion-searchbar :value="search" placeholder="Rechercher une marque" @ionInput="search = ($event.detail.value ?? '') as string" />

      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>
      <p v-else-if="!filtered.length" class="ion-padding ion-text-center"><ion-text color="medium">Aucune marque</ion-text></p>

      <ion-list v-else>
        <ion-item-sliding v-for="b in filtered" :key="b.id">
          <ion-item button :detail="false" @click="openForm(b)">
            <ion-label>
              <h3>{{ b.name }}</h3>
              <p v-if="b.description">{{ b.description }}</p>
            </ion-label>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option color="danger" @click="remove(b)">
              <ion-icon slot="icon-only" :icon="trashOutline" aria-label="Supprimer" />
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button aria-label="Nouvelle marque" @click="openForm()"><ion-icon :icon="add" /></ion-fab-button>
      </ion-fab>

      <EntityFormModal
        :is-open="modalOpen"
        :title="editing ? 'Modifier' : 'Nouvelle marque'"
        :fields="fields"
        :initial="editing"
        :submit="submit"
        @close="modalOpen = false"
        @saved="onSaved"
      />
    </ion-content>
  </ion-page>
</template>
