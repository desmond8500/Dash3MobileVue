<script setup lang="ts">
/**
 * Fiche article, avec les mêmes éléments que Dash3 : images (ajout, image par défaut, suppression),
 * tags, quantité +/−, commande, caractéristiques, documents, liens et articles associés.
 */
import {
  IonPage,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
  IonText,
  IonButton,
  IonIcon,
  IonChip,
  IonThumbnail,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  actionSheetController,
  alertController,
  onIonViewWillEnter,
  useIonRouter,
} from "@ionic/vue";
import {
  createOutline,
  trashOutline,
  linkOutline,
  documentOutline,
  addOutline,
  removeOutline,
  cartOutline,
  cameraOutline,
  closeCircle,
  pricetagOutline,
  star,
  gitNetworkOutline,
} from "ionicons/icons";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/header.vue";
import {
  addDependance,
  adjustDependance,
  adjustQuantity,
  attachTag,
  deleteArticle,
  deleteImage,
  detachTag,
  getArticle,
  getArticleDocuments,
  getArticleImages,
  getArticleLinks,
  getDependances,
  listArticles,
  orderArticle,
  removeDependance,
  setDefaultImage,
  uploadImages,
  type Article,
  type ArticleImage,
  type Dependance,
} from "@/services/stock";
import { confirmAction, errorMessage, toast } from "@/services/ui";

const route = useRoute();
const router = useIonRouter();
const id = computed(() => route.params.id as string);

const article = ref<Article | null>(null);
const images = ref<ArticleImage[]>([]);
const links = ref<{ id: number; name: string; link: string }[]>([]);
const documents = ref<{ id: number; name: string; folder: string }[]>([]);
const deps = ref<Dependance[]>([]);
const loading = ref(true);
const error = ref("");

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    article.value = await getArticle(id.value);
    // Les pièces jointes ne bloquent pas l'affichage de l'article
    const [imgs, lnks, docs, dps] = await Promise.allSettled([
      getArticleImages(id.value),
      getArticleLinks(id.value),
      getArticleDocuments(id.value),
      getDependances(id.value),
    ]);
    images.value = imgs.status === "fulfilled" ? imgs.value : [];
    links.value = lnks.status === "fulfilled" ? lnks.value : [];
    documents.value = docs.status === "fulfilled" ? docs.value : [];
    deps.value = dps.status === "fulfilled" ? dps.value : [];
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};
onIonViewWillEnter(load);
const refresh = async (ev: CustomEvent) => {
  await load();
  (ev.target as HTMLIonRefresherElement).complete();
};

const safely = async (fn: () => Promise<unknown>, ok?: string) => {
  try {
    await fn();
    if (ok) await toast(ok);
  } catch (err) {
    await toast(errorMessage(err), "danger");
  }
};

// ---------- Actions principales ----------
const remove = async () => {
  if (!article.value) return;
  if (!(await confirmAction("Supprimer l'article", `Supprimer « ${article.value.designation} » ?`))) return;
  await safely(async () => {
    await deleteArticle(article.value!.id);
    router.navigate("/tabs/home/stock/articles", "back", "replace");
  }, "Article supprimé");
};

const changeQuantity = (delta: number) =>
  safely(async () => {
    article.value!.quantity = await adjustQuantity(article.value!.id, delta);
  });

const order = async () => {
  const alert = await alertController.create({
    header: "Commander",
    message: article.value?.designation,
    inputs: [{ name: "quantity", type: "number", value: 1, min: 1 }],
    buttons: [
      { text: "Annuler", role: "cancel" },
      {
        text: "Commander",
        handler: (v) => {
          safely(() => orderArticle(article.value!.id, Math.max(1, Number(v.quantity) || 1)), "Ajouté aux achats");
        },
      },
    ],
  });
  await alert.present();
};

const lowStock = computed(() => {
  const a = article.value;
  return !!a && a.quantity_min != null && (a.quantity ?? 0) <= a.quantity_min;
});

