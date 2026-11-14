<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonIcon,
  useIonRouter,
} from "@ionic/vue";
import { logOutOutline } from "ionicons/icons";
import { ref } from "vue";
import Header from "@/components/header.vue";
import { currentUser } from "@/services/auth";
import { logout } from "@/services/api";
import { API_URL, APP_VERSION, getTheme, setTheme, type ThemeMode } from "@/services/settings";
import { confirmAction } from "@/services/ui";

const router = useIonRouter();
const user = currentUser();
const name = [user?.firstname, user?.lastname].filter(Boolean).join(" ");
const theme = ref<ThemeMode>(getTheme());

const onTheme = (ev: CustomEvent) => {
  theme.value = ev.detail.value as ThemeMode;
  setTheme(theme.value);
};

const signOut = async () => {
  if (!(await confirmAction("Déconnexion", "Voulez-vous vous déconnecter de cet appareil ?", "Se déconnecter"))) return;
  await logout();
  router.replace("/login");
};
</script>

<template>
  <ion-page>
    <Header title="Paramètres" />
    <ion-content>
      <ion-list inset>
        <ion-list-header><ion-label>Compte</ion-label></ion-list-header>
        <ion-item>
          <ion-label>
            <h3>{{ name || "—" }}</h3>
            <p>{{ user?.email }}</p>
          </ion-label>
          <ion-note v-if="user?.function" slot="end">{{ user.function }}</ion-note>
        </ion-item>
      </ion-list>

      <ion-list inset>
        <ion-list-header><ion-label>Affichage</ion-label></ion-list-header>
        <ion-item>
          <ion-select label="Thème" :value="theme" interface="action-sheet" cancel-text="Annuler" @ionChange="onTheme">
            <ion-select-option value="system">Comme le système</ion-select-option>
            <ion-select-option value="light">Clair</ion-select-option>
            <ion-select-option value="dark">Sombre</ion-select-option>
          </ion-select>
        </ion-item>
      </ion-list>

      <ion-list inset>
        <ion-list-header><ion-label>Application</ion-label></ion-list-header>
        <ion-item>
          <ion-label>Serveur</ion-label>
          <ion-note slot="end" class="server">{{ API_URL }}</ion-note>
        </ion-item>
        <ion-item>
          <ion-label>Version</ion-label>
          <ion-note slot="end">{{ APP_VERSION }}</ion-note>
        </ion-item>
      </ion-list>

      <ion-list inset>
        <ion-item button :detail="false" @click="signOut">
          <ion-icon slot="start" :icon="logOutOutline" color="danger" aria-hidden="true" />
          <ion-label color="danger">Se déconnecter</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.server {
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
