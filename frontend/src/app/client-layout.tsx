"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import "../styles.css";
import { I18nProvider } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";

const queryClient = new QueryClient();

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("PWA ServiceWorker registered with scope:", reg.scope))
        .catch((err) => console.warn("PWA ServiceWorker registration failed:", err));
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppShell>{children}</AppShell>
      </I18nProvider>
    </QueryClientProvider>
  );
}
