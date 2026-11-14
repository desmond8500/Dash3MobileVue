<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonTextarea,
  IonToggle,
  IonInput,
  IonNote,
  IonButton,
  IonIcon,
  IonText,
} from "@ionic/vue";
import { copyOutline, trashOutline } from "ionicons/icons";
import { computed, ref, watch } from "vue";
import Header from "@/components/header.vue";
import { convertGalaxyLines, DEFAULT_GALAXY_OPTIONS, type GalaxyOptions } from "@/utils/galaxy";
import { toast } from "@/services/ui";

const STORAGE_KEY = "dash3.galaxy";

// On garde le texte et les options entre deux ouvertures de la page
const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
})();

const text = ref<string>(saved.text ?? "");
const options = ref<GalaxyOptions>({ ...DEFAULT_GALAXY_OPTIONS, ...(saved.options ?? {}) });

watch([text, options], () => localStorage.setItem(STORAGE_KEY, JSON.stringify({ text: text.value, options: options.value })), {
  deep: true,
});

const results = computed(() =>
  convertGalaxyLines(text.value, { ...options.value, maxLength: Math.max(1, Number(options.value.maxLength) || 16) })
);
const output = computed(() => results.value.map((r) => r.output).join("\n"));
const truncatedCount = computed(() => results.value.filter((r) => r.truncated).length);

const copy = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    await toast("Copié");
  } catch {
    await toast("Copie impossible sur cet appareil", "danger");
  }
};
</script>

<template>
  <ion-page>
    <Header title="Galaxy Dimension" back="/tabs/home" />
    <ion-content>
      <ion-list inset>
        <ion-list-header><ion-label>Texte à convertir</ion-label></ion-list-header>
        <ion-item>
          <ion-textarea
            v-model="text"
            aria-label="Texte à convertir"
            placeholder="Un libellé par ligne, ex. :&#10;Détecteur chambre parents&#10;Porte d'entrée principale"
            :auto-grow="true"
            :rows="4"
            autocapitalize="sentences"
          />
        </ion-item>
        <ion-item v-if="text" lines="none">
          <ion-button slot="end" fill="clear" color="medium" size="small" @click="text = ''">
            <ion-icon slot="start" :icon="trashOutline" />Effacer
          </ion-button>
        </ion-item>
      </ion-list>

      <ion-list inset>
        <ion-list-header><ion-label>Options</ion-label></ion-list-header>
        <ion-item>
          <ion-input
            v-model.number="options.maxLength"
            label="Longueur maximale"
            type="number"
            inputmode="numeric"
            min="1"
            max="32"
            class="ion-text-end"
          />
        </ion-item>
        <ion-item>
          <ion-toggle v-model="options.uppercase">Majuscules</ion-toggle>
        </ion-item>
        <ion-item lines="none">
          <ion-toggle v-model="options.abbreviate">Abréger si trop long</ion-toggle>
        </ion-item>
      </ion-list>

      <ion-list v-if="results.length" inset>
        <ion-list-header>
          <ion-label>Résultat</ion-label>
          <ion-button size="small" @click="copy(output)"><ion-icon slot="start" :icon="copyOutline" />Tout copier</ion-button>
        </ion-list-header>
        <ion-item v-for="(r, i) in results" :key="i" button :detail="false" @click="copy(r.output)">
          <ion-label>
            <h3 class="mono">{{ r.output || "—" }}</h3>
            <p>{{ r.input }}</p>
          </ion-label>
          <ion-note slot="end" :color="r.truncated ? 'danger' : r.abbreviated ? 'warning' : 'medium'">
            {{ r.output.length }}/{{ options.maxLength }}
          </ion-note>
        </ion-item>
      </ion-list>

      <p v-if="truncatedCount" class="ion-padding-horizontal">
        <ion-text color="danger">
          {{ truncatedCount }} libellé(s) coupé(s) : raccourcissez-les à la main pour garder un texte lisible.
        </ion-text>
      </p>
      <p class="ion-padding-horizontal hint">
        <ion-text color="medium">
          Accents et caractères spéciaux retirés ; conservés : lettres, chiffres, espaces et - . / &amp; + ( ) '.
          Touchez une ligne pour la copier.
        </ion-text>
      </p>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.mono {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  letter-spacing: 0.04em;
}
.hint {
  font-size: 0.85rem;
}
</style>
