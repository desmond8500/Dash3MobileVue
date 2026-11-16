<script setup lang="ts">
/**
 * Détail d'un projet : informations, puis onglets Devis, Tâches, Contacts,
 * Journal et Notes. Chaque onglet permet l'ajout ; les devis, tâches et journaux
 * s'ouvrent sur leur propre page (avec retour vers le projet), les contacts et
 * les notes se modifient sur place.
 */
import {
  IonPage,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonNote,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  actionSheetController,
  onIonViewWillEnter,
  useIonRouter,
} from "@ionic/vue";
import { addCircleOutline, trashOutline } from "ionicons/icons";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/header.vue";
import EntityFormModal from "@/components/EntityFormModal.vue";
import type { FieldDef } from "@/components/formFields";
import {
  DEVIS_STATUSES,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_NAMES,
  createDevis,
  dayKey,
  deleteContact,
  deleteNote,
  devisStatusColor,
  formatDate,
  getProjet,
  listProjetNotes,
  saveContact,
  saveJournal,
  saveNote,
  saveTask,
  taskStatusColor,
  type ProjetContact,
  type ProjetDetail,
  type ProjetNote,
} from "@/services/erp";
import { confirmAction, errorMessage, toast, selfLink, withFrom } from "@/services/ui";

type Tab = "devis" | "taches" | "contacts" | "journal" | "notes";
type FormKind = "devis" | "tache" | "contact" | "journal" | "note";

const route = useRoute();
const router = useIonRouter();
const id = computed(() => route.params.id as string);
/** Adresse de cette page, passée aux pages de détail pour le bouton retour */
const selfPath = computed(() => selfLink(`/tabs/home/erp/projets/${id.value}`, route.query));

const projet = ref<ProjetDetail | null>(null);
const notes = ref<ProjetNote[]>([]);
const notesError = ref("");
const loading = ref(true);
const error = ref("");
const tab = ref<Tab>("devis");

