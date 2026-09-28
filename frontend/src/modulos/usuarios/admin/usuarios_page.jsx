import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { ETIQUETAS_ROL } from "compartido/reglas/usuarios.js";
import Boton from "@/componentes/ui/boton.jsx";
import ConfirmDialog from "@/componentes/ui/confirm_dialog.jsx";
import Insignia from "@/componentes/ui/insignia.jsx";
import Paginacion from "@/componentes/ui/paginacion.jsx";
import Tabla from "@/componentes/ui/tabla.jsx";
import SearchField from "@/componentes/ui/search_field.jsx";
import SelectField from "@/componentes/ui/select_field.jsx";
import { Cargando, ErrorCarga, Vacio } from "@/componentes/ui/estado_carga.jsx";
import { useToast } from "@/componentes/toast/toast_context.jsx";
import { mensajeDeError } from "@/api/http.js";
import { useCambiarContrasenaUsuario, useCambiarEstadoUsuario, useCrearUsuario, useEditarUsuario, useUsuarios } from "../hooks/use_usuarios.js";
import ContrasenaModal from "./contrasena_modal.jsx";
import UsuarioAcciones from "./usuario_acciones.jsx";
import UsuarioFormModal from "./usuario_form_modal.jsx";

const FILTROS_ROL = [
  { valor: "", etiqueta: "Usuarios del panel" },
  { valor: "admin", etiqueta: "Administradores" },
  { valor: "staff", etiqueta: "Personal" },
  { valor: "cliente", etiqueta: "Clientes" },
];
const FILTROS_ESTADO = [
  { valor: "", etiqueta: "Activos e inactivos" },
  { valor: "activos", etiqueta: "Solo activos" },
  { valor: "inactivos", etiqueta: "Solo inactivos" },
];
const TONO_ROL = { super_admin: "info", admin: "info", staff: "neutro", cliente: "neutro" };

const nombreCompleto = (u) => [u.nombre, u.apellido].filter(Boolean).join(" ");
const ultimoIngreso = (u) => (u.ultimo_login ? new Date(u.ultimo_login).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "Nunca ingresó");

function Insignias({ usuario }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      <Insignia tono={TONO_ROL[usuario.rol]}>{ETIQUETAS_ROL[usuario.rol] ?? "Sin rol"}</Insignia>
      {!usuario.activo && <Insignia tono="peligro">Inactivo</Insignia>}
    </span>
  );
}

