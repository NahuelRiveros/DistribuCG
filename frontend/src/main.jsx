import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./app/query_client.js";
import { router } from "./app/router.jsx";
import { AuthProvider } from "./auth/auth_context.jsx"; // Login Futuro
import { ToastProvider } from "./controls/toast/toast_context.jsx";
import { CartProvider } from "./controls/carrito/cart_context.jsx";
import { CarritoDistribuidoraProvider } from "./modules/eccomerce_distribuidora/carrito/carrito_context.jsx";
import "./controls/config/apply_brand_theme.js";
import "../src/index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <CarritoDistribuidoraProvider>
              <RouterProvider router={router} />
            </CarritoDistribuidoraProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
 
