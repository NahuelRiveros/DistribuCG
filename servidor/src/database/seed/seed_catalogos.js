import { Sexo, TipoDocumento, TipoPersona, HomeArea } from "../../models/index.js";

async function seedCatalogo(Modelo, valores) {
  for (const descripcion of valores) {
    await Modelo.findOrCreate({ where: { descripcion }, defaults: { descripcion } });
  }
}

// Solo lo que usa la distribuidora. Los valores viejos de gym y kinesiología que ya
// estén en la base no se borran: persona y home_contenido los pueden referenciar.
export async function seed_catalogos() {
  await seedCatalogo(Sexo, ["Masculino", "Femenino", "Otro"]);
  await seedCatalogo(TipoDocumento, ["DNI", "Pasaporte", "CUIL"]);
  await seedCatalogo(TipoPersona, ["Administrativo"]);
  await seedCatalogo(HomeArea, ["General"]);
}
