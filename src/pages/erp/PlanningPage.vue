<script setup lang="ts">
/**
 * Planning hebdomadaire : un jour ouvert (date, tâches à cocher, ajout rapide),
 * les autres jours repliés en grands titres. Les tâches sont celles de Dash3 dont
 * l'échéance tombe ce jour-là ; cocher une tâche la passe en « Terminé ».
 */
import {
  IonPage,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  onIonViewWillEnter,
} from "@ionic/vue";
import { chevronBack, chevronForward, arrowBack, addCircleOutline } from "ionicons/icons";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useIonRouter } from "@ionic/vue";
import {
  createDayTask,
  createTask,
  dayKey,
  getProjet,
  listClientsLite,
  listProjetsLite,
  listWeekTasks,
  setTaskStatut,
  type Projet,
  type Tache,
} from "@/services/erp";
import { errorMessage, toast } from "@/services/ui";

const router = useIonRouter();

// ---------- Horloge (« April, 14 2025 — 9:41am » du design) ----------
const now = ref(new Date());
let clock: ReturnType<typeof setInterval>;
onMounted(() => (clock = setInterval(() => (now.value = new Date()), 30_000)));
onBeforeUnmount(() => clearInterval(clock));

// ---------- Semaine affichée ----------
const startOfWeek = (d: Date) => {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); // lundi
  return m;
};
const weekStart = ref(startOfWeek(new Date()));

const days = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value);
    d.setDate(d.getDate() + i);
    return { date: d, key: dayKey(d), name: d.toLocaleDateString("fr-FR", { weekday: "long" }) };
  })
);

const isCurrentWeek = computed(() => dayKey(weekStart.value) === dayKey(startOfWeek(new Date())));
const weekNumber = computed(() => {
  // Numéro de semaine ISO
  const d = new Date(Date.UTC(weekStart.value.getFullYear(), weekStart.value.getMonth(), weekStart.value.getDate() + 3));
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
});

// Jour ouvert : aujourd'hui sur la semaine en cours, sinon le lundi
const openKey = ref(dayKey(new Date()));

function goToday() {
  weekStart.value = startOfWeek(new Date());
  openKey.value = dayKey(new Date());
  load();
}

function changeWeek(delta: number) {
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() + 7 * delta);
  weekStart.value = d;
  openKey.value = isCurrentWeek.value ? dayKey(new Date()) : dayKey(d);
  load();
}

// ---------- Tâches ----------
const tasks = ref<Tache[]>([]);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    tasks.value = await listWeekTasks(days.value[0].key, days.value[6].key);
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
}
onIonViewWillEnter(load);

const refresh = async (ev: CustomEvent) => {
  await load();
  (ev.target as HTMLIonRefresherElement).complete();
};

const byDay = computed(() => {
  const map: Record<string, Tache[]> = {};
  for (const t of tasks.value) {
    const k = (t.expiration_date ?? "").slice(0, 10);
    (map[k] ??= []).push(t);
  }
  // Non terminées d'abord, puis par nom
  for (const k in map) map[k].sort((a, b) => Number(isDone(a)) - Number(isDone(b)) || a.name.localeCompare(b.name));
  return map;
});

const isDone = (t: Tache) => (t.statut_id ?? 0) >= 4;
const dayTasks = (key: string): Tache[] => byDay.value[key] ?? [];
const pendingCount = (key: string) => dayTasks(key).filter((t) => !isDone(t)).length;

async function toggle(t: Tache) {
  const previous = t.statut_id;
  t.statut_id = isDone(t) ? 1 : 4; // affichage immédiat
  try {
    await setTaskStatut(t.id, t.statut_id);
  } catch (err) {
    t.statut_id = previous;
    await toast(errorMessage(err), "danger");
  }
}

// ---------- Ajout rapide ----------
const newTask = ref("");
const adding = ref(false);
async function add(key: string) {
  const name = newTask.value.trim();
  if (!name || adding.value) return;
  adding.value = true;
  try {
    const created = await createDayTask(name, key);
    tasks.value.push({ ...created, expiration_date: key });
    newTask.value = "";
  } catch (err) {
    await toast(errorMessage(err), "danger");
  } finally {
    adding.value = false;
  }
}

// ---------- Ajout détaillé : lier ou non à un client, un projet, un devis ----------
const formOpen = ref(false);
const saving = ref(false);
const form = ref({ name: "", description: "", date: "", client_id: null as number | null, projet_id: null as number | null, devis_id: null as number | null });
const clients = ref<{ id: number; name: string }[]>([]);
const projets = ref<Projet[]>([]);
const devis = ref<{ id: number; reference: string; description: string | null }[]>([]);

