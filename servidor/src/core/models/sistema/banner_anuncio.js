import { DataTypes } from "sequelize";
import { defineModel } from "../common/define_model.js";

/**
 * Anuncios de la cinta superior del sitio (ej. "Envío gratis desde $50.000") —
 * visible en toda la app, no atado a ningún módulo de negocio en particular
 * (por eso vive en sistema/, junto a ModuloNegocio). Tope de 4 filas se
 * aplica en el service (crearBannerAnuncio) — acá no hay constraint de DB
 * porque Sequelize no valida COUNT(*) a nivel columna.
 */
export const BannerAnuncio = defineModel("BannerAnuncio", {
  texto:  { type: DataTypes.STRING(200), allowNull: false },
  orden:  { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: "banner_anuncio",
  indexes: [
    { fields: ["activo"] },
    { fields: ["orden"] },
  ],
});
