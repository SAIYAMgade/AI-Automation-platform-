"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RoleGateway() {
  const router = useRouter();

  useEffect(() => {
    const raw = window.localStorage.getItem("bookleaf_session");
    if (!raw) {
      router.replace("/login");
      return;
    }

    try {
      const session = JSON.parse(raw) as { role?: string };
      router.replace(session.role === "company" ? "/company" : "/author");
    } catch {
      window.localStorage.removeItem("bookleaf_session");
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="text-sm text-muted-foreground">Opening BookLeaf workspace...</div>
    </main>
  );
}
