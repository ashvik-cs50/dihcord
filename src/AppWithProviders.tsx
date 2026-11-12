import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ConvexProvider } from "convex/react";
import "./index.css";
import App from "./App";
import { convexClient, isConvexConfigured } from "@/lib/convex";
import { AuthProvider } from "@/contexts/AuthContext";
import { UIProvider } from "@/contexts/UIContext";
import { ThemeProvider } from "@/contexts/themes/ThemeProvider";

export function AppWithProviders() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <UIProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </UIProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const rootElement = document.getElementById("root")!;

const renderApp = () => {
  if (isConvexConfigured() && convexClient) {
    return (
      <ConvexProvider client={convexClient}>
        <AppWithProviders />
      </ConvexProvider>
    );
  }

  return <AppWithProviders />;
};

createRoot(rootElement).render(
  <StrictMode>
    {renderApp()}
  </StrictMode>,
);
