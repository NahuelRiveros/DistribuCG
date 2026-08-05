import bcrypt from "bcrypt";
import { sequelize } from "./sequelize.js";
import { env } from "../configuracion_servidor/env.js";
import {
  Sexo, TipoDocumento, TipoPersona, AlumnoEstado, Rol, Modulo,
  TipoEjercicio, GrupoMuscular, HomeArea, Ejercicio,
  CategoriaProducto, Patologia,
  Persona, Usuario, UsuarioRol, ModuloNegocio,
  HomeTexto, HomePilar, HomeContacto,
} from "../models/index.js";
import { setupTablas, crearSuscripcionInicial } from "../services/software_suscripcion_service.js";

/**
 * Seed de catálogos + usuario super admin — idempotente, seguro de correr
 * en cada arranque del server. No pisa la contraseña de un usuario ya
 * creado (si necesitás resetearla, hacelo desde la app, no acá).
 */
export async function seed_database() {
  console.log("🌱 Sembrando datos base...");
  await seed_catalogos();
  await seed_ejercicios();
  await seed_home_contenido();
  await seed_super_admin();
  await seed_suscripcion();
  console.log("✅ Seed finalizado");
}

async function seed_suscripcion() {
  await setupTablas();
  const r = await crearSuscripcionInicial();
  if (r.ok) console.log(`✅ Suscripción inicial creada — vence ${r.vencimiento}`);
}

async function seedCatalogo(Modelo, valores) {
  for (const descripcion of valores) {
    await Modelo.findOrCreate({ where: { descripcion }, defaults: { descripcion } });
  }
}

// Grupos musculares con su "zona" (tren superior/inferior/core) — se usa
// para agrupar el select de ejercicios en "Registrar sesión" de kinesiología.
async function seed_grupos_musculares() {
  const grupos = [
    { descripcion: "Pecho",    zona: "Tren superior" },
    { descripcion: "Espalda",  zona: "Tren superior" },
    { descripcion: "Hombros",  zona: "Tren superior" },
    { descripcion: "Brazos",   zona: "Tren superior" },
    { descripcion: "Cervical", zona: "Tren superior" },
    { descripcion: "Piernas",  zona: "Tren inferior" },
    { descripcion: "Cadera",   zona: "Tren inferior" },
    { descripcion: "Core",     zona: "Core y tronco" },
  ];
  for (const g of grupos) {
    const [row] = await GrupoMuscular.findOrCreate({ where: { descripcion: g.descripcion }, defaults: g });
    if (row.zona !== g.zona) await row.update({ zona: g.zona });
  }
}

