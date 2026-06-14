import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Eye, EyeOff, Wallet } from "lucide-react";

export default function LoginPage({ onClose }: { onClose?: () => void }) {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@keuangan.com";
    const result = await login(adminEmail, password);
    setIsLoading(false);
    if (result.ok) {
      onClose?.();
    } else {
      setError(result.error ?? "Password salah");
      setPassword("");
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <Card className="w-full max-w-sm border-none shadow-2xl rounded-2xl">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">Login Admin</CardTitle>
          <CardDescription className="text-sm">
            Masukkan password untuk mengakses fitur admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 bg-secondary border-none h-12 rounded-xl"
                autoFocus
                data-testid="input-admin-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-sm text-destructive font-medium text-center" data-testid="text-login-error">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold"
              disabled={isLoading || !password}
              data-testid="button-login-submit"
            >
              {isLoading ? "Memverifikasi..." : "Masuk sebagai Admin"}
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-xl text-muted-foreground"
                onClick={onClose}
                data-testid="button-login-cancel"
              >
                Batal
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
