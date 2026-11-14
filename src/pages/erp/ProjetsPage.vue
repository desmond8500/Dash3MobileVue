<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonIcon,
  IonSpinner,
  IonText,
  IonChip,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  onIonViewWillEnter,
  useIonRouter,
} from "@ionic/vue";
import { star, closeCircle } from "ionicons/icons";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/header.vue";
import { formatDate, listProjets, type Projet } from "@/services/erp";
import { errorMessage } from "@/services/ui";

const route = useRoute();
const router = useIonRouter();
const clientId = computed(() => (route.query.client_id as string | undefined) || "");
const clientName = computed(() => (route.query.client as string | undefined) || "");

const projets = ref<Projet[]>([]);
const page = ref(1);
const lastPage = ref(1);
const total = ref(0);
const search = ref("");
const loading = ref(false);
const error = ref("");

const load = async (reset = true) => {
  if (reset) page.value = 1;
  loading.value = reset;
  error.value = "";
  try {
    const res = await listProjets(page.value, search.value, clientId.value);
    projets.value = reset ? res.items : [...projets.value, ...res.items];
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

// Le filtre client vient de l'URL (?client_id=) : on recharge quand il change
watch(clientId, () => load());

const clearClient = () => router.replace("/tabs/home/erp/projets");
</script>

<template>
  <ion-page>
    <Header title="Projets" back="/tabs/home" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content /></ion-refresher>

      <ion-searchbar :value="search" placeholder="Rechercher un projet" :debounce="400" @ionInput="onSearch" />

      <div v-if="clientId" class="ion-padding-horizontal">
        <ion-chip @click="clearClient">
          <ion-label>Client : {{ clientName || "#" + clientId }}</ion-label>
          <ion-icon :icon="closeCircle" />
        </ion-chip>
      </div>

      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>
      <p v-else-if="!projets.length" class="ion-padding ion-text-center"><ion-text color="medium">Aucun projet</ion-text></p>

      <template v-else>
        <p class="count ion-padding-horizontal"><ion-text color="medium">{{ total }} projet(s)</ion-text></p>
        <ion-list>
          <ion-item v-for="p in projets" :key="p.id" :router-link="`/tabs/home/erp/projets/${p.id}`" detail>
            <ion-label>
              <h3>
                {{ p.name }}
                <ion-icon v-if="p.favorite" :icon="star" color="warning" class="fav" aria-label="Favori" />
              </h3>
              <p v-if="p.description">{{ p.description }}</p>
            </ion-label>
            <ion-note v-if="p.start_date" slot="end">{{ formatDate(p.start_date) }}</ion-note>
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
  margin: 0;
  font-size: 0.85rem;
}
.fav {
  vertical-align: -2px;
}
</style>
