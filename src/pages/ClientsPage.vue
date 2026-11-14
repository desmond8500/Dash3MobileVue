<script setup lang="ts">

import { IonPage, IonContent, } from "@ionic/vue";
import Header from "@/components/header.vue";
import ClientCard from "@/components/ClientCard.vue";

import { ref, onMounted } from "vue";
import api from "@/services/api";

const clients = ref([]);
const page = ref({
  current_page: 1,
  last_page: 1,
});
const search = ref("");
const loading = ref(false);
const error = ref("");
import { watch } from "vue";

watch(search, () => {
  getClients();
});

const getClients = async (pageNumber = 1) => {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await api.get("/clients", {
      params: {
        page: pageNumber,
        search: search.value,
      },
    });

    clients.value = data.data;
    page.value = data.meta;
  } catch (err: any) {
    error.value = err.response?.data?.message ?? "Erreur API";
  } finally {
    loading.value = false;
  }
};

const changePage = (pageNumber: number) => {
  getClients(pageNumber);
};

onMounted(getClients);

</script>

<template>
  <ion-page>
    <Header title="Clients" />
    <ion-content class="ion-padding">
        <ion-searchbar animated="true" placeholder="Client" v-model="search"  debounce="500" @ionInput="getClients()" @keydown.enter="getClients()" ></ion-searchbar>
      <p v-if="loading">Chargement...</p>
      <p v-if="error">{{ error }}</p>

      <div>
        <ClientCard v-for="client in clients" :key="client.id" :client="client" />
      </div>

      <div class="pagination">
        <ion-button @click="changePage(page.current_page - 1)" :disabled="page.current_page <= 1"> 
          Précédent
        </ion-button>

          <ion-button color="primary" @click="changePage(1)"> 1 </ion-button>
        <ion-button color="medium"> {{ page.current_page }} </ion-button>
          <ion-button color="primary" @click="changePage(page.last_page)"> {{ page.last_page }} </ion-button>
        <ion-button @click="changePage(page.current_page + 1)" :disabled="page.current_page >= page.last_page">
          Suivant
        </ion-button>
      </div>

    </ion-content>
  </ion-page>
</template>

<style lang="css" scoped>
  
</style>