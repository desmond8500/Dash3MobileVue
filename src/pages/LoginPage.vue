<script setup lang="ts">
import {
  IonPage,
  IonContent,
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
    <ion-content :fullscreen="true" class="login-content">
      <div class="top">
        <div class="logo" aria-hidden="true">D3</div>
        <h1>Dash3</h1>
        <p>Bon retour 👋 Connectez-vous pour continuer.</p>
      </div>

      <div class="sheet">
        <h2 class="dash-title">Connexion</h2>

        <form @submit.prevent="submit">
          <label class="field">
            <span>E-mail</span>
            <ion-input
              v-model="email"
              type="email"
              aria-label="E-mail"
              placeholder="vous@exemple.com"
              autocomplete="username"
              inputmode="email"
              class="input"
              required
            ></ion-input>
          </label>

          <label class="field">
            <span>Mot de passe</span>
            <ion-input
              v-model="password"
              type="password"
              aria-label="Mot de passe"
              placeholder="Votre mot de passe"
              autocomplete="current-password"
              class="input"
              required
              @keydown.enter="submit"
            >
              <ion-input-password-toggle slot="end"></ion-input-password-toggle>
            </ion-input>
          </label>

          <ion-text v-if="error" color="danger">
            <p class="error">{{ error }}</p>
          </ion-text>

          <ion-button expand="block" type="submit" class="submit" :disabled="loading || !email || !password">
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>Se connecter</span>
          </ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.login-content {
  --background: var(--dash-header);
}
.top {
  padding: calc(var(--ion-safe-area-top, 0px) + 56px) 28px 40px;
  color: #ffffff;
  text-align: center;
}
.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.4rem;
}
.top h1 {
  margin: 0;
  font-weight: 800;
  font-size: 1.8rem;
}
.top p {
  margin: 6px 0 0;
  opacity: 0.9;
  font-size: 0.9rem;
}
.sheet {
  background: var(--dash-sheet);
  border-radius: 26px 26px 0 0;
  min-height: calc(100% - 230px);
  padding: 26px 24px 32px;
}
.field {
  display: block;
  margin-top: 16px;
}
.field > span {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--dash-muted);
  margin: 0 0 6px 2px;
}
.input {
  --background: var(--dash-soft);
  --padding-start: 14px;
  --padding-end: 10px;
  --border-radius: 12px;
  --color: var(--dash-text);
  border: 1px solid var(--dash-line);
  border-radius: 12px;
  min-height: 48px;
}
.error {
  margin: 12px 2px 0;
  font-size: 0.85rem;
}
.submit {
  margin-top: 26px;
  --border-radius: 12px;
  height: 48px;
}
</style>