const load = async (spinner = true) => {
  if (spinner) loading.value = true;
  error.value = "";
  try {
    const [p, n] = await Promise.all([
      getProjet(id.value),
      listProjetNotes(id.value).catch((err) => {
        notesError.value = errorMessage(err);
        return [] as ProjetNote[];
      }),
    ]);
    projet.value = p;
    notes.value = n;
    if (n.length) notesError.value = "";
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};

onIonViewWillEnter(() => {
  notesError.value = "";
  // Retour depuis une page de détail : on rafraîchit sans masquer la page
  load(projet.value?.id !== Number(id.value));
});

const refresh = async (ev: CustomEvent) => {
  await load(false);
  (ev.target as HTMLIonRefresherElement).complete();
};

const counts = computed(() => ({
  devis: projet.value?.invoices?.length ?? 0,
  taches: projet.value?.tasks?.length ?? 0,
  contacts: projet.value?.contacts?.length ?? 0,
  journal: projet.value?.journals?.length ?? 0,
  notes: notes.value.length,
}));

const journals = computed(() =>
  [...(projet.value?.journals ?? [])].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")))
);

const contactName = (c: ProjetContact) => [c.firstname, c.lastname].filter(Boolean).join(" ") || c.societe || "—";

// ---------- Formulaires (un seul modal, champs selon le type) ----------

const formKind = ref<FormKind>("devis");
const editing = ref<Record<string, any> | null>(null);
const initial = ref<Record<string, any> | null>(null);
const modalOpen = ref(false);
/** Page à ouvrir une fois le modal fermé (après création d'un devis, d'une tâche, d'un journal) */
let pendingNav: string | null = null;

const fields = computed<FieldDef[]>(() => {
  switch (formKind.value) {
    case "devis":
      return [
        { name: "description", label: "Objet", type: "textarea", required: true },
        { name: "statut", label: "Statut", type: "select", options: DEVIS_STATUSES.map((s) => ({ value: s, label: s })) },
        { name: "modalite", label: "Modalités", type: "textarea" },
        { name: "note", label: "Note", type: "textarea" },
      ];
    case "tache":
      return [
        { name: "name", label: "Tâche", required: true },
        { name: "description", label: "Description", type: "textarea" },
        { name: "priority_id", label: "Priorité", type: "select", options: TASK_PRIORITY_OPTIONS },
        { name: "expiration_date", label: "Échéance", type: "date" },
      ];
    case "contact":
      return [
        { name: "firstname", label: "Prénom", required: true },
        { name: "lastname", label: "Nom" },
        { name: "fonction", label: "Fonction" },
        { name: "societe", label: "Société" },
        { name: "phone", label: "Téléphone", type: "tel" },
        { name: "email", label: "E-mail", type: "email" },
      ];
    case "journal":
      return [
        { name: "title", label: "Titre", required: true },
        { name: "date", label: "Date", type: "date", required: true },
        { name: "type", label: "Type" },
        {
          name: "devis_id",
          label: "Devis lié",
          type: "select",
          options: [{ value: null, label: "Aucun" }, ...(projet.value?.invoices ?? []).map((d) => ({ value: d.id, label: d.reference }))],
        },
        { name: "description", label: "Description", type: "textarea" },
      ];
    case "note":
      return [
        { name: "titre", label: "Titre", required: true },
        { name: "description", label: "Note", type: "textarea", required: true },
      ];
  }
  return [];
});

const formTitle = computed(() => {
  const edit = !!editing.value;
  return {
    devis: "Nouveau devis",
    tache: "Nouvelle tâche",
    contact: edit ? "Modifier le contact" : "Nouveau contact",
    journal: "Nouveau journal",
    note: edit ? "Modifier la note" : "Nouvelle note",
  }[formKind.value];
});

const today = () => dayKey(new Date());

const openForm = (kind: FormKind, item: Record<string, any> | null = null) => {
  formKind.value = kind;
  editing.value = item;
  pendingNav = null;
  const defaults: Partial<Record<FormKind, Record<string, any>>> = {
    devis: { statut: "Nouveau" },
    tache: { priority_id: 1, expiration_date: today() },
    journal: { date: today(), devis_id: null },
  };
  initial.value = item ?? defaults[kind] ?? null;
  modalOpen.value = true;
};

const submit = async (values: Record<string, any>) => {
  const p = projet.value!;
  switch (formKind.value) {
    case "devis": {
      const d = await createDevis({ ...values, projet_id: p.id } as any);
      pendingNav = withFrom(`/tabs/home/erp/devis/${d.id}`, selfPath.value);
      break;
    }
    case "tache": {
      const t = await saveTask({ ...values, projet_id: p.id, client_id: p.client_id || null });
      pendingNav = withFrom(`/tabs/home/erp/taches/${t.id}`, selfPath.value);
      break;
    }
    case "journal": {
      const j = await saveJournal({ ...values, projet_id: p.id });
      pendingNav = withFrom(`/tabs/home/erp/journaux/${j.id}`, selfPath.value);
      break;
    }
    case "contact":
      await saveContact(editing.value ? values : { ...values, projet_id: p.id }, editing.value?.id);
      break;
    case "note":
      await saveNote({ ...values, projet_id: p.id }, editing.value?.id);
      break;
  }
};

const savedMessage = () =>
  ({
    devis: "Devis créé",
    tache: "Tâche créée",
    journal: "Journal créé",
    contact: editing.value ? "Contact modifié" : "Contact ajouté",
    note: editing.value ? "Note modifiée" : "Note ajoutée",
  })[formKind.value];

const onSaved = async () => {
  modalOpen.value = false;
  await toast(savedMessage());
  // Contacts et notes restent sur la page : on recharge ; les autres ouvrent leur page
  if (!pendingNav) await load(false);
};

const onClose = () => {
  modalOpen.value = false;
  if (pendingNav) {
    const to = pendingNav;
    pendingNav = null;
    router.push(to);
  }
};

// ---------- Contacts ----------

const contactActions = async (c: ProjetContact) => {
  const buttons: any[] = [];
  if (c.phone) buttons.push({ text: `Appeler ${c.phone}`, handler: () => (window.location.href = `tel:${c.phone}`) });
  if (c.email) buttons.push({ text: `Écrire à ${c.email}`, handler: () => (window.location.href = `mailto:${c.email}`) });
  buttons.push(
    { text: "Modifier", handler: () => openForm("contact", c) },
    { text: "Supprimer", role: "destructive", handler: () => removeContact(c) },
    { text: "Annuler", role: "cancel" }
  );
  const sheet = await actionSheetController.create({ header: contactName(c), buttons });
  await sheet.present();
};

const removeContact = async (c: ProjetContact) => {
  if (!(await confirmAction("Supprimer le contact", `Supprimer « ${contactName(c)} » ?`))) return;
  try {
    await deleteContact(c.id);
    await toast("Contact supprimé");
    await load(false);
  } catch (err) {
    await toast(errorMessage(err), "danger");
  }
};

// ---------- Notes ----------

const removeNote = async (n: ProjetNote) => {
  if (!(await confirmAction("Supprimer la note", `Supprimer « ${n.titre} » ?`))) return;
  try {
    await deleteNote(n.id);
    await toast("Note supprimée");
    await load(false);
  } catch (err) {
    await toast(errorMessage(err), "danger");
  }
};
</script>

<template>
  <ion-page>
    <Header :title="projet?.name || 'Projet'" back="/tabs/home/erp/projets" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content /></ion-refresher>

      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>

      <template v-else-if="projet">
        <div class="ion-padding-horizontal">
          <h2 class="title">{{ projet.name }}</h2>
          <ion-text color="medium"><p class="sub">{{ projet.client_name }}</p></ion-text>
        </div>

        <ion-list inset>
          <ion-item><ion-label>Début</ion-label><ion-note slot="end">{{ formatDate(projet.start_date) }}</ion-note></ion-item>
          <ion-item><ion-label>Fin</ion-label><ion-note slot="end">{{ formatDate(projet.end_date) }}</ion-note></ion-item>
          <ion-item v-if="projet.buildings?.length" lines="none">
            <ion-label>Bâtiments</ion-label>
            <ion-note slot="end">{{ projet.buildings.map((b) => b.name).join(", ") }}</ion-note>
          </ion-item>
        </ion-list>

        <ion-list v-if="projet.description" inset>
          <ion-list-header><ion-label>Description</ion-label></ion-list-header>
          <ion-item lines="none"><ion-label class="ion-text-wrap pre">{{ projet.description }}</ion-label></ion-item>
        </ion-list>

        <ion-segment :value="tab" scrollable class="ion-padding-horizontal" @ionChange="tab = $event.detail.value as Tab">
          <ion-segment-button value="devis"><ion-label>Devis ({{ counts.devis }})</ion-label></ion-segment-button>
          <ion-segment-button value="taches"><ion-label>Tâches ({{ counts.taches }})</ion-label></ion-segment-button>
          <ion-segment-button value="contacts"><ion-label>Contacts ({{ counts.contacts }})</ion-label></ion-segment-button>
          <ion-segment-button value="journal"><ion-label>Journal ({{ counts.journal }})</ion-label></ion-segment-button>
          <ion-segment-button value="notes"><ion-label>Notes ({{ counts.notes }})</ion-label></ion-segment-button>
        </ion-segment>

        <!-- Devis : ouverture sur la page du devis -->
        <ion-list v-if="tab === 'devis'" inset>
          <ion-item button :detail="false" @click="openForm('devis')">
            <ion-icon slot="start" :icon="addCircleOutline" color="primary" aria-hidden="true" />
            <ion-label color="primary">Nouveau devis</ion-label>
          </ion-item>
          <ion-item v-if="!counts.devis" lines="none"><ion-text color="medium">Aucun devis</ion-text></ion-item>
          <ion-item v-for="d in projet.invoices" :key="d.id" :router-link="withFrom(`/tabs/home/erp/devis/${d.id}`, selfPath)" detail>
            <ion-label>
              <h3>{{ d.reference }}</h3>
              <p v-if="d.description">{{ d.description }}</p>
            </ion-label>
            <ion-badge v-if="d.statut" slot="end" :color="devisStatusColor(d.statut)">{{ d.statut }}</ion-badge>
          </ion-item>
        </ion-list>

        <!-- Tâches : ouverture sur la page de la tâche -->
        <ion-list v-if="tab === 'taches'" inset>
          <ion-item button :detail="false" @click="openForm('tache')">
            <ion-icon slot="start" :icon="addCircleOutline" color="primary" aria-hidden="true" />
            <ion-label color="primary">Nouvelle tâche</ion-label>
          </ion-item>
          <ion-item v-if="!counts.taches" lines="none"><ion-text color="medium">Aucune tâche</ion-text></ion-item>
          <ion-item v-for="t in projet.tasks" :key="t.id" :router-link="withFrom(`/tabs/home/erp/taches/${t.id}`, selfPath)" detail>
            <ion-label>
              <h3>{{ t.name }}</h3>
              <p v-if="t.expiration_date">Échéance : {{ formatDate(t.expiration_date) }}</p>
            </ion-label>
            <ion-badge slot="end" :color="taskStatusColor(t.statut_id)">{{ TASK_STATUS_NAMES[t.statut_id ?? 0] ?? "—" }}</ion-badge>
          </ion-item>
        </ion-list>

        <!-- Contacts : actions (appeler, écrire, modifier, supprimer) -->
        <ion-list v-if="tab === 'contacts'" inset>
          <ion-item button :detail="false" @click="openForm('contact')">
            <ion-icon slot="start" :icon="addCircleOutline" color="primary" aria-hidden="true" />
            <ion-label color="primary">Nouveau contact</ion-label>
          </ion-item>
          <ion-item v-if="!counts.contacts" lines="none"><ion-text color="medium">Aucun contact</ion-text></ion-item>
          <ion-item v-for="c in projet.contacts" :key="c.id" button :detail="false" @click="contactActions(c)">
            <ion-label>
              <h3>{{ contactName(c) }}</h3>
              <p v-if="c.fonction || c.societe">{{ [c.fonction, c.societe].filter(Boolean).join(" · ") }}</p>
              <p v-if="c.phone || c.email">{{ [c.phone, c.email].filter(Boolean).join(" · ") }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Journal : ouverture sur la page du journal -->
        <ion-list v-if="tab === 'journal'" inset>
          <ion-item button :detail="false" @click="openForm('journal')">
            <ion-icon slot="start" :icon="addCircleOutline" color="primary" aria-hidden="true" />
            <ion-label color="primary">Nouveau journal</ion-label>
          </ion-item>
          <ion-item v-if="!counts.journal" lines="none"><ion-text color="medium">Aucune entrée</ion-text></ion-item>
          <ion-item v-for="j in journals" :key="j.id" :router-link="withFrom(`/tabs/home/erp/journaux/${j.id}`, selfPath)" detail>
            <ion-label class="ion-text-wrap">
              <h3>{{ j.title || "—" }}</h3>
              <p v-if="j.type">{{ j.type }}</p>
              <p v-if="j.description" class="clamp">{{ j.description }}</p>
            </ion-label>
            <ion-note slot="end">{{ formatDate(j.date) }}</ion-note>
          </ion-item>
        </ion-list>

        <!-- Notes : modification sur place, glisser pour supprimer -->
        <ion-list v-if="tab === 'notes'" inset>
          <ion-item button :detail="false" @click="openForm('note')">
            <ion-icon slot="start" :icon="addCircleOutline" color="primary" aria-hidden="true" />
            <ion-label color="primary">Nouvelle note</ion-label>
          </ion-item>
          <ion-item v-if="notesError" lines="none"><ion-text color="danger">{{ notesError }}</ion-text></ion-item>
          <ion-item v-else-if="!counts.notes" lines="none"><ion-text color="medium">Aucune note</ion-text></ion-item>
          <ion-item-sliding v-for="n in notes" :key="n.id">
            <ion-item button :detail="false" @click="openForm('note', n)">
              <ion-label class="ion-text-wrap">
                <h3>{{ n.titre }}</h3>
                <p v-if="n.description" class="pre">{{ n.description }}</p>
              </ion-label>
              <ion-note v-if="n.updated_at || n.created_at" slot="end">{{ formatDate(n.updated_at || n.created_at) }}</ion-note>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="danger" @click="removeNote(n)">
                <ion-icon slot="icon-only" :icon="trashOutline" aria-label="Supprimer" />
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
      </template>

      <EntityFormModal
        :is-open="modalOpen"
        :title="formTitle"
        :fields="fields"
        :initial="initial"
        :submit="submit"
        @close="onClose"
        @saved="onSaved"
      />
    </ion-content>
  </ion-page>
</template>

<style scoped>
.title {
  margin: 12px 0 0;
}
.sub {
  margin: 4px 0 0;
}
.pre {
  white-space: pre-line;
}
.clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
