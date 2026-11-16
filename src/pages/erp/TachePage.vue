<script setup lang="ts">
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
  IonFooter,
  IonToolbar,
  IonButton,
  onIonViewWillEnter,
  useIonRouter,
} from "@ionic/vue";
import {
  checkmarkCircle,
  checkmarkOutline,
  closeOutline,
  createOutline,
  ellipseOutline,
  refreshOutline,
  trashOutline,
} from "ionicons/icons";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/header.vue";
import EntityFormModal from "@/components/EntityFormModal.vue";
import type { FieldDef } from "@/components/formFields";
import {
  TASK_PRIORITY_NAMES,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_NAMES,
  TASK_STATUS_OPTIONS,
  deleteTask,
  formatDate,
  getTache,
  saveTask,
  setTaskStatut,
  taskPriorityColor,
  taskStatusColor,
  type TacheDetail,
} from "@/services/erp";
import { backTarget, confirmAction, errorMessage, toast } from "@/services/ui";

const route = useRoute();
const router = useIonRouter();
const id = computed(() => route.params.id as string);

const tache = ref<TacheDetail | null>(null);
const loading = ref(true);
const error = ref("");

// Retour vers la page d'origine (projet, journal) ou la liste des tâches
const back = computed(() => backTarget(route.query, "/tabs/home/erp/taches"));

