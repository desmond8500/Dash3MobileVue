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
  onIonViewWillEnter,
} from "@ionic/vue";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/header.vue";
import { devisStatusColor, formatAmount, formatDate, getDevis, type DevisDetail } from "@/services/erp";
import { errorMessage } from "@/services/ui";

const route = useRoute();
const id = computed(() => route.params.id as string);

const devis = ref<DevisDetail | null>(null);
const loading = ref(true);
const error = ref("");

onIonViewWillEnter(async () => {
  loading.value = true;
  error.value = "";
  try {
    devis.value = await getDevis(id.value);
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
});

const reste = computed(() => (devis.value ? Number(devis.value.montant || 0) - Number(devis.value.acompte_total || 0) : 0));
const qty = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n);
</script>

<template>
  <ion-page>
    <Header :title="devis?.reference || 'Devis'" back="/tabs/home/erp/devis" />
    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>

      <template v-else-if="devis">
        <div class="ion-padding-horizontal">
          <h2 class="title">{{ devis.reference }}</h2>
          <ion-text color="medium">
            <p class="sub">{{ devis.client_name }}<span v-if="devis.projet_name"> · {{ devis.projet_name }}</span></p>
          </ion-text>
          <ion-badge v-if="devis.statut" :color="devisStatusColor(devis.statut)">{{ devis.statut }}</ion-badge>
        </div>

        <ion-list inset>
          <ion-item><ion-label>Montant</ion-label><ion-note slot="end" class="strong">{{ formatAmount(devis.montant) }}</ion-note></ion-item>
          <ion-item v-if="Number(devis.remise)"><ion-label>Remise</ion-label><ion-note slot="end">{{ devis.remise }}</ion-note></ion-item>
          <ion-item v-if="Number(devis.tax)"><ion-label>Taxe</ion-label><ion-note slot="end">{{ devis.tax }}</ion-note></ion-item>
          <ion-item v-if="devis.acompte_total"><ion-label>Acomptes reçus</ion-label><ion-note slot="end">{{ formatAmount(devis.acompte_total) }}</ion-note></ion-item>
          <ion-item v-if="devis.acompte_total"><ion-label>Reste à payer</ion-label><ion-note slot="end" class="strong">{{ formatAmount(reste) }}</ion-note></ion-item>
          <ion-item v-if="devis.facture_date"><ion-label>Facturé le</ion-label><ion-note slot="end">{{ formatDate(devis.facture_date) }}</ion-note></ion-item>
          <ion-item v-if="devis.paydate" lines="none"><ion-label>Payé le</ion-label><ion-note slot="end">{{ formatDate(devis.paydate) }}</ion-note></ion-item>
        </ion-list>

        <ion-list v-if="devis.description" inset>
          <ion-list-header><ion-label>Objet</ion-label></ion-list-header>
          <ion-item lines="none"><ion-label class="ion-text-wrap pre">{{ devis.description }}</ion-label></ion-item>
        </ion-list>

        <!-- Sections et lignes -->
        <ion-list v-for="s in devis.sections" :key="s.id" inset>
          <ion-list-header>
            <ion-label>{{ s.section }}</ion-label>
            <ion-note class="ion-padding-end">{{ formatAmount(s.total) }}</ion-note>
          </ion-list-header>
          <ion-item v-if="!s.rows.length" lines="none"><ion-text color="medium">Aucune ligne</ion-text></ion-item>
          <ion-item v-for="r in s.rows" :key="r.id">
            <ion-label class="ion-text-wrap">
              <h3>{{ r.designation }}</h3>
              <p>
                {{ qty(r.quantite) }} × {{ formatAmount(r.prix) }}<span v-if="r.coef && r.coef !== 1"> × {{ qty(r.coef) }}</span>
                <span v-if="r.reference"> · {{ r.reference }}</span>
              </p>
              <p v-if="r.comment"><ion-text color="medium">{{ r.comment }}</ion-text></p>
            </ion-label>
            <ion-note slot="end">{{ formatAmount(r.total) }}</ion-note>
          </ion-item>
        </ion-list>

        <ion-list v-if="devis.acomptes?.length" inset>
          <ion-list-header><ion-label>Acomptes</ion-label></ion-list-header>
          <ion-item v-for="a in devis.acomptes" :key="a.id">
            <ion-label>
              <h3>{{ a.name || "Acompte" }}</h3>
              <p v-if="a.date">{{ formatDate(a.date) }}</p>
            </ion-label>
            <ion-note slot="end">{{ formatAmount(a.montant) }}</ion-note>
          </ion-item>
        </ion-list>

        <ion-list v-if="devis.modalite || devis.note" inset>
          <ion-list-header><ion-label>Conditions et notes</ion-label></ion-list-header>
          <ion-item v-if="devis.modalite"><ion-label class="ion-text-wrap pre">{{ devis.modalite }}</ion-label></ion-item>
          <ion-item v-if="devis.note" lines="none"><ion-label class="ion-text-wrap pre">{{ devis.note }}</ion-label></ion-item>
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
  margin: 4px 0 6px;
}
.strong {
  font-weight: 600;
  color: var(--ion-text-color);
}
.pre {
  white-space: pre-line;
}
</style>
