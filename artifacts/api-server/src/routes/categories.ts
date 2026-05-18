import { Router } from "express";
import { db } from "../lib/firebase";
import { CreateCategoryBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();
const COLLECTION = "categories";

router.get("/categories", async (_req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION).orderBy("name").get();
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/categories", requireAdmin, async (req, res) => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const docRef = await db.collection(COLLECTION).add(parsed.data);
    const doc = await docRef.get();
    return res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create category" });
  }
});

export default router;
