import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { setupAPIErrorSuppression } from "./lib/api-utils";

// Konsol hatalarını bastırmak için API hata bastırma işlevini etkinleştir
setupAPIErrorSuppression();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <App />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
