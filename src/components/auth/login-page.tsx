"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen, Building2, Check, LibraryBig, Loader2, LogIn, ShieldCheck, Sparkles, UserPlus, UserRound } from "lucide-react";
import { ImageStreamHero } from "@/components/ui/image-stream-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Role = "customer" | "company";
type Mode = "sign-in" | "sign-up";

const LIBRARY_IMAGES = [
  { src: "https://images.unsplash.com/photo-1532682908332-165811c1f832?auto=format&fit=crop&w=900&q=85", alt: "Grand historic bookstore interior" },
  { src: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=85", alt: "Warm library with tall bookshelves" },
  { src: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=85", alt: "Books arranged on a wooden shelf" },
  { src: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85", alt: "Open book in soft natural light" },
  { src: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=85", alt: "Stack of books with warm shadows" },
  { src: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=85", alt: "Elegant reading room lined with books" },
  { src: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=85", alt: "Vintage books and reading table" },
  { src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=85", alt: "Quiet library workspace with books" },
];

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
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message ?? "Login failed.");
      window.localStorage.setItem("bookleaf_session", JSON.stringify(payload.data));
      router.push(payload.data.role === "company" ? "/company" : "/author");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function selectRole(nextRole: Role) {
    setRole(nextRole);
    setError(null);
    if (mode === "sign-in") {
      setEmail(nextRole === "customer" ? "sara.johnson@gmail.com" : "admin@bookleaf.com");
      setPassword("bookleaf123");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f5f1] text-[#18181b]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(560px,1.16fr)_minmax(390px,0.84fr)]">
        <section className="relative z-10 flex min-h-screen flex-col bg-[#fbfaf8] px-6 py-7 sm:px-10 lg:order-2 lg:px-16 lg:py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1c2434] text-white shadow-lg shadow-slate-900/15"><BookOpen className="h-5 w-5" strokeWidth={1.8} /></div>
              <div><div className="text-[17px] font-semibold tracking-[-0.03em] text-[#1c2434]">BookLeaf</div><div className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#a37668]">Publication house</div></div>
            </div>
            <div className="hidden items-center gap-2 text-xs text-[#8f8581] sm:flex"><ShieldCheck className="h-4 w-4" /> Secure access</div>
          </div>

          <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12 lg:py-16">
            <div className="mb-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#eadbd2] bg-white px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#9c6e5d] shadow-sm"><Sparkles className="h-3.5 w-3.5" /> Your story, in good hands</div>
              <h1 className="max-w-sm text-4xl font-semibold tracking-[-0.055em] text-[#1c2434] sm:text-[46px] sm:leading-[1.03]">Welcome back to your next chapter.</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#857b78]">A calmer home for your books, author support, and everything that brings your story to life.</p>
            </div>

            <form onSubmit={submit} className="rounded-[26px] border border-[#ebe2dc] bg-white/90 p-5 shadow-[0_22px_70px_rgba(57,42,34,0.08)] backdrop-blur sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold tracking-[-0.025em] text-[#1c2434]">{mode === "sign-in" ? "Sign in" : "Create your account"}</h2><p className="mt-1 text-xs text-[#928985]">{mode === "sign-in" ? "Continue where your publishing journey left off." : "Start building your author workspace."}</p></div><div className="rounded-xl bg-[#f8efe9] p-2.5 text-[#a37668]"><LibraryBig className="h-4 w-4" /></div></div>

              <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-[#f8f6f3] p-1">
                {(["customer", "company"] as Role[]).map((item) => <button key={item} type="button" onClick={() => selectRole(item)} className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-[#958a85] transition-all", role === item && "bg-white text-[#1c2434] shadow-sm")}>{item === "customer" ? <UserRound className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}{item === "customer" ? "Author" : "Admin"}</button>)}
              </div>

              <div className="mt-5 grid gap-3">
                <label className="grid gap-1.5 text-xs font-medium text-[#615955]">Email address<Input className="h-11 rounded-xl border-[#e9dfd8] bg-[#fdfcfb] px-3.5 text-sm shadow-none focus-visible:ring-[#bb8a78]" value={email} onChange={(event) => { setError(null); setEmail(event.target.value); }} placeholder="you@example.com" type="email" autoComplete="email" /></label>
                <label className="grid gap-1.5 text-xs font-medium text-[#615955]">Password<Input className="h-11 rounded-xl border-[#e9dfd8] bg-[#fdfcfb] px-3.5 text-sm shadow-none focus-visible:ring-[#bb8a78]" value={password} onChange={(event) => { setError(null); setPassword(event.target.value); }} placeholder="Enter your password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} /></label>
              </div>

              {mode === "sign-in" && <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#fbf4ef] px-3 py-2 text-[11px] text-[#97776b]"><Check className="h-3.5 w-3.5" /> Demo: {role === "customer" ? "sara.johnson@gmail.com" : "admin@bookleaf.com"} · bookleaf123</div>}
              {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">{error}</div>}

              <Button className="mt-5 h-11 w-full rounded-xl bg-[#1c2434] text-sm text-white shadow-lg shadow-slate-900/15 transition-transform hover:-translate-y-0.5 hover:bg-[#28344b]" type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "sign-in" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}{mode === "sign-in" ? "Enter workspace" : "Create account"}<ArrowUpRight className="ml-auto h-4 w-4 opacity-60" /></Button>
              <button type="button" onClick={() => { setError(null); setMode((current) => current === "sign-in" ? "sign-up" : "sign-in"); }} className="mt-4 w-full text-center text-xs font-medium text-[#a37668] transition-colors hover:text-[#1c2434]">{mode === "sign-in" ? "New to BookLeaf? Create an account" : "Already have an account? Sign in"}</button>
            </form>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#aaa09b]"><span>© 2026 BookLeaf Publication</span><span>Private · Thoughtful · Human</span></div>
        </section>

        <section className="relative hidden min-h-screen overflow-hidden bg-[#182235] lg:order-1 lg:block">
          <ImageStreamHero images={LIBRARY_IMAGES} cards={12} speed={22} axis={53} className="h-full min-h-screen w-full">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(205,142,116,0.16),transparent_42%),linear-gradient(115deg,rgba(24,34,53,0.98)_0%,rgba(24,34,53,0.7)_37%,rgba(24,34,53,0.18)_100%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-16">
              <div className="flex items-center justify-between text-white/55"><span className="text-xs font-medium uppercase tracking-[0.28em]">The author&apos;s library</span><span className="flex items-center gap-2 text-xs"><span className="h-1.5 w-1.5 rounded-full bg-[#d69a80] shadow-[0_0_12px_#d69a80]" /> Live workspace</span></div>
              <div className="max-w-[530px] pb-5"><p className="mb-5 text-sm font-medium uppercase tracking-[0.25em] text-[#d69a80]">Make room for wonder</p><h2 className="text-5xl font-medium leading-[0.98] tracking-[-0.06em] text-white xl:text-7xl">Every good book begins with a door.</h2><p className="mt-7 max-w-md text-sm leading-7 text-white/55">Step into a considered space for your publishing journey — from the first page to the stories readers carry home.</p><div className="mt-9 flex items-center gap-3 text-sm text-white/80"><div className="flex -space-x-2">{LIBRARY_IMAGES.slice(0, 3).map((image) => <img key={image.src} src={image.src} alt="" className="h-8 w-8 rounded-full border-2 border-[#182235] object-cover" />)}</div><span>For authors, by people who care about books.</span></div></div>
              <div className="flex items-center gap-3 text-xs text-white/40"><span className="h-px w-10 bg-white/25" /> Stories in motion · 01</div>
            </div>
          </ImageStreamHero>
        </section>
      </div>
    </main>
  );
}
