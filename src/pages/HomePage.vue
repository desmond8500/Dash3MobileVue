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
  useIonRouter,
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
} from "ionicons/icons";
import Header from "@/components/header.vue";
import { currentUser } from "@/services/auth";

const router = useIonRouter();
const user = currentUser();
const greeting = [user?.firstname, user?.lastname].filter(Boolean).join(" ");

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
      { label: "Clients", icon: peopleOutline, to: "/tabs/customers" },
      { label: "Projets", icon: briefcaseOutline, note: "Bientôt" },
      { label: "Devis", icon: documentTextOutline, note: "Bientôt" },
      { label: "Tâches", icon: checkmarkCircleOutline, note: "Bientôt" },
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
    entries: [{ label: "Textes Galaxy Dimension", icon: hardwareChipOutline, to: "/tabs/home/tools/galaxy" }],
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
    <Header title="Menu" />
    <ion-content>
      <div class="ion-padding-horizontal ion-padding-top">
        <p v-if="greeting" class="greeting">Bonjour {{ greeting }}</p>
        <ion-searchbar
          placeholder="Rechercher clients, projets, devis"
          enterkeyhint="search"
          @keyup.enter="openSearch"
          @ionFocus="openSearch()"
        />
      </div>

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
          <ion-icon slot="start" :icon="entry.icon" color="secondary" aria-hidden="true" />
          <ion-label>{{ entry.label }}</ion-label>
          <ion-note v-if="entry.note" slot="end">{{ entry.note }}</ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.greeting {
  margin: 0 0 4px 4px;
  color: var(--ion-color-medium);
}
</style>
