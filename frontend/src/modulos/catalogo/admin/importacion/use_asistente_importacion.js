import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { importacionCatalogo as config, sugerirMapeo } from "compartido/importacion_catalogo.js";
import { mensajeDeError } from "@/api/http.js";
import { descargarArchivo } from "@/utils/descargar.js";
import { catalogoKeys } from "../../hooks/use_catalogo.js";
import { importacionApi as api } from "./importacion_api.js";

// Adaptado de DistribuCG (controls/importacion/use_import_wizard.js).
// Paso 1: archivo · Paso 2: columnas y opciones · Paso 3: revisión y carga por lotes.

// Opciones que cambian cómo se LEE el archivo: si cambian, hay que volver a leerlo.
const firmaLectura = (o) => JSON.stringify([o.hoja, o.fila_encabezado, o.separador, o.codificacion]);

export function useAsistenteImportacion() {
  const queryClient = useQueryClient();
  const [archivo, setArchivo] = useState(null);
  const [opciones, setOpciones] = useState(() => ({ ...config.opcionesPorDefecto }));
  const [vista, setVista] = useState(null);
  const [mapeo, setMapeo] = useState({});
  const [importacion, setImportacion] = useState(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [ejecutando, setEjecutando] = useState(false);
  const [omitirErrores, setOmitirErrores] = useState(false);
  const montado = useRef(true);
  const procesando = useRef(false);
  // Id de la validación: el mismo archivo y opciones reusan el id (el servidor no duplica).
  const validacion = useRef(null);

  // El historial es informativo: si falla, el asistente sigue funcionando.
  const historial = useQuery({ queryKey: [...catalogoKeys.todo, "importaciones"], queryFn: api.historial });
  const { refetch: recargarHistorial } = historial;
  const actualizarHistorial = useCallback(() => recargarHistorial(), [recargarHistorial]);

  // Solo al entrar y salir de la pantalla (sin dependencias): si dependiera de algo que
  // cambia en cada render, la limpieza pausaría la importación en medio de la carga.
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      procesando.current = false; // al salir de la pantalla se pausa después del lote en curso
    };
  }, []);

  async function hacer(accion) {
    setOcupado(true);
    setError("");
    try {
      await accion();
    } catch (e) {
      if (montado.current) setError(e.response ? mensajeDeError(e) : e.message);
    } finally {
      if (montado.current) setOcupado(false);
    }
  }

  function elegirArchivo(nuevo) {
    setArchivo(nuevo);
    setVista(null);
    setMapeo({});
    setImportacion(null);
    validacion.current = null;
    setError("");
  }

  const cambiarOpcion = (clave, valor) => setOpciones((actual) => ({ ...actual, [clave]: valor }));

  const leer = () =>
    hacer(async () => {
      if (!archivo) throw new Error("Elegí un archivo.");
      if (archivo.size > config.maxMb * 1024 * 1024) throw new Error(`El archivo supera ${config.maxMb} MB.`);
      const datos = await api.previsualizar(archivo, opciones);
      if (!montado.current) return;
      setVista({ ...datos, firma: firmaLectura(opciones) });
      setMapeo(sugerirMapeo(datos.columnas));
      validacion.current = null;
    });

  const validar = () =>
    hacer(async () => {
      const firma = JSON.stringify([mapeo, opciones]);
      if (!validacion.current || validacion.current.archivo !== archivo || validacion.current.firma !== firma) {
        validacion.current = { archivo, firma, id: crypto.randomUUID() };
      }
      const resultado = await api.validar(archivo, opciones, mapeo, validacion.current.id);
      if (!montado.current) return;
      setImportacion(resultado);
      setOmitirErrores(false);
      await actualizarHistorial();
    });

  /** Ejecuta los lotes uno por uno. Se puede pausar; al volver, sigue desde el siguiente. */
  async function ejecutar() {
    if (procesando.current) return;
    procesando.current = true;
    setEjecutando(true);
    setError("");
    try {
      let actual = await api.obtener(importacion.id);
      if (montado.current) setImportacion(actual);
      while (procesando.current && !["completado", "cancelado"].includes(actual.estado)) {
        actual = await api.ejecutarLote(actual.id, { indice: actual.siguiente_lote, confirmar: true, omitir_errores: omitirErrores });
        if (montado.current) setImportacion(actual);
      }
      if (actual.estado === "completado") queryClient.invalidateQueries({ queryKey: catalogoKeys.todo });
      await actualizarHistorial();
    } catch (e) {
      if (montado.current) setError(e.response ? mensajeDeError(e) : "Se cortó la conexión. Tocá “Reanudar”: se retoma desde el último lote guardado, sin duplicar.");
    } finally {
      procesando.current = false;
      if (montado.current) setEjecutando(false);
    }
  }

  return {
    archivo,
    opciones,
    vista: vista && vista.firma === firmaLectura(opciones) ? vista : null,
    mapeo,
    importacion,
    historial: historial.data ?? [],
    error,
    ocupado,
    ejecutando,
    omitirErrores,
    elegirArchivo,
    cambiarOpcion,
    asignarColumna: (campo, columna) => setMapeo((actual) => ({ ...actual, [campo]: columna })),
    leer,
    validar,
    ejecutar,
    pausar: () => {
      procesando.current = false;
    },
    setOmitirErrores,
    actualizarHistorial,
    abrir: (id) =>
      hacer(async () => {
        const encontrada = await api.obtener(id);
        if (montado.current) {
          setImportacion(encontrada);
          setOmitirErrores(false);
        }
      }),
    cancelar: () =>
      hacer(async () => {
        const cancelada = await api.cancelar(importacion.id);
        if (montado.current) setImportacion(cancelada);
        await actualizarHistorial();
      }),
    volver: () => {
      setImportacion(null);
      setOmitirErrores(false);
      validacion.current = null;
      setError("");
    },
    descargarPlantilla: () => hacer(async () => descargarArchivo(await api.plantilla(), "plantilla-catalogo.xlsx")),
    descargarInforme: () => hacer(async () => descargarArchivo(await api.informe(importacion.id), "informe-importacion.csv")),
  };
}
