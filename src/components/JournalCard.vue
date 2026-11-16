<script setup lang="ts">
/**
 * Carte d'un journal, d'après la carte Dash3 (_card/journal_card) :
 * bloc date à gauche (jour, numéro, mois, année), type en capitales, titre.
 * Ajouts pour le mobile : aperçu de la description, « Aujourd'hui » / « Hier »,
 * toute la carte ouvre le journal, menu ⋮ (Ouvrir, PDF, Modifier, Supprimer).
 */
import { IonIcon, actionSheetController, useIonRouter } from "@ionic/vue";
import { ellipsisVertical } from "ionicons/icons";
import { computed } from "vue";
import { openJournalPdf } from "@/services/pdf";

const props = defineProps<{
  journal: { id: number; title: string | null; date: string | null; description: string | null; type?: string | null };
  /** Adresse de la page du journal */
  to: string;
}>();
const emit = defineEmits<{ edit: []; remove: [] }>();

const router = useIonRouter();

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Date du journal (jour seul, sans décalage de fuseau) */
const date = computed(() => {
  const raw = props.journal.date?.slice(0, 10);
  if (!raw) return null;
  const d = new Date(`${raw}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
});

const parts = computed(() => {
  const d = date.value;
  if (!d) return null;
  return {
    dow: capitalize(d.toLocaleDateString("fr-FR", { weekday: "long" })),
    day: String(d.getDate()).padStart(2, "0"),
    month: capitalize(d.toLocaleDateString("fr-FR", { month: "short" })),
    year: d.getFullYear(),
  };
});

/** « Aujourd'hui » / « Hier » pour les entrées récentes */
const recent = computed(() => {
  const d = date.value;
  if (!d) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  return days === 0 ? "Aujourd'hui" : days === 1 ? "Hier" : "";
});

const type = computed(() => (props.journal.type?.trim() || "Rapport d'intervention").toUpperCase());

/** Description sans la mise en forme Markdown */
const excerpt = computed(() =>
  (props.journal.description ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
);

const open = () => router.push(props.to);

const menu = async () => {
  const sheet = await actionSheetController.create({
    header: props.journal.title || "Journal",
    buttons: [
      { text: "Ouvrir", handler: open },
      { text: "PDF", handler: () => openJournalPdf(props.journal) },
      { text: "Modifier", handler: () => emit("edit") },
      { text: "Supprimer", role: "destructive", handler: () => emit("remove") },
      { text: "Annuler", role: "cancel" },
    ],
  });
  await sheet.present();
};
</script>

<template>
  <article class="jcard" role="link" tabindex="0" @click="open" @keydown.enter="open">
    <div class="date" :class="{ empty: !parts }">
      <template v-if="parts">
        <span class="dow">{{ parts.dow }}</span>
        <span class="day">{{ parts.day }}</span>
        <span class="month">{{ parts.month }}</span>
        <span class="year">{{ parts.year }}</span>
      </template>
      <span v-else class="dow">Sans date</span>
    </div>

    <div class="body">
      <div class="type">
        <span>{{ type }}</span>
        <span v-if="recent" class="recent">{{ recent }}</span>
      </div>
      <h3 class="title">{{ journal.title || "Sans titre" }}</h3>
      <p v-if="excerpt" class="excerpt">{{ excerpt }}</p>
    </div>

    <button class="more" type="button" aria-label="Actions du journal" @click.stop="menu">
      <ion-icon :icon="ellipsisVertical" aria-hidden="true" />
    </button>
  </article>
</template>

<style scoped>
.jcard {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--dash-line);
  border-radius: 14px;
  background: var(--dash-sheet);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.jcard:active {
  background: var(--dash-soft);
}

/* Bloc date (comme Dash3 : bord bleu, chiffres en couleur principale) */
.date {
  flex: 0 0 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 2px;
  border: 1px solid rgba(var(--ion-color-primary-rgb), 0.45);
  border-radius: 10px;
  background: rgba(var(--ion-color-primary-rgb), 0.06);
  color: var(--ion-color-primary);
  line-height: 1.1;
}
.date.empty {
  justify-content: center;
  min-height: 72px;
}
.dow {
  font-size: 10px;
  font-weight: 700;
  color: var(--dash-muted);
}
.day {
  font-size: 1.9rem;
  font-weight: 300;
  line-height: 1.15;
}
.month {
  font-weight: 700;
  font-size: 0.85rem;
}
.year {
  font-weight: 700;
  font-size: 0.8rem;
}

.body {
  flex: 1;
  min-width: 0;
}
.type {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 4px;
  margin: 2px 0 6px;
  border-bottom: 1px solid var(--dash-line);
  color: var(--ion-color-primary);
  font-weight: 700;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}
.type > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent {
  flex: 0 0 auto;
  margin-left: auto;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(var(--ion-color-success-rgb), 0.15);
  color: var(--ion-color-success-shade);
  font-size: 0.68rem;
  letter-spacing: 0;
}
.title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--dash-text);
}
.excerpt {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: var(--dash-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.more {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  margin: -2px -4px 0 0;
  border: 1px solid var(--dash-line);
  border-radius: 8px;
  background: transparent;
  color: var(--dash-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.more:active {
  background: var(--dash-soft);
}
</style>
