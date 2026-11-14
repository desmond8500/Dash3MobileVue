<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonSpinner,
  IonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  onIonViewWillEnter,
} from "@ionic/vue";
import { ref } from "vue";
import Header from "@/components/header.vue";
import {
  TASK_PRIORITY_NAMES,
  TASK_STATUS_NAMES,
  formatDate,
  listTaches,
  taskPriorityColor,
  taskStatusColor,
  type Tache,
} from "@/services/erp";
import { errorMessage } from "@/services/ui";

const taches = ref<Tache[]>([]);
const page = ref(1);
const lastPage = ref(1);
const total = ref(0);
const search = ref("");
const statut = ref<"active" | "finished" | "">("active");
const loading = ref(false);
const error = ref("");

const load = async (reset = true) => {
  if (reset) page.value = 1;
  loading.value = reset;
  error.value = "";
  try {
    const res = await listTaches(page.value, search.value, statut.value);
    taches.value = reset ? res.items : [...taches.value, ...res.items];
    lastPage.value = res.lastPage;
    total.value = res.total;
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};

onIonViewWillEnter(() => load());

const onSearch = (ev: CustomEvent) => {
  search.value = (ev.detail.value ?? "") as string;
  load();
};

const onStatut = (ev: CustomEvent) => {
  statut.value = ev.detail.value as typeof statut.value;
  load();
};

const loadMore = async (ev: CustomEvent) => {
  if (page.value < lastPage.value) {
    page.value++;
    await load(false);
  }
  (ev.target as HTMLIonInfiniteScrollElement).complete();
};

const refresh = async (ev: CustomEvent) => {
  await load();
  (ev.target as HTMLIonRefresherElement).complete();
};

const isLate = (t: Tache) => !!t.expiration_date && t.statut_id !== 4 && new Date(t.expiration_date) < new Date();
const statusName = (t: Tache) => t.statut?.name ?? TASK_STATUS_NAMES[t.statut_id ?? 0] ?? "—";
const priorityName = (t: Tache) => t.priority?.name ?? TASK_PRIORITY_NAMES[t.priority_id ?? 0] ?? "";
</script>

<template>
  <ion-page>
    <Header title="Tâches" back="/tabs/home" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content /></ion-refresher>

      <ion-searchbar :value="search" placeholder="Rechercher une tâche" :debounce="400" @ionInput="onSearch" />
      <ion-segment :value="statut" class="ion-padding-horizontal" @ionChange="onStatut">
        <ion-segment-button value="active"><ion-label>En cours</ion-label></ion-segment-button>
        <ion-segment-button value="finished"><ion-label>Terminées</ion-label></ion-segment-button>
        <ion-segment-button value=""><ion-label>Toutes</ion-label></ion-segment-button>
      </ion-segment>

      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>
      <p v-else-if="!taches.length" class="ion-padding ion-text-center"><ion-text color="medium">Aucune tâche</ion-text></p>

      <template v-else>
        <p class="count ion-padding-horizontal"><ion-text color="medium">{{ total }} tâche(s)</ion-text></p>
        <ion-list>
          <ion-item v-for="t in taches" :key="t.id" :router-link="`/tabs/home/erp/taches/${t.id}`" detail>
            <ion-label>
              <h3>{{ t.name }}</h3>
              <p v-if="t.description">{{ t.description }}</p>
              <div class="badges">
                <ion-badge :color="taskStatusColor(t.statut_id)">{{ statusName(t) }}</ion-badge>
                <ion-badge v-if="priorityName(t)" :color="taskPriorityColor(t.priority_id)">{{ priorityName(t) }}</ion-badge>
              </div>
            </ion-label>
            <ion-note v-if="t.expiration_date" slot="end" :color="isLate(t) ? 'danger' : undefined">
              {{ formatDate(t.expiration_date) }}
            </ion-note>
          </ion-item>
        </ion-list>
      </template>

      <ion-infinite-scroll :disabled="page >= lastPage" @ionInfinite="loadMore">
        <ion-infinite-scroll-content loading-text="Chargement…" />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.count {
  margin: 8px 0 0;
  font-size: 0.85rem;
}
.badges {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}
</style>
