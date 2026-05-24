"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, LogIn, UserRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Role = "customer" | "company";
type Mode = "sign-in" | "sign-up";

export function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("customer");
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("sara.johnson@gmail.com");
  const [password, setPassword] = useState("bookleaf123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, role, email, password }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message ?? "Login failed.");
      }

      window.localStorage.setItem("bookleaf_session", JSON.stringify(payload.data));
      router.push(payload.data.role === "company" ? "/company" : "/author");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background text-foreground lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative flex flex-col justify-between border-r border-border bg-sidebar/70 p-6 lg:p-10">
        <div>
          <div className="text-3xl font-semibold tracking-normal text-brand-ink">
            BookLeaf Publication
          </div>
          <p className="mt-8 max-w-lg text-base leading-7 text-muted-foreground">
            AI support for author queries with Supabase records, RAG grounding, confidence checks,
            and human escalation.
          </p>
        </div>
        <div className="mt-8 grid gap-3 text-sm text-muted-foreground">
          <div>Customer accounts open the author support chat.</div>
          <div>Admin accounts open the human-review support queue.</div>
          <div>New accounts are saved in Supabase with secure password hashes.</div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md rounded-[8px] border border-border bg-panel/95 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                {mode === "sign-in" ? "Login" : "Create account"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use email and password to enter BookLeaf.
              </p>
            </div>
            <Badge variant="outline">Supabase</Badge>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={cn(
                "rounded-md border border-border p-3 text-left text-sm transition-colors hover:bg-muted",
                role === "customer" && "border-primary bg-muted",
              )}
            >
              <UserRound className="h-4 w-4" />
              <div className="mt-2 font-medium">Customer</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("company")}
              className={cn(
                "rounded-md border border-border p-3 text-left text-sm transition-colors hover:bg-muted",
                role === "company" && "border-primary bg-muted",
              )}
            >
              <Building2 className="h-4 w-4" />
              <div className="mt-2 font-medium">Admin</div>
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            <Input
              value={email}
              onChange={(event) => {
                setError(null);
                setEmail(event.target.value);
              }}
              placeholder="Email address"
              type="email"
              autoComplete="email"
            />
            <Input
              value={password}
              onChange={(event) => {
                setError(null);
                setPassword(event.target.value);
              }}
              placeholder="Password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button className="mt-5 w-full" type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "sign-in" ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {mode === "sign-in" ? "Login" : "Create account"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
            }}
            className="mt-4 w-full text-center text-sm text-primary hover:underline"
          >
            {mode === "sign-in" ? "New member? Create an account" : "Already registered? Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