const load = async (spinner = true) => {
  if (spinner) loading.value = true;
  error.value = "";
  try {
    tache.value = await getTache(id.value);
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};

onIonViewWillEnter(() => load(tache.value?.id !== Number(id.value)));

const statusName = computed(() => tache.value?.statut?.name ?? TASK_STATUS_NAMES[tache.value?.statut_id ?? 0] ?? "—");
const priorityName = computed(() => tache.value?.priority?.name ?? TASK_PRIORITY_NAMES[tache.value?.priority_id ?? 0] ?? "—");
const isLate = computed(
  () => !!tache.value?.expiration_date && tache.value.statut_id !== 4 && new Date(tache.value.expiration_date) < new Date()
);
// Sous-tâche terminée : mêmes statuts que les tâches (4 Terminé, 5 Clôturé)
const subDone = (s: { status_id: number | null }) => (s.status_id ?? 0) >= 4;

// ---------- Validation / annulation ----------
// Valider → 4 « Terminé » ; Annuler → 5 « Clôturé » (sans être faite) ; Rouvrir → 1 « Nouveau »
const isClosed = computed(() => (tache.value?.statut_id ?? 0) >= 4);
const busy = ref(false);

const changeStatut = async (statut_id: number, message: string) => {
  if (!tache.value) return;
  busy.value = true;
  try {
    await setTaskStatut(tache.value.id, statut_id);
    await toast(message);
    await load(false);
  } catch (err) {
    await toast(errorMessage(err), "danger");
  } finally {
    busy.value = false;
  }
};

const valider = () => changeStatut(4, "Tâche validée");
const annuler = async () => {
  if (!(await confirmAction("Annuler la tâche", "La tâche sera clôturée sans être terminée.", "Annuler la tâche"))) return;
  await changeStatut(5, "Tâche annulée");
};
const rouvrir = () => changeStatut(1, "Tâche rouverte");

// ---------- Modification et suppression ----------
const fields: FieldDef[] = [
  { name: "name", label: "Tâche", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "statut_id", label: "Statut", type: "select", required: true, options: TASK_STATUS_OPTIONS },
  { name: "priority_id", label: "Priorité", type: "select", required: true, options: TASK_PRIORITY_OPTIONS },
  { name: "start_date", label: "Début", type: "date" },
  { name: "end_date", label: "Fin", type: "date" },
  { name: "expiration_date", label: "Échéance", type: "date" },
];
const modalOpen = ref(false);
const submit = async (values: Record<string, any>) => {
  await saveTask(values, id.value);
};
const onSaved = async () => {
  modalOpen.value = false;
  await toast("Tâche modifiée");
  await load(false);
};

const remove = async () => {
  if (!tache.value) return;
  if (!(await confirmAction("Supprimer la tâche", `Supprimer « ${tache.value.name} » ?`))) return;
  try {
    const to = back.value;
    await deleteTask(tache.value.id);
    await toast("Tâche supprimée");
    router.navigate(to, "back", "push");
  } catch (err) {
    await toast(errorMessage(err), "danger");
  }
};
</script>

<template>
  <ion-page>
    <Header :title="tache?.name || 'Tâche'" :back="back" />
    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>

      <template v-else-if="tache">
        <div class="ion-padding-horizontal">
          <h2 class="title">{{ tache.name }}</h2>
          <div class="badges">
            <ion-badge :color="taskStatusColor(tache.statut_id)">{{ statusName }}</ion-badge>
            <ion-badge :color="taskPriorityColor(tache.priority_id)">Priorité {{ priorityName.toLowerCase() }}</ion-badge>
          </div>
        </div>

        <ion-list inset>
          <ion-item v-if="tache.client" lines="full">
            <ion-label>Client</ion-label><ion-note slot="end">{{ tache.client.name }}</ion-note>
          </ion-item>
          <ion-item v-if="tache.projet" :router-link="`/tabs/home/erp/projets/${tache.projet.id}`" detail>
            <ion-label>Projet</ion-label><ion-note slot="end">{{ tache.projet.name }}</ion-note>
          </ion-item>
          <ion-item><ion-label>Début</ion-label><ion-note slot="end">{{ formatDate(tache.start_date) }}</ion-note></ion-item>
          <ion-item><ion-label>Fin</ion-label><ion-note slot="end">{{ formatDate(tache.end_date) }}</ion-note></ion-item>
          <ion-item lines="none">
            <ion-label>Échéance</ion-label>
            <ion-note slot="end" :color="isLate ? 'danger' : undefined">{{ formatDate(tache.expiration_date) }}</ion-note>
          </ion-item>
        </ion-list>

        <ion-list v-if="tache.description" inset>
          <ion-list-header><ion-label>Description</ion-label></ion-list-header>
          <ion-item lines="none"><ion-label class="ion-text-wrap pre">{{ tache.description }}</ion-label></ion-item>
        </ion-list>

        <ion-list v-if="tache.subtasks?.length" inset>
          <ion-list-header><ion-label>Sous-tâches</ion-label></ion-list-header>
          <ion-item v-for="s in tache.subtasks" :key="s.id">
            <ion-icon
              slot="start"
              :icon="subDone(s) ? checkmarkCircle : ellipseOutline"
              :color="subDone(s) ? 'success' : 'medium'"
              aria-hidden="true"
            />
            <ion-label :class="{ done: subDone(s) }">{{ s.name }}</ion-label>
          </ion-item>
        </ion-list>

        <ion-list inset>
          <ion-item button :detail="false" @click="modalOpen = true">
            <ion-icon slot="start" :icon="createOutline" color="primary" aria-hidden="true" />
            <ion-label color="primary">Modifier la tâche</ion-label>
          </ion-item>
          <ion-item button :detail="false" lines="none" @click="remove">
            <ion-icon slot="start" :icon="trashOutline" color="danger" aria-hidden="true" />
            <ion-label color="danger">Supprimer la tâche</ion-label>
          </ion-item>
        </ion-list>
      </template>

      <EntityFormModal
        :is-open="modalOpen"
        title="Modifier la tâche"
        :fields="fields"
        :initial="tache"
        :submit="submit"
        @close="modalOpen = false"
        @saved="onSaved"
      />
    </ion-content>

    <!-- Boutons de validation et d'annulation -->
    <ion-footer v-if="tache && !loading && !error" class="ion-no-border">
      <ion-toolbar class="actions-bar">
        <div v-if="!isClosed" class="actions">
          <ion-button expand="block" fill="outline" color="danger" :disabled="busy" @click="annuler">
            <ion-icon slot="start" :icon="closeOutline" aria-hidden="true" />Annuler
          </ion-button>
          <ion-button expand="block" color="success" :disabled="busy" @click="valider">
            <ion-icon slot="start" :icon="checkmarkOutline" aria-hidden="true" />Valider
          </ion-button>
        </div>
        <div v-else class="actions">
          <ion-button expand="block" fill="outline" color="medium" :disabled="busy" @click="rouvrir">
            <ion-icon slot="start" :icon="refreshOutline" aria-hidden="true" />Rouvrir la tâche
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<style scoped>
.title {
  margin: 12px 0 6px;
}
.badges {
  display: flex;
  gap: 4px;
}
.pre {
  white-space: pre-line;
}
.actions-bar {
  --padding-start: 12px;
  --padding-end: 12px;
}
.actions {
  display: flex;
  gap: 8px;
}
.actions ion-button {
  flex: 1;
  margin: 0;
}
.done {
  text-decoration: line-through;
  color: var(--ion-color-medium);
}
</style>