// ---------- Tags ----------
const addTag = async () => {
  const alert = await alertController.create({
    header: "Ajouter un tag",
    inputs: [{ name: "name", type: "text", placeholder: "Caméra, NVR…" }],
    buttons: [
      { text: "Annuler", role: "cancel" },
      {
        text: "Ajouter",
        handler: (v) => {
          const name = String(v.name ?? "").trim();
          if (name) safely(async () => (article.value!.tags = await attachTag(article.value!.id, name)));
        },
      },
    ],
  });
  await alert.present();
};
const removeTag = async (name: string) => {
  if (!(await confirmAction("Retirer le tag", `Retirer « ${name} » ?`))) return;
  await safely(async () => (article.value!.tags = await detachTag(article.value!.id, name)));
};

// ---------- Images ----------
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const heroImage = computed(() => images.value.find((i) => i.is_default)?.image || article.value?.image || images.value[0]?.image);

async function onFiles(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  if (!files.length) return;
  uploading.value = true;
  await safely(async () => (images.value = await uploadImages(article.value!.id, files)), "Images ajoutées");
  uploading.value = false;
}

async function imageActions(img: ArticleImage) {
  const sheet = await actionSheetController.create({
    header: "Image",
    buttons: [
      {
        text: "Définir par défaut",
        icon: star,
        handler: () => {
          safely(async () => {
            article.value!.image = await setDefaultImage(article.value!.id, img.path);
            images.value = images.value.map((i) => ({ ...i, is_default: i.path === img.path }));
          }, "Image par défaut définie");
        },
      },
      {
        text: "Supprimer",
        role: "destructive",
        icon: trashOutline,
        handler: () => {
          safely(async () => (images.value = await deleteImage(article.value!.id, img.path)), "Image supprimée");
        },
      },
      { text: "Annuler", role: "cancel" },
    ],
  });
  await sheet.present();
}

// ---------- Articles associés ----------
const changeDep = (d: Dependance, delta: number) =>
  safely(async () => {
    d.quantity = await adjustDependance(d.id, delta);
  });
const removeDep = async (d: Dependance) => {
  if (!(await confirmAction("Retirer l'article associé", `Retirer « ${d.article.designation} » ?`))) return;
  await safely(async () => {
    await removeDependance(d.id);
    deps.value = deps.value.filter((x) => x.id !== d.id);
  });
};

const pickerOpen = ref(false);
const pickerSearch = ref("");
const pickerResults = ref<Article[]>([]);
const pickerLoading = ref(false);
let pickerTimer: ReturnType<typeof setTimeout>;
async function searchArticles(q: string) {
  pickerLoading.value = true;
  try {
    pickerResults.value = (await listArticles(1, q.trim(), 20)).items.filter((a) => a.id !== article.value?.id);
  } catch {
    pickerResults.value = [];
  } finally {
    pickerLoading.value = false;
  }
}
watch(pickerSearch, (q) => {
  clearTimeout(pickerTimer);
  pickerTimer = setTimeout(() => searchArticles(q), 300);
});
function openPicker() {
  pickerSearch.value = "";
  pickerOpen.value = true;
  searchArticles("");
}
const pickDep = (a: Article) =>
  safely(async () => {
    deps.value = await addDependance(article.value!.id, a.id);
    pickerOpen.value = false;
  }, "Article associé");

const fmt = (n: number | null | undefined, suffix = "") =>
  n == null || n === ("" as any) ? "—" : new Intl.NumberFormat("fr-FR").format(n) + suffix;
</script>