async function openForm(key: string) {
  form.value = { name: newTask.value.trim(), description: "", date: key, client_id: null, projet_id: null, devis_id: null };
  newTask.value = "";
  formOpen.value = true;
  try {
    if (!clients.value.length) clients.value = await listClientsLite();
    projets.value = await listProjetsLite();
  } catch (err) {
    await toast(errorMessage(err), "danger");
  }
}
// Le client filtre les projets, le projet filtre les devis
watch(
  () => form.value.client_id,
  async (id) => {
    if (!formOpen.value) return;
    projets.value = await listProjetsLite(id).catch(() => []);
    if (form.value.projet_id && !projets.value.some((p) => p.id === form.value.projet_id)) form.value.projet_id = null;
  }
);
watch(
  () => form.value.projet_id,
  async (id) => {
    form.value.devis_id = null;
    devis.value = [];
    if (!id) return;
    const p = await getProjet(id).catch(() => null);
    devis.value = p?.invoices ?? [];
    if (p && !form.value.client_id) form.value.client_id = p.client_id;
  }
);

async function submitForm() {
  const f = form.value;
  if (!f.name.trim() || saving.value) return;
  saving.value = true;
  try {
    const created = await createTask({
      name: f.name.trim(),
      description: f.description.trim() || null,
      expiration_date: f.date,
      client_id: f.client_id,
      projet_id: f.projet_id,
      devis_id: f.devis_id,
    });
    const projet = projets.value.find((p) => p.id === f.projet_id);
    const client = clients.value.find((c) => c.id === f.client_id);
    tasks.value.push({
      ...created,
      expiration_date: f.date,
      projet: projet ? { id: projet.id, name: projet.name } : null,
      client: client ?? null,
    });
    formOpen.value = false;
    await toast("Tâche ajoutée");
  } catch (err) {
    await toast(errorMessage(err), "danger");
  } finally {
    saving.value = false;
  }
}

const linkLine = (t: Tache) => [t.client?.name, t.projet?.name].filter(Boolean).join(" › ");
const openLinked = (t: Tache) => {
  if (t.projet?.id) router.push(`/tabs/home/erp/projets/${t.projet.id}`);
};

