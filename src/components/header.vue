<script setup lang="ts">
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonMenuButton,
  IonTitle,
  IonIcon,
} from "@ionic/vue";

import { arrowBack, logOutOutline } from "ionicons/icons";
import { logout } from "@/services/api";
import { useIonRouter } from "@ionic/vue";

const router = useIonRouter();

const props = defineProps<{
  title: string;
  back?: string;
}>();

const signOut = async () => {
  await logout();
  router.replace("/login");
};

const goBack = () => {
  if (props.back) {
    router.navigate(props.back, "back", "push");
  } else {
    router.back();
  }
};
</script>

<template>
  <IonHeader>
    <IonToolbar color="secondary">
      <!-- Bouton menu -->
      <IonButtons slot="start">
        <IonMenuButton />
      </IonButtons>

      <!-- Titre -->
      <IonTitle>
        {{ title?.toUpperCase() || "TITRE PAR DÉFAUT" }}
      </IonTitle>

      <!-- Déconnexion et retour -->
      <IonButtons slot="end">
        <IonButton aria-label="Déconnexion" @click="signOut">
          <IonIcon :icon="logOutOutline" />
        </IonButton>
        <IonButton @click="goBack">
          <IonIcon :icon="arrowBack" />
        </IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
</template>