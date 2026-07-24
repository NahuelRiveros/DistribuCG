import bcrypt from "bcrypt";
import { sequelize } from "./sequelize.js";
import { env } from "../configuracion_servidor/env.js";
import {
  Sexo, TipoDocumento, TipoPersona, AlumnoEstado, Rol, Modulo,
  TipoEjercicio, GrupoMuscular, HomeArea, Ejercicio,
  CategoriaProducto, Patologia,
  Persona, Usuario, UsuarioRol,
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

async function seed_catalogos() {
  await seedCatalogo(Sexo, ["Masculino", "Femenino", "Otro"]);
  await seedCatalogo(TipoDocumento, ["DNI", "Pasaporte", "CUIL"]);
  await seedCatalogo(TipoPersona, ["Alumno", "Profesor", "Administrativo", "Paciente Kinesiología"]);
  // Orden fijo: el cron y varios services asumen Activo=1, Inactivo=2, Suspendido=3
  await seedCatalogo(AlumnoEstado, ["Activo", "Inactivo", "Suspendido"]);
  await seedCatalogo(TipoEjercicio, ["Fuerza", "Kinesiología", "Cardio"]);
  await seedCatalogo(GrupoMuscular, ["Pecho", "Espalda", "Piernas", "Hombros", "Brazos", "Core"]);
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
  ];
  for (const rol of roles) {
    await Rol.findOrCreate({ where: { codigo: rol.codigo }, defaults: rol });
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
    // Kinesiología
    { nombre: "Movilidad de hombro",           tipo: "Kinesiología", grupo: "Hombros" },
    { nombre: "Estiramiento de isquiotibiales", tipo: "Kinesiología", grupo: "Piernas" },
    { nombre: "Propiocepción de tobillo",       tipo: "Kinesiología", grupo: "Piernas" },
    { nombre: "Fortalecimiento de core lumbar", tipo: "Kinesiología", grupo: "Core" },
    { nombre: "Movilidad cervical",             tipo: "Kinesiología", grupo: null },
  ];

  for (const ej of ejercicios) {
    await Ejercicio.findOrCreate({
      where: { nombre: ej.nombre },
      defaults: {
        nombre: ej.nombre,
        tipo_ejercicio_id: tiposPorNombre[ej.tipo] ?? null,
        grupo_muscular_id: ej.grupo ? (gruposPorNombre[ej.grupo] ?? null) : null,
      },
    });
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
