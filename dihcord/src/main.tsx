import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ConvexProvider } from "convex/react";
import "./index.css";
import App from "./App";
import { convexClient } from "@/lib/convex";
import { AuthProvider } from "@/contexts/AuthContext";
import { UIProvider } from "@/contexts/UIContext";
import { ThemeProvider } from "@/contexts/themes/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convexClient}>
      <ThemeProvider>
        <AuthProvider>
          <UIProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </UIProvider>
        </AuthProvider>
      </ThemeProvider>
    </ConvexProvider>
  </StrictMode>,
);
