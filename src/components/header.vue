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

import { arrowBack } from "ionicons/icons";
import { useIonRouter } from "@ionic/vue";

const router = useIonRouter();

const props = defineProps<{
  title: string;
  back?: string;
}>();

const goBack = () => {
  if (props.back) {
    router.push(props.back, "back");
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

      <!-- Bouton retour -->
      <IonButtons slot="end">
        <IonButton @click="goBack">
          <IonIcon :icon="arrowBack" />
        </IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
</template>