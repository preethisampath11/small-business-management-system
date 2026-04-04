import axios from "axios";

export const API = axios.create({
  baseURL: "/api",
});

export default API;
