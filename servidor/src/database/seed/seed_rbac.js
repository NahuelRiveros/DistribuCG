import { Rol, ModuloNegocio, Modulo } from "../../models/index.js";

export async function seed_rbac() {
  // Roles genéricos, pensados para reusar en cualquier vertical (gym,
  // eccomerce, distribuidora, etc.) — nada de nombres específicos de un
  // dominio. "profesional" es el único rol con semántica especial en código
  // hoy (ver asignacion_profesional.js): alguien con acceso restringido a
  // sus propios clientes/pacientes asignados, no a todos. Lo usa
  // kinesiología hoy, pero cualquier módulo futuro con la misma necesidad
  // (ej. un entrenador con sus propios alumnos) puede reusarlo tal cual.
  const roles = [
    { codigo: "super_admin", descripcion: "Super administrador de la plataforma" },
    { codigo: "admin",       descripcion: "Administrador del negocio" },
    { codigo: "staff",       descripcion: "Personal" },
    { codigo: "profesional", descripcion: "Profesional" },
    // Rol que se asigna automáticamente al auto-registrarse desde /register
    // (POST /auth/register) — clientes externos de un módulo con catálogo
    // propio (hoy: eccomerce_distribuidora), no personal interno.
    { codigo: "cliente",     descripcion: "Cliente" },
    // Acceso acotado a pedidos (ver/procesar notas de pedido) SIN tocar
    // catálogo — separado de "staff" a propósito para poder darle este
    // acceso a alguien sin darle también alta/baja de productos.
    { codigo: "vendedor",    descripcion: "Vendedor" },
  ];
  for (const rol of roles) {
    await Rol.findOrCreate({ where: { codigo: rol.codigo }, defaults: rol });
  }

  // Módulos de negocio (gate real de licencia, ver requireModuloHabilitado) —
  // findOrCreate no pisa el habilitado si un cliente ya lo togleó antes.
  const modulosNegocio = [
    { codigo: "gym",                    descripcion: "Gestión de gimnasio",     habilitado: true },
    { codigo: "kinesiologia",           descripcion: "Kinesiología",            habilitado: true },
    { codigo: "stock",                  descripcion: "Kiosco y stock",          habilitado: true },
    { codigo: "eccomerce_indumentaria", descripcion: "Tienda de indumentaria",  habilitado: true },
    { codigo: "eccomerce_distribuidora", descripcion: "Distribuidora",          habilitado: true },
  ];
  for (const modulo of modulosNegocio) {
    await ModuloNegocio.findOrCreate({ where: { codigo: modulo.codigo }, defaults: modulo });
  }

  // Secciones del panel de gestión de roles — reflejan las áreas reales de la app (routes/)
  const modulos = [
    { codigo: "alumnos",      descripcion: "Gestión de alumnos",             orden: 1 },
    { codigo: "usuarios",     descripcion: "Usuarios y staff",               orden: 2 },
    { codigo: "pagos",        descripcion: "Pagos y membresías",             orden: 3 },
    { codigo: "planes",       descripcion: "Planes",                        orden: 4 },
    { codigo: "stock",        descripcion: "Kiosco y stock",                 orden: 5 },
    { codigo: "estadisticas", descripcion: "Estadísticas y recaudación",     orden: 6 },
    { codigo: "promociones",  descripcion: "Promociones",                    orden: 7 },
    { codigo: "kinesiologia", descripcion: "Kinesiología",                   orden: 8 },
    { codigo: "home",         descripcion: "Contenido del home",             orden: 9 },
    { codigo: "suscripcion",  descripcion: "Suscripción del software",       orden: 10 },
  ];
  for (const modulo of modulos) {
    await Modulo.findOrCreate({ where: { codigo: modulo.codigo }, defaults: modulo });
  }
}
