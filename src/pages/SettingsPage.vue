<script setup lang="ts">
/** Page Profil, d'après l'écran « Profile » du design : avatar rond, nom, e-mail, menu à icônes. */
import { IonPage, IonContent, IonIcon, IonSelect, IonSelectOption, useIonRouter } from "@ionic/vue";
import {
  personOutline,
  colorPaletteOutline,
  serverOutline,
  informationCircleOutline,
  logOutOutline,
  chevronForward,
  chevronDown,
} from "ionicons/icons";
import { ref } from "vue";
import { currentUser } from "@/services/auth";
import { logout } from "@/services/api";
import { API_URL, APP_VERSION, getTheme, setTheme, type ThemeMode } from "@/services/settings";
import { confirmAction } from "@/services/ui";

const router = useIonRouter();
const user = currentUser();
const name = [user?.firstname, user?.lastname].filter(Boolean).join(" ") || "—";
const initials =
  [user?.firstname, user?.lastname]
    .filter(Boolean)
    .map((s: string) => s[0]?.toUpperCase())
    .join("") || "D3";

const theme = ref<ThemeMode>(getTheme());
const themeLabels: Record<ThemeMode, string> = { system: "Comme le système", light: "Clair", dark: "Sombre" };
const onTheme = (ev: CustomEvent) => {
  theme.value = ev.detail.value as ThemeMode;
  setTheme(theme.value);
};

const showDetails = ref(false);
const themeSelect = ref<InstanceType<typeof IonSelect> | null>(null);
const openTheme = () => (themeSelect.value as any)?.$el?.open?.();

const signOut = async () => {
  if (!(await confirmAction("Déconnexion", "Voulez-vous vous déconnecter de cet appareil ?", "Se déconnecter"))) return;
  await logout();
  router.replace("/login");
};
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true" class="profile-content">
      <div class="top">
        <div class="top-title">Profil</div>
      </div>

      <div class="sheet">
        <div class="avatar" :style="user?.avatar ? { backgroundImage: `url(${user.avatar})` } : undefined">
          <span v-if="!user?.avatar">{{ initials }}</span>
        </div>
        <h2 class="name">{{ name }}</h2>
        <p class="email">{{ user?.email }}</p>

        <nav class="menu">
          <!-- Informations du compte -->
          <button class="row" @click="showDetails = !showDetails">
            <ion-icon :icon="personOutline" class="icon" />
            <span class="label">Informations</span>
            <ion-icon :icon="showDetails ? chevronDown : chevronForward" class="chev" />
          </button>
          <div v-if="showDetails" class="details">
            <div><span>Prénom</span><b>{{ user?.firstname || "—" }}</b></div>
            <div><span>Nom</span><b>{{ user?.lastname || "—" }}</b></div>
            <div><span>Fonction</span><b>{{ user?.function || "—" }}</b></div>
            <div><span>E-mail</span><b>{{ user?.email || "—" }}</b></div>
          </div>

          <!-- Thème -->
          <button class="row" @click="openTheme">
            <ion-icon :icon="colorPaletteOutline" class="icon" />
            <span class="label">Thème</span>
            <span class="value">{{ themeLabels[theme] }}</span>
            <ion-icon :icon="chevronForward" class="chev" />
          </button>
          <ion-select
            ref="themeSelect"
            class="hidden-select"
            :value="theme"
            interface="action-sheet"
            cancel-text="Annuler"
            aria-label="Thème"
            @ionChange="onTheme"
          >
            <ion-select-option value="system">Comme le système</ion-select-option>
            <ion-select-option value="light">Clair</ion-select-option>
            <ion-select-option value="dark">Sombre</ion-select-option>
          </ion-select>

          <div class="row static">
            <ion-icon :icon="serverOutline" class="icon" />
            <span class="label">Serveur</span>
            <span class="value server">{{ API_URL }}</span>
          </div>

          <div class="row static">
            <ion-icon :icon="informationCircleOutline" class="icon" />
            <span class="label">Version</span>
            <span class="value">{{ APP_VERSION }}</span>
          </div>

          <button class="row logout" @click="signOut">
            <ion-icon :icon="logOutOutline" class="icon" />
            <span class="label">Déconnexion</span>
          </button>
        </nav>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.profile-content {
  --background: var(--dash-header);
}
.top {
  padding: calc(var(--ion-safe-area-top, 0px) + 18px) 20px 70px;
  color: #ffffff;
  text-align: center;
}
.top-title {
  font-weight: 700;
  font-size: 1.05rem;
}
.sheet {
  background: var(--dash-sheet);
  border-radius: 26px 26px 0 0;
  min-height: calc(100% - 110px);
  padding: 0 22px 30px;
  text-align: center;
}
.avatar {
  width: 112px;
  height: 112px;
  margin: -56px auto 0;
  border-radius: 50%;
  border: 5px solid var(--dash-sheet);
  background: var(--dash-soft) center / cover no-repeat;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 800;
  color: var(--ion-color-primary);
}
.name {
  margin: 12px 0 2px;
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--dash-text);
}
.email {
  margin: 0 0 26px;
  color: var(--dash-muted);
  font-size: 0.9rem;
}
.menu {
  text-align: left;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 4px;
  background: none;
  border: 0;
  border-bottom: 1px solid var(--dash-line);
  color: var(--dash-text);
  font: inherit;
  font-size: 0.95rem;
  text-align: left;
}
.row.static {
  cursor: default;
}
.icon {
  font-size: 20px;
  color: var(--dash-muted);
  flex: 0 0 auto;
}
.label {
  flex: 1;
}
.value {
  color: var(--dash-muted);
  font-size: 0.85rem;
}
.server {
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chev {
  color: var(--dash-muted);
  font-size: 16px;
}
.logout,
.logout .icon {
  color: var(--ion-color-danger);
  border-bottom: 0;
}
.details {
  background: var(--dash-soft);
  border-radius: 12px;
  margin: 8px 0;
  padding: 6px 14px;
}
.details div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  font-size: 0.88rem;
}
.details span {
  color: var(--dash-muted);
}
.hidden-select {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
</style>
