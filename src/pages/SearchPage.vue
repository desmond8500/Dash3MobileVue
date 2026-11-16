<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonSearchbar,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
  IonText,
  onIonViewDidEnter,
} from "@ionic/vue";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/header.vue";
import { globalSearch, type SearchSection } from "@/services/search";
import { withFrom } from "@/services/ui";

const route = useRoute();

const query = ref("");
/** Adresse de la recherche en cours, passée aux résultats (fil d'Ariane, retour après rechargement) */
const fromSearch = computed(() => {
  const q = query.value.trim();
  return q ? `/tabs/search?q=${encodeURIComponent(q)}` : "/tabs/search";
});
const loading = ref(false);
const searched = ref(false);
const results = ref<{ clients: SearchSection; projets: SearchSection; devis: SearchSection } | null>(null);
const searchbar = ref<InstanceType<typeof IonSearchbar> | null>(null);

let lastRun = 0;
const runSearch = async () => {
  const q = query.value.trim();
  if (q.length < 2) {
    results.value = null;
    searched.value = false;
    return;
  }
  const run = ++lastRun;
  loading.value = true;
  const res = await globalSearch(q);
  if (run !== lastRun) return; // une recherche plus récente est en cours
  results.value = res;
  searched.value = true;
  loading.value = false;
};

const onInput = (ev: CustomEvent) => {
  query.value = (ev.detail.value ?? "") as string;
  runSearch();
};

onIonViewDidEnter(() => {
  const q = route.query.q as string | undefined;
  if (q && q !== query.value) {
    query.value = q;
    runSearch();
  }
  // Focus direct sur la barre de recherche
  (searchbar.value as any)?.$el?.setFocus?.();
});

const isEmpty = () =>
  results.value &&
  !results.value.clients.items.length &&
  !results.value.projets.items.length &&
  !results.value.devis.items.length;

const formatAmount = (n: number | null | undefined) =>
  n == null ? "" : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " F";
</script>

<template>
  <ion-page>
    <Header title="Recherche" />
    <ion-content>
      <ion-searchbar
        ref="searchbar"
        :value="query"
        placeholder="Clients, projets, devis (2 lettres min.)"
        :debounce="400"
        enterkeyhint="search"
        @ionInput="onInput"
      />

      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" />
      </div>

      <template v-else-if="results">
        <p v-if="isEmpty()" class="ion-padding ion-text-center">
          <ion-text color="medium">Aucun résultat pour « {{ query }} »</ion-text>
        </p>

        <!-- Clients -->
        <ion-list v-if="results.clients.items.length || results.clients.error" inset>
          <ion-list-header>
            <ion-label>Clients</ion-label>
            <ion-note class="ion-padding-end">{{ results.clients.total }}</ion-note>
          </ion-list-header>
          <ion-item v-if="results.clients.error" lines="none">
            <ion-text color="danger">{{ results.clients.error }}</ion-text>
          </ion-item>
          <ion-item
            v-for="c in results.clients.items"
            :key="'c' + c.id"
            :router-link="withFrom(`/tabs/home/erp/projets?client_id=${c.id}&client=${encodeURIComponent(c.name)}`, fromSearch)"
            detail
          >
            <ion-label>
              <h3>{{ c.name }}</h3>
              <p>{{ c.description || c.address }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Projets -->
        <ion-list v-if="results.projets.items.length || results.projets.error" inset>
          <ion-list-header>
            <ion-label>Projets</ion-label>
            <ion-note class="ion-padding-end">{{ results.projets.total }}</ion-note>
          </ion-list-header>
          <ion-item v-if="results.projets.error" lines="none">
            <ion-text color="danger">{{ results.projets.error }}</ion-text>
          </ion-item>
          <ion-item v-for="p in results.projets.items" :key="'p' + p.id" :router-link="withFrom(`/tabs/home/erp/projets/${p.id}`, fromSearch)" detail>
            <ion-label>
              <h3>{{ p.name }}</h3>
              <p>{{ p.description }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Devis -->
        <ion-list v-if="results.devis.items.length || results.devis.error" inset>
          <ion-list-header>
            <ion-label>Devis</ion-label>
            <ion-note class="ion-padding-end">{{ results.devis.total }}</ion-note>
          </ion-list-header>
          <ion-item v-if="results.devis.error" lines="none">
            <ion-text color="danger">{{ results.devis.error }}</ion-text>
          </ion-item>
          <ion-item v-for="d in results.devis.items" :key="'d' + d.id" :router-link="withFrom(`/tabs/home/erp/devis/${d.id}`, fromSearch)" detail>
            <ion-label>
              <h3>{{ d.reference }}</h3>
              <p>{{ d.client_name }} — {{ d.projet_name }}</p>
            </ion-label>
            <ion-note slot="end">
              {{ formatAmount(d.montant) }}<br />
              <small>{{ d.statut }}</small>
            </ion-note>
          </ion-item>
        </ion-list>
      </template>

      <p v-else class="ion-padding ion-text-center">
        <ion-text color="medium">Tapez au moins 2 lettres pour chercher dans les clients, projets et devis.</ion-text>
      </p>
    </ion-content>
  </ion-page>
</template>
