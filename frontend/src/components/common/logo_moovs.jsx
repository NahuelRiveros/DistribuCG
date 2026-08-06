import { useId } from "react";

// Recreación en SVG del isotipo "moovs" (wordmark "moov" + una S final
// estilizada como columna vertebral, degradé gris → turquesa) a partir del
// logo que mandó el cliente — no es el archivo original, así que puede
// necesitar un ajuste fino de curvas/posición una vez que se vea en pantalla.
const SIZE = {
  sm:   { text: "text-lg",                          spine: "h-[1.15em]" },
  md:   { text: "text-3xl sm:text-4xl",              spine: "h-[1.2em]" },
  hero: { text: "text-6xl sm:text-7xl md:text-8xl",  spine: "h-[1.28em]" },
};

const VERTEBRAS = [[31, 13], [22, 25], [18, 37], [26, 47], [33, 59], [29, 70], [15, 82], [12, 92]];

function SpinaS({ className = "", gradientId }) {
  return (
    <svg viewBox="0 0 42 100" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="var(--kt-ink-mute)" />
          <stop offset="55%" stopColor="var(--kt-teal-700)" />
          <stop offset="100%" stopColor="var(--kt-turquoise)" />
        </linearGradient>
      </defs>
      <path
        d="M33 6 C 13 6, 9 28, 21 39 C 35 51, 35 66, 19 77 C 8 85, 8 91, 15 97"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      {VERTEBRAS.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={2.4} fill={`url(#${gradientId})`} />
      ))}
    </svg>
  );
}

/**
 * Wordmark de marca — "moov" + la S-columna. `variant="light"` es para
 * fondos oscuros (footer, CTA final del home); `animated` prende el mismo
 * shimmer que ya existía para el nombre viejo (solo pensado para el hero,
 * sobre fondo claro).
 */
export default function LogoMoovs({ size = "md", variant = "dark", animated = false, className = "" }) {
  const gradientId = `moovs-spine-${useId()}`;
  const sizing = SIZE[size] ?? SIZE.md;
  const isLight = variant === "light";

  return (
    <span
      aria-label="Moovs"
      className={`kt-display inline-flex items-end font-extrabold lowercase leading-none tracking-tight ${sizing.text} ${className}`}
    >
      <span
        aria-hidden="true"
        className={animated ? "kt-shimmer-text" : isLight ? "text-white" : "text-[var(--kt-ink)]"}
      >
        moov
      </span>
      <SpinaS gradientId={gradientId} className={`${sizing.spine} w-auto -ml-[0.04em] translate-y-[0.05em]`} />
    </span>
  );
}
