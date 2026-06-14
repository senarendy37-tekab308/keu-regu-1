import React, { useState } from "react";
import { 
  useListTransactions, 
  getListTransactionsQueryKey,
  useDeleteTransaction,
  getGetSummaryQueryKey,
  getGetMonthlySummaryQueryKey,
  getGetExpenseByCategoryQueryKey
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { formatIDR, formatDate } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight, Search, SlidersHorizontal, Trash2, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import TransactionForm from "@/components/forms/transaction-form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { isAdmin } = useAuth();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams = {
    ...(filterType !== "all" && { type: filterType as "income" | "expense" })
  };

  const { data: transactions, isLoading } = useListTransactions(
    queryParams,
    { query: { queryKey: getListTransactionsQueryKey(queryParams) } }
  );

  const deleteTx = useDeleteTransaction({
    mutation: {
      onSuccess: () => {
        toast({ title: "Transaksi dihapus" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMonthlySummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetExpenseByCategoryQueryKey() });
      }
    }
  });

  const filteredTransactions = transactions?.filter((tx: any) => 
    tx.description.toLowerCase().includes(search.toLowerCase()) || 
    (tx.categoryName && tx.categoryName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Transaksi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredTransactions ? `${filteredTransactions.length} transaksi` : ''}
          </p>
        </div>
        {isAdmin && <TransactionForm />}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari transaksi..." 
            className="pl-9 bg-card border-none shadow-sm rounded-xl h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[120px] bg-card border-none shadow-sm rounded-xl h-10 shrink-0" data-testid="select-filter-type">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Filter" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="income">Pemasukan</SelectItem>
            <SelectItem value="expense">Pengeluaran</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card className="border-none shadow-sm overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : filteredTransactions && filteredTransactions.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredTransactions.map((tx: any) => (
              <div
                key={tx.id}
                data-testid={`row-transaction-${tx.id}`}
                className="px-4 py-3 flex items-center gap-3"
              >
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                  tx.type === 'income' ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                )}>
                  {tx.type === 'income' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {formatDate(tx.date)}{tx.categoryName ? ` · ${tx.categoryName}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <p className={cn(
                    "font-semibold text-sm",
                    tx.type === 'income' ? "text-primary" : "text-foreground"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount)}
                  </p>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      data-testid={`button-delete-transaction-${tx.id}`}
                      onClick={() => {
                        if (confirm("Hapus transaksi ini?")) {
                          deleteTx.mutate({ id: tx.id });
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
            <Wallet className="w-10 h-10 text-muted mb-3" />
            <p className="text-sm font-medium">Tidak ada transaksi</p>
            <p className="text-xs mt-1">Coba ubah filter atau tambah transaksi baru.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
