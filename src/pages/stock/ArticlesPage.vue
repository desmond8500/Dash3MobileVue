<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonNote,
  IonBadge,
  IonSpinner,
  IonText,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  onIonViewWillEnter,
} from "@ionic/vue";
import { add } from "ionicons/icons";
import { ref } from "vue";
import Header from "@/components/header.vue";
import { listArticles, type Article } from "@/services/stock";
import { errorMessage } from "@/services/ui";

const articles = ref<Article[]>([]);
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
    const res = await listArticles(page.value, search.value);
    articles.value = reset ? res.items : [...articles.value, ...res.items];
    lastPage.value = res.lastPage;
    total.value = res.total;
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};

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

// Recharge à chaque retour sur la page (après un ajout ou une modification)
onIonViewWillEnter(() => load());

const lowStock = (a: Article) => (a.quantity ?? 0) <= (a.quantity_min ?? 0) && (a.quantity_min ?? 0) > 0;
const formatPrice = (n: number | null) =>
  n == null ? "" : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " F";
</script>

<template>
  <ion-page>
    <Header title="Articles" back="/tabs/home" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-searchbar :value="search" placeholder="Désignation ou référence" :debounce="400" @ionInput="onSearch" />

      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>
      <p v-else-if="!articles.length" class="ion-padding ion-text-center"><ion-text color="medium">Aucun article</ion-text></p>

      <template v-else>
        <p class="count ion-padding-horizontal"><ion-text color="medium">{{ total }} article(s)</ion-text></p>
        <ion-list>
          <ion-item v-for="a in articles" :key="a.id" :router-link="`/tabs/home/stock/articles/${a.id}`" detail>
            <ion-thumbnail slot="start"><img :src="a.image" alt="" loading="lazy" /></ion-thumbnail>
            <ion-label>
              <h3>{{ a.designation }}</h3>
              <p>{{ a.reference }}<span v-if="a.brand_name"> · {{ a.brand_name }}</span></p>
              <p v-if="a.price">{{ formatPrice(a.price) }}</p>
            </ion-label>
            <div slot="end" class="ion-text-end">
              <ion-badge :color="lowStock(a) ? 'danger' : 'medium'">{{ a.quantity ?? 0 }}</ion-badge>
              <ion-note v-if="a.priority" class="priority">{{ a.priority }}</ion-note>
            </div>
          </ion-item>
        </ion-list>
      </template>

      <ion-infinite-scroll :disabled="page >= lastPage" @ionInfinite="loadMore">
        <ion-infinite-scroll-content loading-text="Chargement…" />
      </ion-infinite-scroll>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button router-link="/tabs/home/stock/articles/new" aria-label="Nouvel article">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.count {
  margin: 0;
  font-size: 0.85rem;
}
.priority {
  display: block;
  margin-top: 4px;
  font-size: 0.75rem;
}
</style>
