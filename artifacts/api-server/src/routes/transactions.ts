import { Router } from "express";
import { db, Timestamp } from "../lib/firebase";
import {
  CreateTransactionBody,
  ListTransactionsQueryParams,
  GetTransactionParams,
  DeleteTransactionParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();
const COLLECTION = "transactions";
const CATEGORIES_COLLECTION = "categories";

router.get("/transactions", async (req, res) => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query parameters" });
  }

  const { type, categoryId, limit } = parsed.data;
  let query: any = db.collection(COLLECTION);

  if (type) query = query.where("type", "==", type);
  if (categoryId != null) query = query.where("categoryId", "==", String(categoryId));

  query = query.orderBy("date", "desc").orderBy("createdAt", "desc").limit(limit ?? 100);

  try {
    const [snapshot, categoriesSnapshot] = await Promise.all([
      query.get(),
      db.collection(CATEGORIES_COLLECTION).get()
    ]);

    const categoriesMap = new Map(
      categoriesSnapshot.docs.map(doc => [doc.id, doc.data().name])
    );

    const transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        amount: parseFloat(data.amount),
        categoryName: categoriesMap.get(data.categoryId) || "Tidak Berkategori",
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    });

    return res.json(transactions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.post("/transactions", requireAdmin, async (req, res) => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { amount, type, description, date, categoryId } = parsed.data;
  const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : String(date);
  
  try {
    const newTransaction = {
      amount: String(amount),
      type,
      description,
      date: dateStr,
      categoryId: categoryId ? String(categoryId) : null,
      createdAt: Timestamp.now()
    };

    const docRef = await db.collection(COLLECTION).add(newTransaction);
    const [doc, categoryDoc] = await Promise.all([
      docRef.get(),
      categoryId ? db.collection(CATEGORIES_COLLECTION).doc(String(categoryId)).get() : null
    ]);

    const data = doc.data()!;
    return res.status(201).json({
      id: doc.id,
      ...data,
      amount: parseFloat(data.amount),
      categoryName: categoryDoc?.exists ? categoryDoc.data()?.name : "Tidak Berkategori",
      createdAt: data.createdAt.toDate().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create transaction" });
  }
});

router.get("/transactions/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });

    const data = doc.data()!;
    const categoryDoc = data.categoryId ? await db.collection(CATEGORIES_COLLECTION).doc(data.categoryId).get() : null;

    return res.json({
      id: doc.id,
      ...data,
      amount: parseFloat(data.amount),
      categoryName: categoryDoc?.exists ? categoryDoc.data()?.name : "Tidak Berkategori",
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

router.delete("/transactions/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    await db.collection(COLLECTION).doc(id).delete();
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete transaction" });
  }
});

export default router;
