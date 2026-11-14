<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" href="/tabs/home">
          <ion-icon aria-hidden="true" :icon="home" />
          <ion-label>Accueil</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/tabs/customers">
          <ion-icon aria-hidden="true" :icon="people" />
          <ion-label>Clients</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/tabs/quotes">
          <ion-icon aria-hidden="true" :icon="documentOutline" />
          <ion-label>Devis</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="tab4" href="/tabs/tasks">
          <ion-icon aria-hidden="true" :icon="checkmarkCircleOutline" />
          <ion-label>Taches</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="tab5" href="/tabs/items">
          <ion-icon aria-hidden="true" :icon="cube" />
          <ion-label>Articles</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="tab6" href="/tabs/galaxy">
          <ion-icon aria-hidden="true" :icon="hammer" />
          <ion-label>Galaxy</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="tab7" href="/tabs/favorites">
          <ion-icon aria-hidden="true" :icon="heartCircleSharp" />
          <ion-label>Favoris</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { home, people, hammer, cube, documentOutline, checkmarkCircleOutline, heartCircleSharp } from 'ionicons/icons';
</script>
