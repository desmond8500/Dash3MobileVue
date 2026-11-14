<script setup lang="ts">
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
  onIonViewWillEnter,
  useIonRouter,
} from "@ionic/vue";
import { createOutline, trashOutline, linkOutline, documentOutline } from "ionicons/icons";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/header.vue";
import {
  deleteArticle,
  getArticle,
  getArticleDocuments,
  getArticleImages,
  getArticleLinks,
  type Article,
} from "@/services/stock";
import { confirmAction, errorMessage, toast } from "@/services/ui";

const route = useRoute();
const router = useIonRouter();
const id = computed(() => route.params.id as string);

const article = ref<Article | null>(null);
const images = ref<{ id: number; image: string }[]>([]);
const links = ref<{ id: number; name: string; link: string }[]>([]);
const documents = ref<{ id: number; name: string; folder: string }[]>([]);
const loading = ref(true);
const error = ref("");

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    article.value = await getArticle(id.value);
    // Les pièces jointes ne bloquent pas l'affichage de l'article
    const [imgs, lnks, docs] = await Promise.allSettled([
      getArticleImages(id.value),
      getArticleLinks(id.value),
      getArticleDocuments(id.value),
    ]);
    images.value = imgs.status === "fulfilled" ? imgs.value : [];
    links.value = lnks.status === "fulfilled" ? lnks.value : [];
    documents.value = docs.status === "fulfilled" ? docs.value : [];
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};

onIonViewWillEnter(load);

const remove = async () => {
  if (!article.value) return;
  if (!(await confirmAction("Supprimer l'article", `Supprimer « ${article.value.designation} » ?`))) return;
  try {
    await deleteArticle(article.value.id);
    await toast("Article supprimé");
    router.navigate("/tabs/home/stock/articles", "back", "replace");
  } catch (err) {
    await toast(errorMessage(err), "danger");
  }
};

const fmt = (n: number | null | undefined, suffix = "") =>
  n == null || n === ("" as any) ? "—" : new Intl.NumberFormat("fr-FR").format(n) + suffix;
</script>

<template>
  <ion-page>
    <Header :title="article?.designation || 'Article'" back="/tabs/home/stock/articles" />
    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <p v-else-if="error" class="ion-padding"><ion-text color="danger">{{ error }}</ion-text></p>

      <template v-else-if="article">
        <div class="hero">
          <img :src="images[0]?.image || article.image" alt="" />
        </div>

        <div class="ion-padding-horizontal">
          <h2 class="title">{{ article.designation }}</h2>
          <ion-text color="medium"><p class="sub">{{ article.reference }}</p></ion-text>
          <div class="actions">
            <ion-button size="small" :router-link="`/tabs/home/stock/articles/${article.id}/edit`">
              <ion-icon slot="start" :icon="createOutline" />Modifier
            </ion-button>
            <ion-button size="small" fill="outline" color="danger" @click="remove">
              <ion-icon slot="start" :icon="trashOutline" />Supprimer
            </ion-button>
          </div>
        </div>

        <ion-list inset>
          <ion-item><ion-label>Catégorie</ion-label><ion-note slot="end">{{ article.priority || "—" }}</ion-note></ion-item>
          <ion-item><ion-label>Marque</ion-label><ion-note slot="end">{{ article.brand_name || "—" }}</ion-note></ion-item>
          <ion-item><ion-label>Fournisseur</ion-label><ion-note slot="end">{{ article.provider_name || "—" }}</ion-note></ion-item>
          <ion-item><ion-label>Prix</ion-label><ion-note slot="end">{{ fmt(article.price, " F") }}</ion-note></ion-item>
          <ion-item><ion-label>TVA</ion-label><ion-note slot="end">{{ fmt(article.tva, " %") }}</ion-note></ion-item>
          <ion-item><ion-label>Quantité</ion-label><ion-note slot="end">{{ fmt(article.quantity) }}</ion-note></ion-item>
          <ion-item><ion-label>Seuil minimum</ion-label><ion-note slot="end">{{ fmt(article.quantity_min) }}</ion-note></ion-item>
          <ion-item lines="none"><ion-label>Poids</ion-label><ion-note slot="end">{{ fmt(article.weight, " kg") }}</ion-note></ion-item>
        </ion-list>

        <ion-list v-if="article.description" inset>
          <ion-list-header><ion-label>Description</ion-label></ion-list-header>
          <ion-item lines="none"><ion-label class="ion-text-wrap">{{ article.description }}</ion-label></ion-item>
        </ion-list>

        <ion-list v-if="article.spec" inset>
          <ion-list-header><ion-label>Caractéristiques</ion-label></ion-list-header>
          <ion-item lines="none"><ion-label class="ion-text-wrap pre">{{ article.spec }}</ion-label></ion-item>
        </ion-list>

        <div v-if="images.length > 1" class="gallery ion-padding-horizontal">
          <img v-for="img in images" :key="img.id" :src="img.image" alt="" loading="lazy" />
        </div>

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
.actions {
  display: flex;
  gap: 8px;
}
.pre {
  white-space: pre-line;
}
.gallery {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}
.gallery img {
  height: 90px;
  border-radius: 8px;
}
</style>
