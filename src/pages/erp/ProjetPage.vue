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
  IonSpinner,
  IonText,
  IonSegment,
  IonSegmentButton,
  onIonViewWillEnter,
} from "@ionic/vue";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/header.vue";
import {
  TASK_STATUS_NAMES,
  devisStatusColor,
  formatDate,
  getProjet,
  taskStatusColor,
  type ProjetDetail,
} from "@/services/erp";
import { errorMessage } from "@/services/ui";

const route = useRoute();
const id = computed(() => route.params.id as string);

const projet = ref<ProjetDetail | null>(null);
const loading = ref(true);
const error = ref("");
const tab = ref<"devis" | "taches" | "contacts" | "journal">("devis");

onIonViewWillEnter(async () => {
  loading.value = true;
  error.value = "";
  try {
    projet.value = await getProjet(id.value);
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
});

const counts = computed(() => ({
  devis: projet.value?.invoices?.length ?? 0,
  taches: projet.value?.tasks?.length ?? 0,
  contacts: projet.value?.contacts?.length ?? 0,
  journal: projet.value?.journals?.length ?? 0,
}));

const contactName = (c: ProjetDetail["contacts"][number]) => [c.firstname, c.lastname].filter(Boolean).join(" ") || c.societe || "—";
</script>

<template>
  <ion-page>
    <Header :title="projet?.name || 'Projet'" back="/tabs/home/erp/projets" />
    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>

      <template v-else-if="projet">
        <div class="ion-padding-horizontal">
          <h2 class="title">{{ projet.name }}</h2>
          <ion-text color="medium"><p class="sub">{{ projet.client_name }}</p></ion-text>
        </div>

        <ion-list inset>
          <ion-item><ion-label>Début</ion-label><ion-note slot="end">{{ formatDate(projet.start_date) }}</ion-note></ion-item>
          <ion-item><ion-label>Fin</ion-label><ion-note slot="end">{{ formatDate(projet.end_date) }}</ion-note></ion-item>
          <ion-item v-if="projet.buildings?.length" lines="none">
            <ion-label>Bâtiments</ion-label>
            <ion-note slot="end">{{ projet.buildings.map((b) => b.name).join(", ") }}</ion-note>
          </ion-item>
        </ion-list>

        <ion-list v-if="projet.description" inset>
          <ion-list-header><ion-label>Description</ion-label></ion-list-header>
          <ion-item lines="none"><ion-label class="ion-text-wrap pre">{{ projet.description }}</ion-label></ion-item>
        </ion-list>

        <ion-segment :value="tab" scrollable class="ion-padding-horizontal" @ionChange="tab = $event.detail.value as any">
          <ion-segment-button value="devis"><ion-label>Devis ({{ counts.devis }})</ion-label></ion-segment-button>
          <ion-segment-button value="taches"><ion-label>Tâches ({{ counts.taches }})</ion-label></ion-segment-button>
          <ion-segment-button value="contacts"><ion-label>Contacts ({{ counts.contacts }})</ion-label></ion-segment-button>
          <ion-segment-button value="journal"><ion-label>Journal ({{ counts.journal }})</ion-label></ion-segment-button>
        </ion-segment>

        <!-- Devis -->
        <ion-list v-if="tab === 'devis'" inset>
          <ion-item v-if="!counts.devis" lines="none"><ion-text color="medium">Aucun devis</ion-text></ion-item>
          <ion-item v-for="d in projet.invoices" :key="d.id" :router-link="`/tabs/home/erp/devis/${d.id}`" detail>
            <ion-label>
              <h3>{{ d.reference }}</h3>
              <p v-if="d.description">{{ d.description }}</p>
            </ion-label>
            <ion-badge v-if="d.statut" slot="end" :color="devisStatusColor(d.statut)">{{ d.statut }}</ion-badge>
          </ion-item>
        </ion-list>

        <!-- Tâches -->
        <ion-list v-if="tab === 'taches'" inset>
          <ion-item v-if="!counts.taches" lines="none"><ion-text color="medium">Aucune tâche</ion-text></ion-item>
          <ion-item v-for="t in projet.tasks" :key="t.id" :router-link="`/tabs/home/erp/taches/${t.id}`" detail>
            <ion-label>
              <h3>{{ t.name }}</h3>
              <p v-if="t.expiration_date">Échéance : {{ formatDate(t.expiration_date) }}</p>
            </ion-label>
            <ion-badge slot="end" :color="taskStatusColor(t.statut_id)">{{ TASK_STATUS_NAMES[t.statut_id ?? 0] ?? "—" }}</ion-badge>
          </ion-item>
        </ion-list>

        <!-- Contacts -->
        <ion-list v-if="tab === 'contacts'" inset>
          <ion-item v-if="!counts.contacts" lines="none"><ion-text color="medium">Aucun contact</ion-text></ion-item>
          <ion-item v-for="c in projet.contacts" :key="c.id" :href="c.phone ? `tel:${c.phone}` : c.email ? `mailto:${c.email}` : undefined" :detail="!!(c.phone || c.email)">
            <ion-label>
              <h3>{{ contactName(c) }}</h3>
              <p v-if="c.fonction || c.societe">{{ [c.fonction, c.societe].filter(Boolean).join(" · ") }}</p>
              <p v-if="c.phone || c.email">{{ [c.phone, c.email].filter(Boolean).join(" · ") }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Journal -->
        <ion-list v-if="tab === 'journal'" inset>
          <ion-item v-if="!counts.journal" lines="none"><ion-text color="medium">Aucune entrée</ion-text></ion-item>
          <ion-item v-for="j in projet.journals" :key="j.id">
            <ion-label class="ion-text-wrap">
              <h3>{{ j.title || "—" }}</h3>
              <p v-if="j.description">{{ j.description }}</p>
            </ion-label>
            <ion-note slot="end">{{ formatDate(j.date) }}</ion-note>
          </ion-item>
        </ion-list>
      </template>
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
</style>
