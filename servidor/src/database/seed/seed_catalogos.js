import {
  Sexo, TipoDocumento, TipoPersona, AlumnoEstado, TipoEjercicio,
  GrupoMuscular, HomeArea, CategoriaProducto, Patologia,
} from "../../models/index.js";
import { projectModules } from "../../configuracion_servidor/gate_config.js";

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

export async function seed_catalogos() {
  await seedCatalogo(Sexo, ["Masculino", "Femenino", "Otro"]);
  await seedCatalogo(TipoDocumento, ["DNI", "Pasaporte", "CUIL"]);
  await seedCatalogo(TipoPersona, ["Alumno", "Profesor", "Administrativo", "Paciente Kinesiología"]);
  // Estas tres tablas están gateadas en bootstrap.js (solo se crean si el
  // módulo correspondiente está en true) — sembrarlas sin el mismo chequeo
  // rompe en deploys donde ese módulo está apagado (la tabla no existe).
  if (projectModules.gym) {
    // Orden fijo: el cron y varios services asumen Activo=1, Inactivo=2, Suspendido=3
    await seedCatalogo(AlumnoEstado, ["Activo", "Inactivo", "Suspendido"]);
  }
  await seedCatalogo(TipoEjercicio, ["Fuerza", "Kinesiología", "Cardio"]);
  await seed_grupos_musculares();
  await seedCatalogo(HomeArea, ["Gym", "Kinesiología", "General"]);
  if (projectModules.stock) {
    await seedCatalogo(CategoriaProducto, ["Bebidas", "Suplementos", "Snacks", "Accesorios", "Indumentaria"]);
  }
  if (projectModules.kinesiologia) {
    await seedCatalogo(Patologia, [
      "Lumbalgia", "Cervicalgia", "Dorsalgia", "Ciática",
      "Esguince de tobillo", "Tendinitis de hombro", "Hernia de disco",
      "Escoliosis", "Fascitis plantar", "Síndrome del túnel carpiano",
      "Artrosis de rodilla", "Contractura muscular", "Desgarro muscular", "Bursitis",
    ]);
  }
}
