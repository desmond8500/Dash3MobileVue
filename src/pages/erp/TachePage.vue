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
  onIonViewWillEnter,
} from "@ionic/vue";
import { checkmarkCircle, ellipseOutline } from "ionicons/icons";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/header.vue";
import {
  TASK_PRIORITY_NAMES,
  TASK_STATUS_NAMES,
  formatDate,
  getTache,
  taskPriorityColor,
  taskStatusColor,
  type TacheDetail,
} from "@/services/erp";
import { errorMessage } from "@/services/ui";

const route = useRoute();
const id = computed(() => route.params.id as string);

const tache = ref<TacheDetail | null>(null);
const loading = ref(true);
const error = ref("");

onIonViewWillEnter(async () => {
  loading.value = true;
  error.value = "";
  try {
    tache.value = await getTache(id.value);
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
});

const statusName = computed(() => tache.value?.statut?.name ?? TASK_STATUS_NAMES[tache.value?.statut_id ?? 0] ?? "—");
const priorityName = computed(() => tache.value?.priority?.name ?? TASK_PRIORITY_NAMES[tache.value?.priority_id ?? 0] ?? "—");
const isLate = computed(
  () => !!tache.value?.expiration_date && tache.value.statut_id !== 4 && new Date(tache.value.expiration_date) < new Date()
);
// Sous-tâche terminée : mêmes statuts que les tâches (4 Terminé, 5 Clôturé)
const subDone = (s: { status_id: number | null }) => (s.status_id ?? 0) >= 4;
</script>

<template>
  <ion-page>
    <Header :title="tache?.name || 'Tâche'" back="/tabs/home/erp/taches" />
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
      </template>
    </ion-content>
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
.done {
  text-decoration: line-through;
  color: var(--ion-color-medium);
}
</style>
