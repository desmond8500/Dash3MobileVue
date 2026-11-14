import axios from "axios";

const api = axios.create({
  baseURL: "https://dash3.yonkou.info/api/v1", // URL de ton API Laravel
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default api;
