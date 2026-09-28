import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    // 30 s "fresco": ir y volver entre pantallas no repite pedidos a la API (cada mutación
    // igual invalida lo que cambió). Menos requests = menos trabajo para Render y Neon.
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});
