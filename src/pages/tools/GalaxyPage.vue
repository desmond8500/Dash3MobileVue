<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonTextarea,
  IonNote,
  IonButton,
  IonIcon,
  IonText,
} from "@ionic/vue";
import { copyOutline, trashOutline } from "ionicons/icons";
import { computed, ref, watch } from "vue";
import Header from "@/components/header.vue";
import { convertGalaxyLines, GALAXY_CODES, GALAXY_MAX_LENGTH, type GalaxyResult } from "@/utils/galaxy";
import { toast } from "@/services/ui";

const STORAGE_KEY = "dash3.galaxy.text";

// Le texte saisi est gardé entre deux ouvertures de la page
const text = ref<string>(localStorage.getItem(STORAGE_KEY) ?? "");
watch(text, (v) => localStorage.setItem(STORAGE_KEY, v));

const results = computed(() => convertGalaxyLines(text.value));
const showTable = ref(false);

/** Codes séparés par des espaces, prêts à recopier sur le clavier */
const codesText = (r: GalaxyResult) => r.codes.join(" ");

const copy = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    await toast("Copié");
  } catch {
    await toast("Copie impossible sur cet appareil", "danger");
  }
};

const copyAll = () => copy(results.value.map((r) => `${r.text} : ${codesText(r)}`).join("\n"));

// Table de référence regroupée par code (à et a partagent le 13, etc.)
const table = Object.entries(GALAXY_CODES).map(([char, code]) => ({ char: char === " " ? "espace" : char.toUpperCase(), code }));
</script>

<template>
  <ion-page>
    <Header title="Nomenclature Galaxy" />
    <ion-content>
      <ion-list inset>
        <ion-list-header><ion-label>Texte à convertir</ion-label></ion-list-header>
        <ion-item>
          <ion-textarea
            v-model="text"
            aria-label="Texte à convertir"
            placeholder="Un libellé par ligne, 16 caractères max."
            :auto-grow="true"
            :rows="3"
          />
        </ion-item>
        <ion-item v-if="text" lines="none">
          <ion-button slot="end" fill="clear" color="medium" size="small" @click="text = ''">
            <ion-icon slot="start" :icon="trashOutline" />Effacer
          </ion-button>
        </ion-item>
      </ion-list>

      <ion-list v-if="results.length" inset>
        <ion-list-header>
          <ion-label>Codes</ion-label>
          <ion-button v-if="results.length > 1" size="small" @click="copyAll">
            <ion-icon slot="start" :icon="copyOutline" />Tout copier
          </ion-button>
        </ion-list-header>

        <ion-item v-for="(r, i) in results" :key="i" button :detail="false" @click="copy(codesText(r))">
          <ion-label class="ion-text-wrap">
            <h3>{{ r.text }}</h3>
            <div class="codes">
              <span v-for="(c, j) in r.chars" :key="j" class="code" :class="{ unknown: c.code === null }">
                <small>{{ c.char === " " ? "␣" : c.char }}</small>
                <strong>{{ c.code ?? "??" }}</strong>
              </span>
            </div>
            <p v-if="r.unknown.length">
              <ion-text color="danger">Non pris en charge, ignoré : {{ r.unknown.join(" ") }}</ion-text>
            </p>
            <p v-if="r.truncated">
              <ion-text color="warning">Coupé à {{ GALAXY_MAX_LENGTH }} caractères</ion-text>
            </p>
          </ion-label>
          <ion-note slot="end">{{ r.text.length }}/{{ GALAXY_MAX_LENGTH }}</ion-note>
        </ion-item>
      </ion-list>

      <p class="ion-padding-horizontal hint">
        <ion-text color="medium">Touchez un libellé pour copier ses codes. Les accents sont ignorés (é → E).</ion-text>
      </p>

      <ion-list inset>
        <ion-item button :detail="false" @click="showTable = !showTable">
          <ion-label>Table des codes</ion-label>
          <ion-note slot="end">{{ showTable ? "Masquer" : "Afficher" }}</ion-note>
        </ion-item>
        <div v-if="showTable" class="table ion-padding">
          <span v-for="t in table" :key="t.char" class="code">
            <small>{{ t.char }}</small>
            <strong>{{ t.code }}</strong>
          </span>
        </div>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.codes,
.table {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.code {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 34px;
  padding: 2px 4px;
  border-radius: 6px;
  border: 1px solid var(--ion-color-success);
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
.code small {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
}
.code.unknown {
  border-color: var(--ion-color-danger);
  color: var(--ion-color-danger);
}
.hint {
  font-size: 0.85rem;
}
</style>
