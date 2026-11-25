// src/app/Providers.tsx: wrap {children} with <Providers> in src/app/layout.tsx.
"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getQueryClient } from "@/lib/queryClient";
import { MockBanner } from "@/mocks/MockBanner";

// Tablet breakpoint from the UI profile: toasts sit top-center on mobile, bottom-right from tablet up.
const TABLET_UP = "(min-width: 768px)";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const isTabletUp = useMediaQuery(TABLET_UP);
  return (
    <QueryClientProvider client={queryClient}>
      {process.env.NODE_ENV === "development" &&
        process.env.NEXT_PUBLIC_API_MOCKING === "enabled" && <MockBanner />}
      {children}
      <Toaster richColors position={isTabletUp ? "bottom-right" : "top-center"} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
