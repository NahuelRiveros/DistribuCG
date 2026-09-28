import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/catalogo_api.js";

export const catalogoKeys = {
  todo: ["catalogo"],
  categorias: () => ["catalogo", "categorias"],
  productos: () => ["catalogo", "productos"],
  listaProductos: (filtros) => ["catalogo", "productos", "lista", filtros],
  producto: (clave) => ["catalogo", "productos", "detalle", String(clave)],
};

export function useCategorias() {
  return useQuery({ queryKey: catalogoKeys.categorias(), queryFn: api.listarCategorias, staleTime: 60_000 });
}

export function useProductos(filtros) {
  return useQuery({
    queryKey: catalogoKeys.listaProductos(filtros),
    queryFn: () => api.listarProductos(filtros),
    placeholderData: keepPreviousData, // la tabla no parpadea al cambiar de página
  });
}

export function useProducto(clave, { enabled = true } = {}) {
  return useQuery({ queryKey: catalogoKeys.producto(clave), queryFn: () => api.obtenerProducto(clave), enabled: enabled && clave != null });
}

// Cualquier cambio en el catálogo invalida categorías (conteos) y productos.
function useMutacionCatalogo(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogoKeys.todo }),
  });
}

export const useGuardarCategoria = () => useMutacionCatalogo((datos) => (datos.id ? api.actualizarCategoria(datos) : api.crearCategoria(datos)));
export const useEliminarCategoria = () => useMutacionCatalogo(api.eliminarCategoria);
export const useGuardarProducto = () => useMutacionCatalogo((datos) => (datos.id ? api.actualizarProducto(datos) : api.crearProducto(datos)));
export const useCambiarEstadoProducto = () => useMutacionCatalogo(api.cambiarEstadoProducto);
export const useEliminarProducto = () => useMutacionCatalogo(api.eliminarProducto);

// La vista previa (simular) no cambia nada: solo se invalida al aplicar.
export function useAjustarPrecios() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.ajustarPrecios,
    onSuccess: (resultado) => {
      if (resultado.aplicado) queryClient.invalidateQueries({ queryKey: catalogoKeys.todo });
    },
  });
}

export const useSubirImagen = () => useMutacionCatalogo(api.subirImagen);
export const useAgregarImagenUrl = () => useMutacionCatalogo(api.agregarImagenUrl);
export const useOrdenarImagenes = () => useMutacionCatalogo(api.ordenarImagenes);
export const useEliminarImagen = () => useMutacionCatalogo(api.eliminarImagen);
