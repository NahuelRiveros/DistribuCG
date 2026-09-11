/**
 * Único lugar para cambiar las imágenes de logo. Para poner un logo nuevo:
 * reemplazá el archivo correspondiente en src/assets/ (mismo nombre) y listo,
 * no hace falta tocar ningún componente. Si preferís un archivo con otro
 * nombre, actualizá el import de acá abajo — es la única línea que cambia.
 *
 * - navbar: ícono chico junto al menú (LogoMoovs size="sm").
 * - footer: se muestra más grande en la columna de marca del footer, sobre
 *   fondo oscuro — logo_moovs.jsx le agrega una tarjeta blanca automática
 *   ahí, así que un logo con partes oscuras (como el actual) igual se ve.
 * - home: isotipo + wordmark completo ("NORTE MAYORISTA" + tagline), se usa
 *   grande en la sección "Quiénes somos" del Home — a diferencia de navbar/
 *   footer, este SÍ lleva el nombre escrito adentro de la imagen, pensado
 *   para fondo claro (sin tarjeta blanca detrás).
 *
 * El favicon (ícono de la pestaña del navegador) es aparte y NO se importa
 * desde acá — un <link> en index.html lo lee directo de
 * public/logo-favicon.png. Para cambiarlo, reemplazá ese archivo por uno
 * nuevo con el mismo nombre.
 */
import logoNavbar from "../assets/logo_navbar.png";
import logoFooter from "../assets/logo_footer.png";
import logoHome from "../assets/logo_home.png";

export const logoConfig = {
  navbar: logoNavbar,
  footer: logoFooter,
  home: logoHome,
};