// ---------- Formatage ----------
const dateLine = (d: Date) => {
  const date = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const isToday = dayKey(d) === dayKey(now.value);
  const time = now.value.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return isToday ? `${date}  —  ${time}` : date;
};
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true" class="planning-content">
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content /></ion-refresher>

      <div class="planning">
        <!-- Barre discrète : retour et changement de semaine -->
        <div class="week-bar">
          <button class="icon-btn" aria-label="Retour au menu" @click="router.navigate('/tabs/home', 'back', 'push')">
            <ion-icon :icon="arrowBack" />
          </button>
          <button class="icon-btn" aria-label="Semaine précédente" @click="changeWeek(-1)"><ion-icon :icon="chevronBack" /></button>
          <button class="week-label" :class="{ muted: isCurrentWeek }" :title="isCurrentWeek ? 'Semaine en cours' : 'Revenir à cette semaine'" @click="goToday">
            Semaine {{ weekNumber }}
          </button>
          <button class="icon-btn" aria-label="Semaine suivante" @click="changeWeek(1)"><ion-icon :icon="chevronForward" /></button>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <section v-for="d in days" :key="d.key" class="day" :class="{ open: openKey === d.key }">
          <!-- Jour replié : grand titre -->
          <button v-if="openKey !== d.key" class="day-title" @click="openKey = d.key">
            <span>{{ d.name }}</span>
            <span v-if="pendingCount(d.key)" class="count">{{ pendingCount(d.key) }}</span>
          </button>

          <!-- Jour ouvert -->
          <div v-else class="day-open">
            <h1 class="day-name">{{ d.name }}</h1>
            <p class="day-date">{{ dateLine(d.date) }}</p>

            <ul class="tasks">
              <li v-if="loading && !dayTasks(d.key).length" class="hint">Chargement…</li>
              <li v-if="!loading && !dayTasks(d.key).length" class="hint">Aucune tâche ce jour-là.</li>
              <li v-for="t in dayTasks(d.key)" :key="t.id">
                <label class="task" :class="{ done: isDone(t) }">
                  <input type="checkbox" :checked="isDone(t)" @change="toggle(t)" />
                  <span class="box" aria-hidden="true"></span>
                  <span class="label">
                    {{ t.name }}
                    <small v-if="linkLine(t)" class="link" @click.prevent.stop="openLinked(t)">{{ linkLine(t) }}</small>
                  </span>
                </label>
              </li>
            </ul>

            <div class="new-row">
              <input
                v-model="newTask"
                class="new-task"
                type="text"
                placeholder="Ajouter une tâche…"
                enterkeyhint="done"
                :disabled="adding"
                @keyup.enter="add(d.key)"
              />
              <button class="icon-btn add-btn" aria-label="Ajouter une tâche liée à un client, un projet ou un devis" @click="openForm(d.key)">
                <ion-icon :icon="addCircleOutline" />
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- Ajout manuel : tâche liée ou non à un client, un projet, un devis -->
      <ion-modal :is-open="formOpen" @didDismiss="formOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start"><ion-button @click="formOpen = false">Annuler</ion-button></ion-buttons>
            <ion-title>Nouvelle tâche</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" :disabled="!form.name.trim() || saving" @click="submitForm">
                <ion-spinner v-if="saving" name="crescent" /><span v-else>Ajouter</span>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list inset>
            <ion-item>
              <ion-input v-model="form.name" label="Tâche" label-placement="stacked" placeholder="Nom de la tâche" />
            </ion-item>
            <ion-item>
              <ion-textarea v-model="form.description" label="Description" label-placement="stacked" auto-grow />
            </ion-item>
            <ion-item>
              <ion-input v-model="form.date" type="date" label="Échéance" label-placement="stacked" />
            </ion-item>
          </ion-list>
          <ion-list inset>
            <ion-item>
              <ion-select v-model="form.client_id" label="Client" label-placement="stacked" interface="action-sheet" placeholder="Aucun">
                <ion-select-option :value="null">Aucun</ion-select-option>
                <ion-select-option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-select v-model="form.projet_id" label="Projet" label-placement="stacked" interface="action-sheet" placeholder="Aucun">
                <ion-select-option :value="null">Aucun</ion-select-option>
                <ion-select-option v-for="p in projets" :key="p.id" :value="p.id">{{ p.name }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item :disabled="!form.projet_id">
              <ion-select v-model="form.devis_id" label="Devis" label-placement="stacked" interface="action-sheet" placeholder="Aucun">
                <ion-select-option :value="null">Aucun</ion-select-option>
                <ion-select-option v-for="d in devis" :key="d.id" :value="d.id">{{ d.reference }}</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<style scoped>
/* Couleurs du design : clair par défaut, sombre avec la palette Ionic */
.planning-content {
  --pl-bg: #d9d9d9;
  --pl-ink: #3a3a3a;
  --pl-muted: #6f6f6f;
  --pl-line: #8a8a8a;
  --pl-accent: #e8541c;
  --background: var(--pl-bg);
}
:global(.ion-palette-dark) .planning-content {
  --pl-bg: #3a3a3a;
  --pl-ink: #e2e2e2;
  --pl-muted: #a8a8a8;
  --pl-line: #6a6a6a;
}

.planning {
  font-family: "Barlow", "Barlow Semi Condensed", system-ui, -apple-system, "Segoe UI", sans-serif;
  color: var(--pl-ink);
  min-height: 100%;
  padding-top: var(--ion-safe-area-top, 0);
}

/* Barre de semaine */
.week-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 20px 0;
}
.icon-btn,
.week-label {
  background: none;
  border: 0;
  color: var(--pl-muted);
  font: inherit;
  padding: 6px;
  display: inline-flex;
  align-items: center;
  font-size: 1.1rem;
}
.icon-btn:first-child {
  margin-right: auto;
}
.week-label {
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.week-label:not(.muted) {
  color: var(--pl-accent);
}

.error {
  color: var(--pl-accent);
  padding: 0 44px;
}

/* Jours */
.day {
  border-bottom: 1px solid var(--pl-line);
}
.day:last-child {
  border-bottom: 0;
}
.day-title {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: 0;
  color: var(--pl-ink);
  padding: 34px 44px;
  text-align: left;
  font: inherit;
}
.day-title span:first-child,
.day-name {
  font-weight: 800;
  font-size: 2.6rem;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: -0.01em;
}
.count {
  font-size: 1rem;
  font-weight: 500;
  color: var(--pl-muted);
}

.day-open {
  padding: 26px 44px 34px;
  display: flex;
  flex-direction: column;
  min-height: 52vh;
}
.day-name {
  margin: 0;
}
.day-date {
  margin: 10px 0 18px;
  color: var(--pl-muted);
  font-size: 1.05rem;
}

/* Tâches */
.tasks {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
}
.tasks li {
  margin: 0 0 6px;
}
.hint {
  color: var(--pl-muted);
}
.task {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 1.05rem;
  cursor: pointer;
}
.task input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.box {
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  margin-top: 3px;
  border: 1.5px solid var(--pl-ink);
  border-radius: 2px;
  position: relative;
}
.task.done .box {
  background: var(--pl-accent);
  border-color: var(--pl-accent);
}
.task.done .box::after {
  content: "";
  position: absolute;
  left: 4.5px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid #fff;
  border-width: 0 1.8px 1.8px 0;
  transform: rotate(45deg);
}
.task.done .label {
  color: var(--pl-accent);
  text-decoration: line-through;
}
.task input:focus-visible + .box {
  outline: 2px solid var(--pl-accent);
  outline-offset: 2px;
}

/* Ajout */
.new-row {
  display: flex;
  align-items: center;
  margin-top: 40px;
}
.add-btn {
  font-size: 1.6rem;
  color: var(--pl-accent);
}
.link {
  display: block;
  font-size: 0.8rem;
  color: var(--pl-muted);
  text-decoration: none;
}
.new-task {
  flex: 1;
  background: none;
  border: 0;
  outline: none;
  color: var(--pl-ink);
  font: inherit;
  font-size: 1.05rem;
  padding: 4px 0;
}
.new-task::placeholder {
  color: var(--pl-muted);
  opacity: 0.8;
}
</style>
