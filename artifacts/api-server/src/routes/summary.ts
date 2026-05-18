import { Router } from "express";
import { db } from "../lib/firebase";

const router = Router();
const TRANSACTIONS = "transactions";
const CATEGORIES = "categories";

router.get("/summary", async (_req, res) => {
  try {
    const snapshot = await db.collection(TRANSACTIONS).get();
    
    let totalIncome = 0;
    let totalExpense = 0;
    let transactionCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = parseFloat(data.amount);
      if (data.type === "income") totalIncome += amount;
      if (data.type === "expense") totalExpense += amount;
      transactionCount++;
    });

    return res.json({
      balance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      transactionCount,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate summary" });
  }
});

router.get("/summary/by-category", async (_req, res) => {
  try {
    const [transactionsSnapshot, categoriesSnapshot] = await Promise.all([
      db.collection(TRANSACTIONS).where("type", "==", "expense").get(),
      db.collection(CATEGORIES).get()
    ]);

    const categoriesMap = new Map(
      categoriesSnapshot.docs.map(doc => [doc.id, { name: doc.data().name, color: doc.data().color }])
    );

    const categoryStats = new Map<string, number>();
    let totalExpense = 0;

    transactionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = parseFloat(data.amount);
      const catId = data.categoryId || "null";
      categoryStats.set(catId, (categoryStats.get(catId) || 0) + amount);
      totalExpense += amount;
    });

    const result = Array.from(categoryStats.entries()).map(([catId, total]) => {
      const category = categoriesMap.get(catId);
      return {
        categoryId: catId === "null" ? null : catId,
        categoryName: category?.name || "Tidak Berkategori",
        color: category?.color || "#94a3b8",
        total,
        percentage: totalExpense > 0 ? (total / totalExpense) * 100 : 0,
      };
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate category summary" });
  }
});

router.get("/summary/monthly", async (_req, res) => {
  try {
    // Ambil data 6 bulan terakhir (sederhananya ambil semua untuk demo, 
    // atau pakai filter date >= sixMonthsAgo)
    const snapshot = await db.collection(TRANSACTIONS).get();

    const map = new Map<string, { month: number; year: number; income: number; expense: number }>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${year}-${month}`;
      
      if (!map.has(key)) map.set(key, { month, year, income: 0, expense: 0 });
      const entry = map.get(key)!;
      const amount = parseFloat(data.amount);
      if (data.type === "income") entry.income += amount;
      if (data.type === "expense") entry.expense += amount;
    });

    // Sort by year and month
    const result = Array.from(map.values()).sort((a, b) => 
      (a.year * 100 + a.month) - (b.year * 100 + b.month)
    );

    return res.json(result.slice(-6)); // Ambil 6 bulan terakhir
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate monthly summary" });
  }
});

export default router;
