import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Local storage helpers
const getLocalStorage = (key: string, initial: any) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return initial;
  }
};

const setLocalStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const defaultCategories = [
  { id: "1", name: "Bahan Bakar", color: "#ef4444" },
  { id: "2", name: "Logistik", color: "#3b82f6" },
  { id: "3", name: "Operasional", color: "#10b981" },
  { id: "4", name: "Lain-lain", color: "#f59e0b" }
];

const defaultTransactions = [
  { id: "t1", amount: 5000000, type: "income", description: "Dana Ops Regu 1", date: "2026-06-10", categoryId: "3", createdAt: new Date("2026-06-10T10:00:00Z").toISOString() },
  { id: "t2", amount: 250000, type: "expense", description: "Bensin Mobil Dinas", date: "2026-06-11", categoryId: "1", createdAt: new Date("2026-06-11T11:00:00Z").toISOString() },
  { id: "t3", amount: 400000, type: "expense", description: "Makan Siang Anggota", date: "2026-06-12", categoryId: "2", createdAt: new Date("2026-06-12T12:30:00Z").toISOString() }
];

// Query Keys mock
export const getListTransactionsQueryKey = (params?: any) => ["transactions", params];
export const getListCategoriesQueryKey = (params?: any) => ["categories", params];
export const getGetSummaryQueryKey = () => ["summary"];
export const getGetMonthlySummaryQueryKey = () => ["monthly-summary"];
export const getGetExpenseByCategoryQueryKey = () => ["expense-by-category"];

// Dummy handlers
export const setBaseUrl = (url: string) => {};
export const setAuthTokenGetter = (fn: any) => {};

// Hooks
export const useListCategories = (options?: any) => {
  return useQuery({
    queryKey: getListCategoriesQueryKey(),
    queryFn: () => {
      return getLocalStorage("mock_categories", defaultCategories);
    },
    ...options?.query
  });
};

export const useCreateCategory = (options?: any) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCat: { name: string; color: string }) => {
      const categories = getLocalStorage("mock_categories", defaultCategories);
      const category = {
        id: String(Date.now()),
        name: newCat.name,
        color: newCat.color
      };
      categories.push(category);
      setLocalStorage("mock_categories", categories);
      return category;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      if (options?.mutation?.onSuccess) {
        options.mutation.onSuccess(data, variables, context);
      }
    },
    ...options?.mutation
  });
};

export const useListTransactions = (params?: any, options?: any) => {
  return useQuery({
    queryKey: getListTransactionsQueryKey(params),
    queryFn: () => {
      const txs = getLocalStorage("mock_transactions", defaultTransactions);
      const categories = getLocalStorage("mock_categories", defaultCategories);
      
      let filtered = [...txs];
      if (params?.type && params.type !== "all") {
        filtered = filtered.filter(t => t.type === params.type);
      }
      
      // Map category name
      const categoriesMap = new Map(categories.map((c: any) => [c.id, c.name]));
      const mapped = filtered.map(t => ({
        ...t,
        categoryName: categoriesMap.get(t.categoryId) || "Tidak Berkategori"
      }));
      
      // Sort by date desc
      mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (params?.limit) {
        return mapped.slice(0, params.limit);
      }
      return mapped;
    },
    ...options?.query
  });
};

export const useCreateTransaction = (options?: any) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTx: any) => {
      const txs = getLocalStorage("mock_transactions", defaultTransactions);
      const tx = {
        id: String(Date.now()),
        amount: Number(newTx.amount),
        type: newTx.type,
        description: newTx.description,
        date: newTx.date,
        categoryId: newTx.categoryId || null,
        createdAt: new Date().toISOString()
      };
      txs.push(tx);
      setLocalStorage("mock_transactions", txs);
      return tx;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMonthlySummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetExpenseByCategoryQueryKey() });
      if (options?.mutation?.onSuccess) {
        options.mutation.onSuccess(data, variables, context);
      }
    },
    ...options?.mutation
  });
};

export const useDeleteTransaction = (options?: any) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      let txs = getLocalStorage("mock_transactions", defaultTransactions);
      txs = txs.filter((t: any) => t.id !== id);
      setLocalStorage("mock_transactions", txs);
      return { id };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMonthlySummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetExpenseByCategoryQueryKey() });
      if (options?.mutation?.onSuccess) {
        options.mutation.onSuccess(data, variables, context);
      }
    },
    ...options?.mutation
  });
};

export const useGetSummary = (options?: any) => {
  return useQuery({
    queryKey: getGetSummaryQueryKey(),
    queryFn: () => {
      const txs = getLocalStorage("mock_transactions", defaultTransactions);
      let totalIncome = 0;
      let totalExpense = 0;
      txs.forEach((t: any) => {
        if (t.type === "income") {
          totalIncome += t.amount;
        } else {
          totalExpense += t.amount;
        }
      });
      return {
        balance: totalIncome - totalExpense,
        totalIncome,
        totalExpense
      };
    },
    ...options?.query
  });
};

export const useGetMonthlySummary = (options?: any) => {
  return useQuery({
    queryKey: getGetMonthlySummaryQueryKey(),
    queryFn: () => {
      const txs = getLocalStorage("mock_transactions", defaultTransactions);
      
      // Group by month
      const monthlyData: Record<string, { month: string; income: number; expense: number }> = {};
      
      txs.forEach((t: any) => {
        const date = new Date(t.date);
        const monthYear = date.toLocaleString("id-ID", { month: "short" });
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { month: monthYear, income: 0, expense: 0 };
        }
        if (t.type === "income") {
          monthlyData[monthYear].income += t.amount;
        } else {
          monthlyData[monthYear].expense += t.amount;
        }
      });
      
      return Object.values(monthlyData);
    },
    ...options?.query
  });
};

export const useGetExpenseByCategory = (options?: any) => {
  return useQuery({
    queryKey: getGetExpenseByCategoryQueryKey(),
    queryFn: () => {
      const txs = getLocalStorage("mock_transactions", defaultTransactions);
      const categories = getLocalStorage("mock_categories", defaultCategories);
      
      const categoryMap = new Map(categories.map((c: any) => [c.id, c]));
      const expenseMap: Record<string, { categoryId: string; categoryName: string; amount: number; color: string }> = {};
      
      txs.forEach((t: any) => {
        if (t.type === "expense") {
          const cat = categoryMap.get(t.categoryId) as any;
          const name = cat ? cat.name : "Tidak Berkategori";
          const color = cat ? cat.color : "#9ca3af";
          const id = t.categoryId || "none";
          
          if (!expenseMap[id]) {
            expenseMap[id] = { categoryId: id, categoryName: name, amount: 0, color };
          }
          expenseMap[id].amount += t.amount;
        }
      });
      
      return Object.values(expenseMap);
    },
    ...options?.query
  });
};