export default function UsuariosPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const filtros = { q: params.get("q") ?? "", rol: params.get("rol") ?? "", estado: params.get("estado") ?? "", pagina: Number(params.get("pagina") ?? 1) };
  const usuarios = useUsuarios(filtros);
  const crear = useCrearUsuario();
  const editar = useEditarUsuario();
  const cambiarEstado = useCambiarEstadoUsuario();
  const cambiarContrasena = useCambiarContrasenaUsuario();
  const [formulario, setFormulario] = useState(null); // { usuario } — usuario null = alta
  const [conContrasena, setConContrasena] = useState(null);
  const [desactivando, setDesactivando] = useState(null);

  const actualizar = useCallback(
    (clave, valor) =>
      setParams((actuales) => {
        const nuevos = new URLSearchParams(actuales);
        if (valor) nuevos.set(clave, valor);
        else nuevos.delete(clave);
        if (clave !== "pagina") nuevos.delete("pagina");
        return nuevos;
      }),
    [setParams],
  );
  const buscar = useCallback((texto) => actualizar("q", texto), [actualizar]);

  async function guardar(datos) {
    await (datos.id ? editar : crear).mutateAsync(datos);
    toast.exito(datos.id ? "Usuario actualizado" : "Usuario creado");
    setFormulario(null);
  }

  async function guardarContrasena(datos) {
    await cambiarContrasena.mutateAsync(datos);
    toast.exito("Contraseña cambiada");
    setConContrasena(null);
  }

  async function aplicarEstado(usuario, activo) {
    try {
      await cambiarEstado.mutateAsync({ id: usuario.id, activo });
      toast.exito(activo ? `${usuario.nombre} puede volver a ingresar` : `${usuario.nombre} ya no puede ingresar`);
      setDesactivando(null);
    } catch (error) {
      toast.error(mensajeDeError(error));
    }
  }

  // Desactivar pide confirmación; reactivar no hace daño y se aplica directo.
  const alCambiarEstado = (usuario) => (usuario.activo ? setDesactivando(usuario) : aplicarEstado(usuario, true));
  const acciones = { onEditar: (u) => setFormulario({ usuario: u }), onContrasena: setConContrasena, onEstado: alCambiarEstado };
  const lista = usuarios.data?.usuarios ?? [];

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-titulos text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-texto-suave">Quién entra al panel y con qué permisos.</p>
        </div>
        <Boton onClick={() => setFormulario({ usuario: null })}>
          <UserPlus className="h-4 w-4" aria-hidden="true" /> Nuevo usuario
        </Boton>
      </header>

      <div className="mt-6 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
        <SearchField valor={filtros.q} onBuscar={buscar} etiqueta="Buscar usuarios" placeholder="Nombre, apellido o email" />
        <SelectField name="rol" aria-label="Filtrar por rol" opciones={FILTROS_ROL} value={filtros.rol} onChange={(e) => actualizar("rol", e.target.value)} className="mt-0" />
        <SelectField name="estado" aria-label="Filtrar por estado" opciones={FILTROS_ESTADO} value={filtros.estado} onChange={(e) => actualizar("estado", e.target.value)} className="mt-0" />
      </div>

      <div className="mt-6">
        {usuarios.isPending ? (
          <Cargando texto="Cargando usuarios..." />
        ) : usuarios.isError ? (
          <ErrorCarga error={usuarios.error} onReintentar={usuarios.refetch} />
        ) : lista.length === 0 ? (
          <Vacio titulo="No hay usuarios para mostrar" texto="Probá con otros filtros." />
        ) : (
          <>
            <Tabla
              etiqueta="Usuarios"
              filas={lista}
              columnas={[
                {
                  titulo: "Usuario",
                  principal: true,
                  celda: (u) => (
                    <>
                      <p className="truncate font-semibold">{nombreCompleto(u)}</p>
                      <p className="truncate text-xs text-texto-suave">{u.email}</p>
                    </>
                  ),
                },
                { titulo: "Rol", celda: (u) => <Insignias usuario={u} /> },
                { titulo: "Último ingreso", className: "text-texto-suave", celda: ultimoIngreso },
              ]}
              acciones={(u, { enTarjeta }) => <UsuarioAcciones usuario={u} {...acciones} conTexto={enTarjeta} />}
            />
            <Paginacion paginacion={usuarios.data.paginacion} onCambiar={(p) => actualizar("pagina", String(p))} deshabilitado={usuarios.isFetching} />
          </>
        )}
      </div>

      {formulario && <UsuarioFormModal usuario={formulario.usuario} onGuardar={guardar} onCerrar={() => setFormulario(null)} />}
      {conContrasena && <ContrasenaModal usuario={conContrasena} onGuardar={guardarContrasena} onCerrar={() => setConContrasena(null)} />}
      <ConfirmDialog
        abierto={Boolean(desactivando)}
        titulo={`¿Desactivar a ${desactivando?.nombre ?? ""}?`}
        mensaje="No va a poder ingresar y se le cierra la sesión. Su historial (pedidos, movimientos) se conserva y lo podés reactivar cuando quieras."
        textoConfirmar="Desactivar"
        cargando={cambiarEstado.isPending}
        onConfirmar={() => aplicarEstado(desactivando, false)}
        onCerrar={() => setDesactivando(null)}
      />
    </div>
  );
}
