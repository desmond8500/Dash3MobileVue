<script setup lang="ts">
/**
 * Détail d'un journal de projet : informations, devis liés, sections (photos et
 * tâches), intervenants et tâches. Le journal se modifie et se supprime d'ici.
 */
import {
  IonPage,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  onIonViewWillEnter,
  useIonRouter,
} from "@ionic/vue";
import { createOutline, trashOutline } from "ionicons/icons";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/header.vue";
import EntityFormModal from "@/components/EntityFormModal.vue";
import type { FieldDef } from "@/components/formFields";
import {
  TASK_STATUS_NAMES,
  deleteJournal,
  devisStatusColor,
  formatDate,
  getJournal,
  saveJournal,
  taskStatusColor,
  type JournalDetail,
  type Tache,
} from "@/services/erp";
import { backTarget, confirmAction, errorMessage, toast, withFrom } from "@/services/ui";

const route = useRoute();
const router = useIonRouter();
const id = computed(() => route.params.id as string);
const selfPath = computed(() => `/tabs/home/erp/journaux/${id.value}`);

const journal = ref<JournalDetail | null>(null);
const loading = ref(true);
const error = ref("");

const back = computed(() =>
  backTarget(route.query, journal.value?.projet_id ? `/tabs/home/erp/projets/${journal.value.projet_id}` : "/tabs/home/erp/projets")
);

const load = async (spinner = true) => {
  if (spinner) loading.value = true;
  error.value = "";
  try {
    journal.value = await getJournal(id.value);
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};

onIonViewWillEnter(() => load(journal.value?.id !== Number(id.value)));

const refresh = async (ev: CustomEvent) => {
  await load(false);
  (ev.target as HTMLIonRefresherElement).complete();
};

const person = (p: { firstname: string | null; lastname: string | null } | null | undefined) =>
  p ? [p.firstname, p.lastname].filter(Boolean).join(" ") || "—" : "—";

const intervenantName = (i: NonNullable<JournalDetail["intervenants"]>[number]) => person(i.contact ?? i.team);
const intervenantInfo = (i: NonNullable<JournalDetail["intervenants"]>[number]) =>
  i.contact
    ? [i.contact.fonction, i.contact.societe, i.contact.phone].filter(Boolean).join(" · ")
    : [i.team?.function, "Équipe"].filter(Boolean).join(" · ");

const statusName = (t: Tache) => t.statut?.name ?? TASK_STATUS_NAMES[t.statut_id ?? 0] ?? "—";

// ---------- Modification et suppression ----------

const fields: FieldDef[] = [
  { name: "title", label: "Titre", required: true },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "type", label: "Type" },
  { name: "description", label: "Description", type: "textarea" },
];
const modalOpen = ref(false);

const submit = async (values: Record<string, any>) => {
  await saveJournal(values, id.value);
};
const onSaved = async () => {
  modalOpen.value = false;
  await toast("Journal modifié");
  await load(false);
};

const remove = async () => {
  if (!journal.value) return;
  if (!(await confirmAction("Supprimer le journal", `Supprimer « ${journal.value.title} » ?`))) return;
  try {
    const to = back.value;
    await deleteJournal(journal.value.id);
    await toast("Journal supprimé");
    router.navigate(to, "back", "push");
  } catch (err) {
    await toast(errorMessage(err), "danger");
  }
};
</script>

