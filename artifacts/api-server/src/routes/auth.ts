import { Router } from "express";
import { auth } from "../lib/firebase";

const router = Router();

router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.json({ role: "user" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    await auth.verifyIdToken(idToken);
    return res.json({ role: "admin" });
  } catch {
    return res.json({ role: "user" });
  }
});

router.post("/auth/login", (req, res) => {
  // Login sekarang ditangani oleh Firebase SDK di frontend.
  // Endpoint ini bisa dikosongkan atau diarahkan untuk verifikasi awal.
  return res.status(400).json({ error: "Gunakan Firebase SDK di frontend untuk login" });
});

router.post("/auth/logout", (req, res) => {
  return res.json({ ok: true });
});

export default router;