async function seed_catalogos() {
  await seedCatalogo(Sexo, ["Masculino", "Femenino", "Otro"]);
  await seedCatalogo(TipoDocumento, ["DNI", "Pasaporte", "CUIL"]);
  await seedCatalogo(TipoPersona, ["Alumno", "Profesor", "Administrativo", "Paciente Kinesiología"]);
  // Orden fijo: el cron y varios services asumen Activo=1, Inactivo=2, Suspendido=3
  await seedCatalogo(AlumnoEstado, ["Activo", "Inactivo", "Suspendido"]);
  await seedCatalogo(TipoEjercicio, ["Fuerza", "Kinesiología", "Cardio"]);
  await seed_grupos_musculares();
  await seedCatalogo(HomeArea, ["Gym", "Kinesiología", "General"]);
  await seedCatalogo(CategoriaProducto, ["Bebidas", "Suplementos", "Snacks", "Accesorios", "Indumentaria"]);
  await seedCatalogo(Patologia, [
    "Lumbalgia", "Cervicalgia", "Dorsalgia", "Ciática",
    "Esguince de tobillo", "Tendinitis de hombro", "Hernia de disco",
    "Escoliosis", "Fascitis plantar", "Síndrome del túnel carpiano",
    "Artrosis de rodilla", "Contractura muscular", "Desgarro muscular", "Bursitis",
  ]);

  const roles = [
    { codigo: "super_admin", descripcion: "Super administrador de la plataforma" },
    { codigo: "admin",       descripcion: "Administrador del gimnasio" },
    { codigo: "staff",       descripcion: "Personal del gimnasio" },
    { codigo: "kinesiologo", descripcion: "Kinesiólogo" },
  ];
  for (const rol of roles) {
    await Rol.findOrCreate({ where: { codigo: rol.codigo }, defaults: rol });
  }

  // Módulos de negocio (gate real de licencia, ver requireModuloHabilitado) —
  // findOrCreate no pisa el habilitado si un cliente ya lo togleó antes.
  const modulosNegocio = [
    { codigo: "gym",          descripcion: "Gestión de gimnasio", habilitado: true },
    { codigo: "kinesiologia", descripcion: "Kinesiología",        habilitado: true },
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

async function seed_ejercicios() {
  const tiposPorNombre  = Object.fromEntries((await TipoEjercicio.findAll()).map((t) => [t.descripcion, t.id]));
  const gruposPorNombre = Object.fromEntries((await GrupoMuscular.findAll()).map((g) => [g.descripcion, g.id]));

  const ejercicios = [
    // Fuerza
    { nombre: "Press banca plano",       tipo: "Fuerza", grupo: "Pecho" },
    { nombre: "Press banca inclinado",   tipo: "Fuerza", grupo: "Pecho" },
    { nombre: "Aperturas con mancuerna", tipo: "Fuerza", grupo: "Pecho" },
    { nombre: "Dominadas",               tipo: "Fuerza", grupo: "Espalda" },
    { nombre: "Remo con barra",          tipo: "Fuerza", grupo: "Espalda" },
    { nombre: "Peso muerto",             tipo: "Fuerza", grupo: "Espalda" },
    { nombre: "Sentadilla",              tipo: "Fuerza", grupo: "Piernas" },
    { nombre: "Prensa de piernas",       tipo: "Fuerza", grupo: "Piernas" },
    { nombre: "Zancadas",                tipo: "Fuerza", grupo: "Piernas" },
    { nombre: "Press militar",           tipo: "Fuerza", grupo: "Hombros" },
    { nombre: "Elevaciones laterales",   tipo: "Fuerza", grupo: "Hombros" },
    { nombre: "Curl de bíceps",          tipo: "Fuerza", grupo: "Brazos" },
    { nombre: "Extensión de tríceps",    tipo: "Fuerza", grupo: "Brazos" },
    { nombre: "Plancha",                 tipo: "Fuerza", grupo: "Core" },
    { nombre: "Crunch abdominal",        tipo: "Fuerza", grupo: "Core" },
    // Cardio — sin grupo muscular específico
    { nombre: "Cinta de correr", tipo: "Cardio", grupo: null },
    { nombre: "Bicicleta fija",  tipo: "Cardio", grupo: null },
    { nombre: "Elíptica",        tipo: "Cardio", grupo: null },
    // Kinesiología — tren superior
    { nombre: "Movilidad de hombro",                      tipo: "Kinesiología", grupo: "Hombros" },
    { nombre: "Rotación externa de hombro con banda",     tipo: "Kinesiología", grupo: "Hombros" },
    { nombre: "Rotación interna de hombro con banda",     tipo: "Kinesiología", grupo: "Hombros" },
    { nombre: "Fortalecimiento de manguito rotador",      tipo: "Kinesiología", grupo: "Hombros" },
    { nombre: "Elevación en plano escapular (scaption)",  tipo: "Kinesiología", grupo: "Hombros" },
    { nombre: "Retracción escapular",                     tipo: "Kinesiología", grupo: "Espalda" },
    { nombre: "Remo con banda elástica",                  tipo: "Kinesiología", grupo: "Espalda" },
    { nombre: "Estiramiento de pectoral en marco de puerta", tipo: "Kinesiología", grupo: "Pecho" },
    { nombre: "Movilidad de muñeca y antebrazo",          tipo: "Kinesiología", grupo: "Brazos" },
    { nombre: "Movilidad cervical",                       tipo: "Kinesiología", grupo: "Cervical" },
    { nombre: "Flexo-extensión cervical isométrica",      tipo: "Kinesiología", grupo: "Cervical" },
    { nombre: "Estiramiento de trapecio superior",        tipo: "Kinesiología", grupo: "Cervical" },
    // Kinesiología — tren inferior
    { nombre: "Estiramiento de isquiotibiales",           tipo: "Kinesiología", grupo: "Piernas" },
    { nombre: "Propiocepción de tobillo",                 tipo: "Kinesiología", grupo: "Piernas" },
    { nombre: "Elevación de talones (gemelos)",           tipo: "Kinesiología", grupo: "Piernas" },
    { nombre: "Fortalecimiento de cuádriceps en cadena cerrada", tipo: "Kinesiología", grupo: "Piernas" },
    { nombre: "Step-up al escalón",                       tipo: "Kinesiología", grupo: "Piernas" },
    { nombre: "Equilibrio monopodal",                     tipo: "Kinesiología", grupo: "Piernas" },
    { nombre: "Puente de glúteos",                        tipo: "Kinesiología", grupo: "Cadera" },
    { nombre: "Movilidad de cadera en cuadrupedia",       tipo: "Kinesiología", grupo: "Cadera" },
    { nombre: "Abducción de cadera en decúbito lateral",  tipo: "Kinesiología", grupo: "Cadera" },
    { nombre: "Estiramiento de flexores de cadera",       tipo: "Kinesiología", grupo: "Cadera" },
    { nombre: "Almeja con banda (clamshell)",             tipo: "Kinesiología", grupo: "Cadera" },
    // Kinesiología — core y tronco
    { nombre: "Fortalecimiento de core lumbar",           tipo: "Kinesiología", grupo: "Core" },
    { nombre: "Dead bug",                                 tipo: "Kinesiología", grupo: "Core" },
    { nombre: "Bird dog",                                 tipo: "Kinesiología", grupo: "Core" },
    { nombre: "Estiramiento lumbar (gato-camello)",       tipo: "Kinesiología", grupo: "Core" },
    { nombre: "Plancha frontal isométrica",               tipo: "Kinesiología", grupo: "Core" },
    // Kinesiología — evaluación inicial (test funcional y test de fuerza)
    { nombre: "Sentadilla con barra por encima de la cabeza", tipo: "Kinesiología", grupo: "Piernas" },
    { nombre: "Estocadas",                                    tipo: "Kinesiología", grupo: "Piernas" },
    { nombre: "Sentadilla a una pierna",                      tipo: "Kinesiología", grupo: "Piernas" },
    { nombre: "Hip thrust",                                   tipo: "Kinesiología", grupo: "Cadera" },
  ];

  for (const ej of ejercicios) {
    const tipo_ejercicio_id = tiposPorNombre[ej.tipo] ?? null;
    const grupo_muscular_id = ej.grupo ? (gruposPorNombre[ej.grupo] ?? null) : null;

    const [row] = await Ejercicio.findOrCreate({
      where: { nombre: ej.nombre },
      defaults: { nombre: ej.nombre, tipo_ejercicio_id, grupo_muscular_id },
    });

    // findOrCreate no actualiza filas ya existentes — si el ejercicio ya
    // estaba sembrado (ej. de antes de tener grupo_muscular), sincronizamos
    // su grupo/tipo acá para que no quede desactualizado.
    if (row.tipo_ejercicio_id !== tipo_ejercicio_id || row.grupo_muscular_id !== grupo_muscular_id) {
      await row.update({ tipo_ejercicio_id, grupo_muscular_id });
    }
  }
}

// Copia exacta de lo que hoy está hardcodeado en home_page.jsx — así el sitio
// se ve igual apenas se despliega esto, hasta que alguien lo edite desde
// /admin/home-config. findOrCreate: no pisa ediciones ya hechas por el cliente.
async function seed_home_contenido() {
  const textos = [
    { clave: "hero_kicker",              etiqueta: "Texto de la pastilla superior",     seccion: "hero",       valor: "Centro de Entrenamiento y Kinesiología" },
    { clave: "hero_subtitulo",           etiqueta: "Subtítulo del hero",                seccion: "hero",       valor: "Entrenamiento 100 % personalizado con seguimiento real de cada ejercicio, y kinesiología para acompañar tu recuperación." },
    { clave: "hero_cta_primario",        etiqueta: "Texto del botón principal",         seccion: "hero",       valor: "Conocenos" },
    { clave: "hero_cta_secundario",      etiqueta: "Texto del botón secundario",        seccion: "hero",       valor: "Contacto" },
    { clave: "pilares_kicker",           etiqueta: "Texto pequeño de la sección",       seccion: "pilares",    valor: "Nuestro fuerte" },
    { clave: "pilares_titulo",           etiqueta: "Título (primera línea)",            seccion: "pilares",    valor: "Entrenamiento y kinesiología," },
    { clave: "pilares_titulo_resaltado", etiqueta: "Título (línea resaltada)",          seccion: "pilares",    valor: "en un solo lugar" },
    { clave: "galeria_kicker",           etiqueta: "Texto pequeño de la sección",       seccion: "galeria",    valor: "Lo que hacemos" },
    { clave: "galeria_titulo",           etiqueta: "Título de la sección",              seccion: "galeria",    valor: "Conocé el espacio" },
    { clave: "contacto_kicker",          etiqueta: "Texto pequeño de la sección",       seccion: "contacto",   valor: "Hablemos" },
    { clave: "contacto_titulo",          etiqueta: "Título de la sección",              seccion: "contacto",   valor: "Empezá hoy" },
    { clave: "footer_cta_titulo",        etiqueta: "Título (primera línea)",            seccion: "footer_cta", valor: "Movete con" },
    { clave: "footer_cta_titulo_resaltado", etiqueta: "Título (segunda línea)",         seccion: "footer_cta", valor: "un plan" },
    { clave: "footer_cta_texto",         etiqueta: "Texto debajo del título",           seccion: "footer_cta", valor: "Entrenamiento personalizado y kinesiología, pensados para vos." },
  ];
  for (const t of textos) {
    await HomeTexto.findOrCreate({ where: { clave: t.clave }, defaults: t });
  }

  const pilares = [
    { icono: "Dumbbell",   titulo: "Entrenamiento personalizado", texto: "Cada plan se arma a tu medida — objetivos, nivel y disponibilidad. Nada de rutinas genéricas.", orden: 1 },
    { icono: "HeartPulse", titulo: "Kinesiología",                texto: "Evaluación, recuperación y rehabilitación guiada por profesionales, integrada a tu entrenamiento.", orden: 2 },
  ];
  for (const p of pilares) {
    await HomePilar.findOrCreate({ where: { titulo: p.titulo }, defaults: p });
  }

  const contactos = [
    { icono: "MapPin",     label: "Ubicación",  valor: "[Tu dirección acá]", href: "#", orden: 1 },
    { icono: "Instagram",  label: "Instagram",  valor: "@kinetica",          href: "#", orden: 2 },
  ];
  for (const c of contactos) {
    await HomeContacto.findOrCreate({ where: { label: c.label }, defaults: c });
  }
}

async function seed_super_admin() {
  const { SUPERADMIN_NOMBRE, SUPERADMIN_APELLIDO, SUPERADMIN_DNI, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = env;

  if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD || !SUPERADMIN_DNI) {
    console.log("⏭️  SUPERADMIN_* incompleto en .env — se omite creación de super admin");
    return;
  }

  const documento = String(SUPERADMIN_DNI).replace(/[.\s]/g, "").trim();
  const email = String(SUPERADMIN_EMAIL).trim().toLowerCase();

  await sequelize.transaction(async (t) => {
    const tipoDocumentoDni = await TipoDocumento.findOne({ where: { descripcion: "DNI" }, transaction: t });

    let persona = await Persona.findOne({ where: { documento }, transaction: t });
    if (!persona) {
      persona = await Persona.create({
        nombre: SUPERADMIN_NOMBRE,
        apellido: SUPERADMIN_APELLIDO,
        documento,
        email,
        tipo_documento_id: tipoDocumentoDni?.id ?? null,
      }, { transaction: t });
    }

    let usuario = await Usuario.findOne({ where: { persona_id: persona.id }, transaction: t });
    if (!usuario) {
      const contrasena = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
      usuario = await Usuario.create(
        { persona_id: persona.id, contrasena, activo: true },
        { transaction: t }
      );
    } else if (!usuario.activo) {
      await usuario.update({ activo: true }, { transaction: t });
    }

    for (const codigo of ["super_admin", "admin"]) {
      const rol = await Rol.findOne({ where: { codigo }, transaction: t });
      if (rol) {
        await UsuarioRol.findOrCreate({
          where: { usuario_id: usuario.id, rol_id: rol.id },
          transaction: t,
        });
      }
    }

    console.log(`✅ Super admin listo: ${email} (usuario_id=${usuario.id}, activo=true)`);
  });
}
