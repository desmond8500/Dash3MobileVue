<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonText,
  IonInputPasswordToggle,
  useIonRouter,
} from "@ionic/vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import { login } from "@/services/api";
import { setSession } from "@/services/auth";

const router = useIonRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const submit = async () => {
  if (!email.value || !password.value) return;
  loading.value = true;
  error.value = "";

  try {
    const data = await login(email.value.trim(), password.value);
    setSession(data.token, data.user);
    const redirect = (route.query.redirect as string) || "/tabs/home";
    router.replace(redirect);
  } catch (err: any) {
    if (err.response?.status === 429) {
      error.value = "Trop de tentatives, réessayez dans une minute.";
    } else {
      error.value = err.response?.data?.message ?? "Connexion impossible";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="secondary">
        <ion-title>DASH3</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form @submit.prevent="submit">
        <ion-list>
          <ion-item>
            <ion-input
              v-model="email"
              type="email"
              label="E-mail"
              label-placement="stacked"
              autocomplete="username"
              inputmode="email"
              required
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-input
              v-model="password"
              type="password"
              label="Mot de passe"
              label-placement="stacked"
              autocomplete="current-password"
              required
              @keydown.enter="submit"
            >
              <ion-input-password-toggle slot="end"></ion-input-password-toggle>
            </ion-input>
          </ion-item>
        </ion-list>

        <ion-text v-if="error" color="danger">
          <p class="ion-padding-start">{{ error }}</p>
        </ion-text>

        <ion-button expand="block" type="submit" class="ion-margin-top" :disabled="loading || !email || !password">
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
          <span v-else>Se connecter</span>
        </ion-button>
      </form>
    </ion-content>
  </ion-page>
</template>
