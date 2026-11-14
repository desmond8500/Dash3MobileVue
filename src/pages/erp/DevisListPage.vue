<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonSearchbar,
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
import { devisStatusColor, formatAmount, listDevis, type Devis } from "@/services/erp";
import { errorMessage } from "@/services/ui";

const devis = ref<Devis[]>([]);
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
    const res = await listDevis(page.value, search.value);
    devis.value = reset ? res.items : [...devis.value, ...res.items];
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
</script>

<template>
  <ion-page>
    <Header title="Devis" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content /></ion-refresher>

      <ion-searchbar :value="search" placeholder="Référence, client, projet" :debounce="400" @ionInput="onSearch" />

      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>
      <p v-else-if="!devis.length" class="ion-padding ion-text-center"><ion-text color="medium">Aucun devis</ion-text></p>

      <template v-else>
        <p class="count ion-padding-horizontal"><ion-text color="medium">{{ total }} devis</ion-text></p>
        <ion-list>
          <ion-item v-for="d in devis" :key="d.id" :router-link="`/tabs/home/erp/devis/${d.id}`" detail>
            <ion-label>
              <h3>{{ d.reference }}</h3>
              <p>{{ d.client_name }}<span v-if="d.projet_name"> · {{ d.projet_name }}</span></p>
              <ion-badge v-if="d.statut" :color="devisStatusColor(d.statut)">{{ d.statut }}</ion-badge>
            </ion-label>
            <ion-note slot="end" class="amount">{{ formatAmount(d.montant) }}</ion-note>
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
.amount {
  font-weight: 600;
}
</style>
