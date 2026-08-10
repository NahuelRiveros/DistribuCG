import { brandConfig } from "../../config/brand_config.js";
import logoS from "../../assets/logoS1.svg";

// Recreación en SVG del isotipo "moovs" (wordmark "moov" + una S final
// estilizada como columna vertebral, degradé gris → turquesa) a partir del
// logo que mandó el cliente — no es el archivo original, así que puede
// necesitar un ajuste fino de curvas/posición una vez que se vea en pantalla.
const SIZE = {
  sm: {
    text: "text-xl",
    spine: "h-[1.46em]",
    spineBox: "w-[0.72em] -ml-[0.21em] translate-y-[0.19em]",
  },
  md: {
    text: "text-3xl sm:text-4xl",
    spine: "h-[1.52em]",
    spineBox: "w-[0.76em] -ml-[0.22em] translate-y-[0.2em]",
  },
  hero: {
    text: "text-6xl sm:text-7xl md:text-[8.15rem]",
    spine: "h-[1.72em]",
    spineBox: "w-[0.95em] -ml-[0.25em] translate-y-[0.25em]",
  },
};

const WORDMARK_STYLE = {
  fontFamily: '"Raleway", "Avenir Next", Avenir, "Helvetica Neue", Arial, sans-serif',
  fontWeight: 500,
  letterSpacing: "0",
};

function ImagenSpinaS({ className = "" }) {
  return (
    <span className={`${className} relative inline-block overflow-hidden`} aria-hidden="true">
      <img
        src={logoS}
        alt=""
        className="absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2 object-contain"
      />
    </span>
  );
}

/**
 * Isotipo solo (la S-columna, sin el texto "MOOV") — para espacios chicos
 * donde no entra o no hace falta el wordmark completo (ej. header del
 * drawer mobile).
 */
export function LogoMoovsIcon({ className = "" }) {
  const logo = brandConfig.logo ?? {};
  if (logo.tipo !== "moovs-spine") return null;
  const sizing = SIZE.sm;

  return (
    <span
      aria-label={logo.ariaLabel || brandConfig.nombre}
      className={`inline-flex leading-none ${sizing.text} ${className}`}
    >
      <ImagenSpinaS className={`${sizing.spine} ${sizing.spineBox}`} />
    </span>
  );
}

/**
 * Wordmark de marca — "moov" + la S-columna. `variant="light"` es para
 * fondos oscuros (footer, CTA final del home); `animated` prende el mismo
 * shimmer que ya existía para el nombre viejo (solo pensado para el hero,
 * sobre fondo claro).
 */
export default function LogoMoovs({ size = "md", variant = "dark", animated = false, className = "" }) {
  const sizing = SIZE[size] ?? SIZE.md;
  const isLight = variant === "light";
  const logo = brandConfig.logo ?? {};
  const textClass = animated ? "kt-shimmer-text" : isLight ? "text-white" : "text-[var(--kt-ink)]";

  if (logo.tipo !== "moovs-spine") {
    return (
      <span
        aria-label={logo.ariaLabel || brandConfig.nombre}
        className={`inline-flex leading-none ${sizing.text} ${textClass} ${className}`}
        style={WORDMARK_STYLE}
      >
        {logo.texto || brandConfig.nombre}
      </span>
    );
  }

  return (
    <span
      aria-label={logo.ariaLabel || brandConfig.nombre}
      className={`inline-flex items-end leading-none ${sizing.text} ${className}`}
      style={WORDMARK_STYLE}
    >
      <span
        aria-hidden="true"
        className={textClass}
      >
        {(logo.texto || "MOOV").toUpperCase()}
      </span>
      <ImagenSpinaS className={`${sizing.spine} ${sizing.spineBox}`} />
    </span>
  );
}
