<script setup lang="ts">
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import { heartOutline } from "ionicons/icons";
import Header from "@/components/header.vue";
</script>

<template>
  <ion-page>
    <Header title="Favoris" />
    <ion-content>
      <div class="empty">
        <span class="icon"><ion-icon :icon="heartOutline" aria-hidden="true" /></span>
        <h3>Bientôt disponible</h3>
        <p>Vos clients et projets favoris s'afficheront ici.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.empty {
  text-align: center;
  padding: 48px 32px;
  color: var(--dash-muted);
}
.icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--ion-color-primary);
  background: rgba(var(--ion-color-primary-rgb), 0.12);
}
h3 {
  margin: 0 0 4px;
  color: var(--dash-text);
  font-weight: 800;
}
p {
  margin: 0;
  font-size: 0.9rem;
}
</style>
