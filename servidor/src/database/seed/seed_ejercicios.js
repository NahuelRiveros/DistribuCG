import { TipoEjercicio, GrupoMuscular, Ejercicio } from "../../models/index.js";

// Depende de que TipoEjercicio y GrupoMuscular ya estén sembrados (ver
// seed_catalogos.js) — el orquestador (./index.js) lo llama después.
export async function seed_ejercicios() {
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
