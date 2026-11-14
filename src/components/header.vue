<script setup lang="ts">
/**
 * En-tête d'après le design Dash3 :
 *  - page principale (sans `back`) : avatar, « Bon retour 👋 », nom, boutons ronds
 *    Recherche et Menu ; le titre de la page s'affiche en tête de la feuille blanche ;
 *  - page de détail (avec `back`) : bouton retour rond et titre centré.
 * La feuille blanche aux coins arrondis commence sous la barre bleu canard.
 */
import { IonHeader, IonToolbar, IonIcon, useIonRouter } from "@ionic/vue";
import { chevronBack, searchOutline, gridOutline } from "ionicons/icons";
import { computed } from "vue";
import { currentUser } from "@/services/auth";

const router = useIonRouter();

const props = defineProps<{
  title: string;
  /** Lien de retour ; présent = page de détail */
  back?: string;
  /** Force le mode détail (bouton retour) même sans lien */
  detail?: boolean;
}>();

const user = currentUser();
const firstName = computed(() => user?.firstname || user?.lastname || user?.email?.split("@")[0] || "");
const initials = computed(() =>
  [user?.firstname, user?.lastname]
    .filter(Boolean)
    .map((s: string) => s[0]?.toUpperCase())
    .join("") || "D3"
);

const isDetail = computed(() => !!props.back || !!props.detail);

const goBack = () => {
  if (props.back) {
    router.navigate(props.back, "back", "push");
  } else {
    router.back();
  }
};
</script>

<template>
  <IonHeader class="dash-header ion-no-border">
    <IonToolbar class="dash-toolbar">
      <!-- Page de détail : retour + titre centré -->
      <div v-if="isDetail" class="bar detail">
        <button class="round" aria-label="Retour" @click="goBack"><IonIcon :icon="chevronBack" /></button>
        <div class="center-title">{{ title }}</div>
        <button class="round" aria-label="Recherche" @click="router.push('/tabs/search')"><IonIcon :icon="searchOutline" /></button>
      </div>

      <!-- Page principale : bienvenue -->
      <div v-else class="bar">
        <div class="avatar" :style="user?.avatar ? { backgroundImage: `url(${user.avatar})` } : undefined">
          <span v-if="!user?.avatar">{{ initials }}</span>
        </div>
        <div class="welcome">
          <div class="hello">Bon retour 👋</div>
          <div class="name">{{ firstName }}</div>
        </div>
        <button class="round" aria-label="Recherche" @click="router.push('/tabs/search')"><IonIcon :icon="searchOutline" /></button>
        <button class="round" aria-label="Menu" @click="router.navigate('/tabs/home', 'root', 'replace')"><IonIcon :icon="gridOutline" /></button>
      </div>
    </IonToolbar>

    <!-- Haut de la feuille blanche (avec le titre sur les pages principales) -->
    <div class="sheet-top">
      <div class="sheet">
        <h2 v-if="!isDetail" class="dash-title">{{ title }}</h2>
      </div>
    </div>
  </IonHeader>
</template>

<style scoped>
.dash-header {
  background: var(--dash-header);
}
.dash-toolbar {
  --background: var(--dash-header);
  --color: #ffffff;
  --border-width: 0;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 6px;
  --padding-bottom: 6px;
}
.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
}
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25) center / cover no-repeat;
  border: 2px solid rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.8rem;
  flex: 0 0 auto;
}
.welcome {
  flex: 1;
  min-width: 0;
  line-height: 1.15;
}
.hello {
  font-size: 0.75rem;
  opacity: 0.9;
}
.name {
  font-weight: 800;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.round {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 0;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex: 0 0 auto;
}
.round:active {
  background: rgba(255, 255, 255, 0.35);
}
.center-title {
  flex: 1;
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sheet-top {
  background: var(--dash-header);
}
.sheet {
  background: var(--dash-sheet);
  border-radius: 22px 22px 0 0;
  padding: 18px 20px 4px;
  min-height: 22px;
}
.sheet:empty {
  padding: 0;
}
</style>
