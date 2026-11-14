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
import { deleteProvider, listProviders, saveProvider, type Provider } from "@/services/stock";
import { confirmAction, errorMessage, toast } from "@/services/ui";

const providers = ref<Provider[]>([]);
const search = ref("");
const loading = ref(false);
const error = ref("");

const fields: FieldDef[] = [
  { name: "name", label: "Nom", required: true },
  { name: "phone", label: "Téléphone", type: "tel" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "website", label: "Site web", type: "url" },
  { name: "address", label: "Adresse" },
  { name: "description", label: "Description", type: "textarea" },
];

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    providers.value = await listProviders();
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};

onIonViewWillEnter(load);

// Filtre local : la liste des fournisseurs est courte
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return providers.value;
  return providers.value.filter((p) => [p.name, p.email, p.phone].some((v) => v?.toLowerCase().includes(q)));
});

// Formulaire
const editing = ref<Provider | null>(null);
const modalOpen = ref(false);
const openForm = (p: Provider | null = null) => {
  editing.value = p;
  modalOpen.value = true;
};
const submit = async (values: Record<string, any>) => {
  await saveProvider(values, editing.value?.id);
};
const onSaved = async () => {
  modalOpen.value = false;
  await toast(editing.value ? "Fournisseur modifié" : "Fournisseur créé");
  await load();
};

const remove = async (p: Provider) => {
  if (!(await confirmAction("Supprimer le fournisseur", `Supprimer « ${p.name} » ?`))) return;
  try {
    await deleteProvider(p.id);
    await toast("Fournisseur supprimé");
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
    <Header title="Fournisseurs" back="/tabs/home" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content /></ion-refresher>

      <ion-searchbar :value="search" placeholder="Nom, e-mail, téléphone" @ionInput="search = ($event.detail.value ?? '') as string" />

      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>
      <p v-else-if="!filtered.length" class="ion-padding ion-text-center"><ion-text color="medium">Aucun fournisseur</ion-text></p>

      <ion-list v-else>
        <ion-item-sliding v-for="p in filtered" :key="p.id">
          <ion-item button :detail="false" @click="openForm(p)">
            <ion-label>
              <h3>{{ p.name }}</h3>
              <p v-if="p.phone || p.email">{{ [p.phone, p.email].filter(Boolean).join(" · ") }}</p>
              <p v-if="p.address">{{ p.address }}</p>
            </ion-label>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option color="danger" @click="remove(p)">
              <ion-icon slot="icon-only" :icon="trashOutline" aria-label="Supprimer" />
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button aria-label="Nouveau fournisseur" @click="openForm()"><ion-icon :icon="add" /></ion-fab-button>
      </ion-fab>

      <EntityFormModal
        :is-open="modalOpen"
        :title="editing ? 'Modifier' : 'Nouveau fournisseur'"
        :fields="fields"
        :initial="editing"
        :submit="submit"
        @close="modalOpen = false"
        @saved="onSaved"
      />
    </ion-content>
  </ion-page>
</template>
