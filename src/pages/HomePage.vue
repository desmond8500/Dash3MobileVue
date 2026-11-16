<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonIcon,
  IonNote,
  IonSearchbar,
  IonSpinner,
  useIonRouter,
  onIonViewWillEnter,
} from "@ionic/vue";
import {
  peopleOutline,
  briefcaseOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  cubeOutline,
  businessOutline,
  pricetagOutline,
  hardwareChipOutline,
  calendarOutline,
} from "ionicons/icons";
import { computed, ref } from "vue";
import Header from "@/components/header.vue";
import { listTaches } from "@/services/erp";

const router = useIonRouter();

// ---------- Statistiques des tâches (carte « Order Statistics » du design) ----------
const stats = ref<{ active: number; finished: number } | null>(null);
const statsError = ref(false);

onIonViewWillEnter(async () => {
  statsError.value = false;
  try {
    const [active, finished] = await Promise.all([listTaches(1, "", "active"), listTaches(1, "", "finished")]);
    stats.value = { active: active.total, finished: finished.total };
  } catch {
    statsError.value = true;
  }
});

const total = computed(() => (stats.value ? stats.value.active + stats.value.finished : 0));
// Anneau : circonférence d'un cercle de rayon 42
const CIRC = 2 * Math.PI * 42;
const finishedArc = computed(() => (total.value ? (stats.value!.finished / total.value) * CIRC : 0));
const activeArc = computed(() => (total.value ? (stats.value!.active / total.value) * CIRC : 0));
const pct = (n: number) => (total.value ? Math.round((n / total.value) * 100) : 0);

interface MenuEntry {
  label: string;
  icon: string;
  to?: string;
  note?: string;
}

const sections: { title: string; entries: MenuEntry[] }[] = [
  {
    title: "ERP",
    entries: [
      { label: "Clients", icon: peopleOutline, to: "/tabs/home/erp/clients" },
      { label: "Projets", icon: briefcaseOutline, to: "/tabs/home/erp/projets" },
      { label: "Devis", icon: documentTextOutline, to: "/tabs/home/erp/devis" },
      { label: "Tâches", icon: checkmarkCircleOutline, to: "/tabs/home/erp/taches" },
      { label: "Planning de la semaine", icon: calendarOutline, to: "/tabs/planning" },
    ],
  },
  {
    title: "Stock",
    entries: [
      { label: "Articles", icon: cubeOutline, to: "/tabs/home/stock/articles" },
      { label: "Fournisseurs", icon: businessOutline, to: "/tabs/home/stock/providers" },
      { label: "Marques", icon: pricetagOutline, to: "/tabs/home/stock/brands" },
    ],
  },
  {
    title: "Outils",
    entries: [{ label: "Nomenclature Galaxy", icon: hardwareChipOutline, to: "/tabs/home/tools/galaxy" }],
  },
];

// La barre de recherche du menu ouvre la page Recherche
const openSearch = (ev?: Event) => {
  const value = (ev?.target as HTMLIonSearchbarElement | undefined)?.value ?? "";
  router.push({ path: "/tabs/search", query: value ? { q: value } : {} });
};
</script>

<template>
  <ion-page>
    <Header title="Tableau de bord" />
    <ion-content>
      <div class="ion-padding-horizontal">
        <ion-searchbar
          class="home-search"
          placeholder="Rechercher clients, projets, devis…"
          enterkeyhint="search"
          @keyup.enter="openSearch"
          @ionFocus="openSearch()"
        />
      </div>

      <!-- Statistiques des tâches -->
      <section class="stats dash-card">
        <div class="stats-head">
          <h3 class="dash-title">Statistiques des tâches</h3>
          <button class="link" @click="router.push('/tabs/home/erp/taches')">Voir</button>
        </div>

        <div v-if="!stats && !statsError" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
        <p v-else-if="statsError" class="muted">Statistiques indisponibles.</p>

        <div v-else class="stats-body">
          <svg viewBox="0 0 100 100" class="donut" role="img" :aria-label="`${total} tâches`">
            <circle cx="50" cy="50" r="42" class="track" />
            <circle
              cx="50"
              cy="50"
              r="42"
              class="arc finished"
              :stroke-dasharray="`${finishedArc} ${CIRC}`"
              transform="rotate(-90 50 50)"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              class="arc active"
              :stroke-dasharray="`${activeArc} ${CIRC}`"
              :stroke-dashoffset="-finishedArc"
              transform="rotate(-90 50 50)"
            />
            <text x="50" y="49" class="donut-total">{{ total }}</text>
            <text x="50" y="62" class="donut-label">Tâches</text>
          </svg>

          <ul class="legend">
            <li>
              <span class="dot active"></span>
              <div><b>{{ stats!.active }}</b><small>En cours · {{ pct(stats!.active) }} %</small></div>
            </li>
            <li>
              <span class="dot finished"></span>
              <div><b>{{ stats!.finished }}</b><small>Terminées · {{ pct(stats!.finished) }} %</small></div>
            </li>
          </ul>
        </div>
      </section>

      <!-- Accès rapides -->
      <ion-list v-for="section in sections" :key="section.title" inset>
        <ion-list-header>
          <ion-label>{{ section.title }}</ion-label>
        </ion-list-header>
        <ion-item
          v-for="entry in section.entries"
          :key="entry.label"
          :router-link="entry.to"
          :detail="!!entry.to"
          :disabled="!entry.to"
          :button="!!entry.to"
        >
          <span slot="start" class="icon-chip"><ion-icon :icon="entry.icon" aria-hidden="true" /></span>
          <ion-label>{{ entry.label }}</ion-label>
          <ion-note v-if="entry.note" slot="end">{{ entry.note }}</ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.home-search {
  padding: 4px 0 0;
}
.stats {
  margin: 8px 16px 4px;
  padding: 14px 16px 16px;
}
.stats-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.link {
  background: none;
  border: 0;
  color: var(--dash-muted);
  font: inherit;
  font-size: 0.8rem;
}
.muted {
  color: var(--dash-muted);
}
.stats-body {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 10px;
}
.donut {
  width: 132px;
  height: 132px;
  flex: 0 0 auto;
}
.track {
  fill: none;
  stroke: var(--dash-soft);
  stroke-width: 11;
}
.arc {
  fill: none;
  stroke-width: 11;
  stroke-linecap: butt;
  transition: stroke-dasharray 0.6s ease;
}
.arc.finished {
  stroke: var(--ion-color-success);
}
.arc.active {
  stroke: var(--ion-color-primary);
}
.donut-total {
  text-anchor: middle;
  font-size: 18px;
  font-weight: 800;
  fill: var(--dash-text);
}
.donut-label {
  text-anchor: middle;
  font-size: 8px;
  fill: var(--dash-muted);
}
.legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}
.legend li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.legend b {
  display: block;
  font-size: 1.1rem;
  color: var(--dash-text);
  line-height: 1.1;
}
.legend small {
  color: var(--dash-muted);
  font-size: 0.75rem;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
}
.dot.active {
  background: var(--ion-color-primary);
}
.dot.finished {
  background: var(--ion-color-success);
}
.icon-chip {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--ion-color-primary-rgb), 0.12);
  color: var(--ion-color-primary);
  font-size: 18px;
}
</style>
