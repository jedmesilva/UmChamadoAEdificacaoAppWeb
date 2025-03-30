import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { SupabaseAuthProvider } from "./hooks/use-supabase-auth";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <SupabaseAuthProvider>
      <App />
    </SupabaseAuthProvider>
  </QueryClientProvider>
);