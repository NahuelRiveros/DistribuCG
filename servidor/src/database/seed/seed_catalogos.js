import {
  Sexo, TipoDocumento, TipoPersona, AlumnoEstado, TipoEjercicio,
  GrupoMuscular, HomeArea, CategoriaProducto, Patologia,
} from "../../models/index.js";

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
}