<template>
  <ion-page>
    <Header :title="article?.designation || 'Article'" back="/tabs/home/stock/articles" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh"><ion-refresher-content /></ion-refresher>
      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>

      <template v-else-if="article">
        <div class="hero">
          <img :src="heroImage" alt="" />
        </div>

        <!-- Galerie : appui sur une image pour la définir par défaut ou la supprimer -->
        <div class="gallery ion-padding-horizontal">
          <button v-for="img in images" :key="img.path" class="thumb" :class="{ default: img.is_default }" @click="imageActions(img)">
            <img :src="img.image" alt="" loading="lazy" />
            <ion-icon v-if="img.is_default" :icon="star" class="star" />
          </button>
          <button class="thumb add" :disabled="uploading" aria-label="Ajouter des images" @click="fileInput?.click()">
            <ion-spinner v-if="uploading" name="crescent" />
            <ion-icon v-else :icon="cameraOutline" />
          </button>
          <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onFiles" />
        </div>

        <div class="ion-padding-horizontal">
          <h2 class="title">{{ article.designation }}</h2>
          <ion-text color="medium"><p class="sub">{{ article.reference }}</p></ion-text>

          <!-- Tags -->
          <div class="tags">
            <ion-chip v-for="t in article.tags || []" :key="t" color="primary" @click="removeTag(t)">
              <ion-icon :icon="pricetagOutline" />
              <ion-label>{{ t }}</ion-label>
              <ion-icon :icon="closeCircle" />
            </ion-chip>
            <ion-chip outline @click="addTag"><ion-icon :icon="addOutline" /><ion-label>Tag</ion-label></ion-chip>
          </div>

          <div class="actions">
            <ion-button size="small" :router-link="`/tabs/home/stock/articles/${article.id}/edit`">
              <ion-icon slot="start" :icon="createOutline" />Modifier
            </ion-button>
            <ion-button size="small" fill="outline" @click="order">
              <ion-icon slot="start" :icon="cartOutline" />Commander
            </ion-button>
            <ion-button size="small" fill="clear" color="danger" aria-label="Supprimer" @click="remove">
              <ion-icon slot="icon-only" :icon="trashOutline" />
            </ion-button>
          </div>
        </div>

        <!-- Quantité en stock -->
        <ion-list inset>
          <ion-item lines="none">
            <ion-label>
              Quantité en stock
              <p v-if="article.quantity_min != null">Seuil minimum : {{ fmt(article.quantity_min) }}</p>
            </ion-label>
            <div slot="end" class="stepper">
              <ion-button fill="outline" size="small" aria-label="Retirer un" @click="changeQuantity(-1)"><ion-icon slot="icon-only" :icon="removeOutline" /></ion-button>
              <ion-text :color="lowStock ? 'danger' : undefined"><b class="qty">{{ fmt(article.quantity) }}</b></ion-text>
              <ion-button fill="outline" size="small" aria-label="Ajouter un" @click="changeQuantity(1)"><ion-icon slot="icon-only" :icon="addOutline" /></ion-button>
            </div>
          </ion-item>
        </ion-list>

        <ion-list inset>
          <ion-item><ion-label>Catégorie</ion-label><ion-note slot="end">{{ article.priority || "—" }}</ion-note></ion-item>
          <ion-item><ion-label>Marque</ion-label><ion-note slot="end">{{ article.brand_name || "—" }}</ion-note></ion-item>
          <ion-item><ion-label>Fournisseur</ion-label><ion-note slot="end">{{ article.provider_name || "—" }}</ion-note></ion-item>
          <ion-item><ion-label>Prix</ion-label><ion-note slot="end">{{ fmt(article.price, " F") }}</ion-note></ion-item>
          <ion-item><ion-label>TVA</ion-label><ion-note slot="end">{{ fmt(article.tva, " %") }}</ion-note></ion-item>
          <ion-item lines="none"><ion-label>Poids</ion-label><ion-note slot="end">{{ fmt(article.weight, " kg") }}</ion-note></ion-item>
        </ion-list>

        <ion-list v-if="article.description" inset>
          <ion-list-header><ion-label>Description</ion-label></ion-list-header>
          <ion-item lines="none"><ion-label class="ion-text-wrap pre">{{ article.description }}</ion-label></ion-item>
        </ion-list>

        <ion-list v-if="article.spec" inset>
          <ion-list-header><ion-label>Caractéristiques</ion-label></ion-list-header>
          <ion-item lines="none"><ion-label class="ion-text-wrap pre">{{ article.spec }}</ion-label></ion-item>
        </ion-list>

        <!-- Articles associés -->
        <ion-list inset>
          <ion-list-header>
            <ion-label><ion-icon :icon="gitNetworkOutline" /> Articles associés</ion-label>
            <ion-button size="small" @click="openPicker"><ion-icon slot="start" :icon="addOutline" />Associer</ion-button>
          </ion-list-header>
          <ion-item v-if="!deps.length" lines="none"><ion-label color="medium">Aucun article associé</ion-label></ion-item>
          <ion-item v-for="d in deps" :key="d.id">
            <ion-thumbnail slot="start" class="small-thumb" @click="router.push(`/tabs/home/stock/articles/${d.article.id}`)">
              <img :src="d.article.image" alt="" />
            </ion-thumbnail>
            <ion-label class="ion-text-wrap" @click="router.push(`/tabs/home/stock/articles/${d.article.id}`)">
              {{ d.article.designation }}
              <p>{{ d.article.reference }}</p>
            </ion-label>
            <div slot="end" class="stepper">
              <ion-button fill="clear" size="small" aria-label="Moins" @click="d.quantity > 1 ? changeDep(d, -1) : removeDep(d)">
                <ion-icon slot="icon-only" :icon="d.quantity > 1 ? removeOutline : trashOutline" />
              </ion-button>
              <b>{{ d.quantity }}</b>
              <ion-button fill="clear" size="small" aria-label="Plus" @click="changeDep(d, 1)"><ion-icon slot="icon-only" :icon="addOutline" /></ion-button>
            </div>
          </ion-item>
        </ion-list>

        <ion-list v-if="links.length" inset>
          <ion-list-header><ion-label>Liens</ion-label></ion-list-header>
          <ion-item v-for="l in links" :key="l.id" :href="l.link" target="_blank" detail>
            <ion-icon slot="start" :icon="linkOutline" aria-hidden="true" />
            <ion-label>{{ l.name }}</ion-label>
          </ion-item>
        </ion-list>

        <ion-list v-if="documents.length" inset>
          <ion-list-header><ion-label>Documents</ion-label></ion-list-header>
          <ion-item v-for="d in documents" :key="d.id" :href="d.folder" target="_blank" detail>
            <ion-icon slot="start" :icon="documentOutline" aria-hidden="true" />
            <ion-label>{{ d.name }}</ion-label>
          </ion-item>
        </ion-list>
      </template>

      <!-- Choix d'un article à associer -->
      <ion-modal :is-open="pickerOpen" @didDismiss="pickerOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Associer un article</ion-title>
            <ion-buttons slot="end"><ion-button @click="pickerOpen = false">Fermer</ion-button></ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar v-model="pickerSearch" placeholder="Rechercher un article" :debounce="0" />
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div v-if="pickerLoading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
          <ion-list v-else>
            <ion-item v-if="!pickerResults.length" lines="none"><ion-label color="medium">Aucun article</ion-label></ion-item>
            <ion-item v-for="a in pickerResults" :key="a.id" button @click="pickDep(a)">
              <ion-thumbnail slot="start" class="small-thumb"><img :src="a.image" alt="" /></ion-thumbnail>
              <ion-label class="ion-text-wrap">{{ a.designation }}<p>{{ a.reference }}</p></ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.hero {
  background: var(--ion-color-light);
  display: flex;
  justify-content: center;
}
.hero img {
  max-height: 220px;
  object-fit: contain;
}
.title {
  margin: 12px 0 0;
}
.sub {
  margin: 4px 0 8px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -4px 6px;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.pre {
  white-space: pre-line;
}
.gallery {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-top: 8px;
}
.thumb {
  position: relative;
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 2px solid transparent;
  padding: 0;
  background: var(--ion-color-light);
  overflow: hidden;
}
.thumb.default {
  border-color: var(--ion-color-primary);
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb.add {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--ion-color-medium);
  border: 2px dashed var(--ion-color-medium);
}
.star {
  position: absolute;
  top: 2px;
  right: 2px;
  color: var(--ion-color-warning);
}
.stepper {
  display: flex;
  align-items: center;
  gap: 6px;
}
.qty {
  min-width: 2.5ch;
  text-align: center;
  display: inline-block;
}
.small-thumb {
  --size: 40px;
  --border-radius: 6px;
}
</style>