<template>
  <ion-page>
    <Header :title="journal?.title || 'Journal'" :back="back" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content /></ion-refresher>

      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>

      <template v-else-if="journal">
        <div class="ion-padding-horizontal">
          <h2 class="title">{{ journal.title }}</h2>
          <ion-text color="medium">
            <p class="sub">{{ formatDate(journal.date) }}<span v-if="journal.type"> · {{ journal.type }}</span></p>
          </ion-text>
        </div>

        <ion-list inset>
          <ion-item v-if="journal.projet" :router-link="`/tabs/home/erp/projets/${journal.projet.id}`" detail>
            <ion-label>Projet</ion-label><ion-note slot="end">{{ journal.projet.name }}</ion-note>
          </ion-item>
          <ion-item v-if="journal.projet?.client" lines="none">
            <ion-label>Client</ion-label><ion-note slot="end">{{ journal.projet.client.name }}</ion-note>
          </ion-item>
        </ion-list>

        <ion-list v-if="journal.description" inset>
          <ion-list-header><ion-label>Description</ion-label></ion-list-header>
          <ion-item lines="none"><ion-label class="ion-text-wrap pre">{{ journal.description }}</ion-label></ion-item>
        </ion-list>

        <!-- Devis liés -->
        <ion-list v-if="journal.invoices?.length" inset>
          <ion-list-header><ion-label>Devis</ion-label></ion-list-header>
          <ion-item v-for="d in journal.invoices" :key="d.id" :router-link="withFrom(`/tabs/home/erp/devis/${d.id}`, selfPath)" detail>
            <ion-label>
              <h3>{{ d.reference }}</h3>
              <p v-if="d.description">{{ d.description }}</p>
            </ion-label>
            <ion-badge v-if="d.statut" slot="end" :color="devisStatusColor(d.statut)">{{ d.statut }}</ion-badge>
          </ion-item>
        </ion-list>

        <!-- Sections : texte, photos, tâches -->
        <ion-list v-for="s in journal.sections" :key="s.id" inset>
          <ion-list-header><ion-label>{{ s.name }}</ion-label></ion-list-header>
          <ion-item v-if="s.description"><ion-label class="ion-text-wrap pre">{{ s.description }}</ion-label></ion-item>
          <div v-if="s.images?.length" class="photos">
            <a v-for="img in s.images" :key="img.id" :href="img.url" target="_blank" rel="noopener">
              <img :src="img.url" :alt="img.caption || s.name" loading="lazy" />
            </a>
          </div>
          <ion-item v-for="t in s.tasks" :key="t.id" :router-link="withFrom(`/tabs/home/erp/taches/${t.id}`, selfPath)" detail>
            <ion-label>{{ t.name }}</ion-label>
            <ion-badge slot="end" :color="taskStatusColor(t.statut_id)">{{ statusName(t) }}</ion-badge>
          </ion-item>
          <ion-item v-if="!s.description && !s.images?.length && !s.tasks?.length" lines="none">
            <ion-text color="medium">Section vide</ion-text>
          </ion-item>
        </ion-list>

        <!-- Photos sans section (anciens journaux) -->
        <ion-list v-if="journal.images?.length" inset>
          <ion-list-header><ion-label>Photos</ion-label></ion-list-header>
          <div class="photos">
            <a v-for="img in journal.images" :key="img.id" :href="img.url" target="_blank" rel="noopener">
              <img :src="img.url" :alt="img.caption || journal.title" loading="lazy" />
            </a>
          </div>
        </ion-list>

        <ion-list v-if="journal.intervenants?.length" inset>
          <ion-list-header><ion-label>Intervenants</ion-label></ion-list-header>
          <ion-item v-for="i in journal.intervenants" :key="i.id">
            <ion-label>
              <h3>{{ intervenantName(i) }}</h3>
              <p v-if="intervenantInfo(i)">{{ intervenantInfo(i) }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-list v-if="journal.tasks?.length" inset>
          <ion-list-header><ion-label>Tâches</ion-label></ion-list-header>
          <ion-item v-for="t in journal.tasks" :key="t.id" :router-link="withFrom(`/tabs/home/erp/taches/${t.id}`, selfPath)" detail>
            <ion-label>
              <h3>{{ t.name }}</h3>
              <p v-if="t.expiration_date">Échéance : {{ formatDate(t.expiration_date) }}</p>
            </ion-label>
            <ion-badge slot="end" :color="taskStatusColor(t.statut_id)">{{ statusName(t) }}</ion-badge>
          </ion-item>
        </ion-list>

        <ion-list inset>
          <ion-item button :detail="false" @click="modalOpen = true">
            <ion-icon slot="start" :icon="createOutline" color="primary" aria-hidden="true" />
            <ion-label color="primary">Modifier le journal</ion-label>
          </ion-item>
          <ion-item button :detail="false" lines="none" @click="remove">
            <ion-icon slot="start" :icon="trashOutline" color="danger" aria-hidden="true" />
            <ion-label color="danger">Supprimer le journal</ion-label>
          </ion-item>
        </ion-list>
      </template>

      <EntityFormModal
        :is-open="modalOpen"
        title="Modifier le journal"
        :fields="fields"
        :initial="journal"
        :submit="submit"
        @close="modalOpen = false"
        @saved="onSaved"
      />
    </ion-content>
  </ion-page>
</template>

<style scoped>
.title {
  margin: 12px 0 0;
}
.sub {
  margin: 4px 0 0;
}
.pre {
  white-space: pre-line;
}
.photos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 8px 16px;
}
.photos img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}
</style>
