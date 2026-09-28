import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { cliente } from "@/clientes/index.js";
import { queryClient } from "@/app/query_client.js";
import { router } from "@/app/router.jsx";
import { AuthProvider } from "@/modulos/usuarios/auth_context.jsx";
import { ToastProvider } from "@/componentes/toast/toast_context.jsx";
import { aplicarTema } from "@/componentes/layout/aplicar_tema.js";
import "./index.css";

aplicarTema(cliente);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
