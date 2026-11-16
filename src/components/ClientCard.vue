<script setup lang="ts">
import { IonItem,IonThumbnail,IonLabel } from "@ionic/vue";
import { withFrom } from "@/services/ui";


    defineProps<{
        client: {
            id: number;
            name: string;
            description: string;
            avatar: string;
            status: string;
            type: string;
        };
    }>();

</script>

<template>
    <ion-item :router-link="withFrom(`/tabs/home/erp/projets?client_id=${client.id}&client=${encodeURIComponent(client.name)}`, '/tabs/home/erp/clients')" detail>
        <ion-thumbnail slot="start">
            <img alt="IMG" :src="client.avatar" />
        </ion-thumbnail>
        <ion-label>
            <h2>{{ client.name }}</h2>
            <p>{{ client.description }}</p>
        </ion-label>
    </ion-item>
</template>

<style lang="css" scoped>
    .s1{
        flex: 2;
    }
    .s2{
        flex: 8;
    }
    .s3{
        flex: 1;
    }

    h2 {
        margin: 0;
        font-size: 1.2rem;
    }
    .card {
        background: white;
        border-radius: 6px;
        padding: 6px;
        box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
        margin-bottom: 6px;
        display: flex;
        gap: 5px;
        align-items: center;
    }
    .avatar {
        width: 50px;
        height: 50px;
        border-radius: 10px;
    }
</style>    
