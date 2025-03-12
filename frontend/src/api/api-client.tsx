import axios from "axios";
import { StatusCode, type ApiError } from "./models/global.interface";
import { toast } from "sonner";

export const ApiClient = axios.create({
  baseURL: "http://localhost:8443/api/v1",
  headers: {
    "Content-Type": "application/json"
  }
})

ApiClient.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);
