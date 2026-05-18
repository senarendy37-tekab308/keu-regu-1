import { onRequest } from "firebase-functions/v2/https";
import app from "./app";

export const api = onRequest({
  region: "asia-southeast1", // Atau sesuaikan dengan region Anda
  memory: "256MiB",
}, app);
