import { cn } from "../../lib/cn";

/**
 * Encabezado de página estándar del sistema RAV.
 * Muestra título, subtítulo, badge opcional y slot de acciones (botones).
 *
 * Uso:
 *   <PageHeader title="Usuarios" subtitle="Gestión de personal" />
 *
 *   <PageHeader
 *     badge="Administración"
 *     title="Usuarios"
 *     subtitle="Alta, baja y modificación de usuarios del sistema"
 *     action={<Button label="Nuevo usuario" variant="cyan" icon={Plus} />}
 *   />
 *
 * Props:
 *   title     — título principal (requerido)
 *   subtitle  — descripción breve (opcional)
 *   badge     — etiqueta pequeña sobre el título (opcional)
 *   action    — nodo React — botón o grupo de acciones (opcional)
 *   back      — nodo React — link de volver (opcional, se ubica arriba)
 *   className — clases extra
 */
export default function PageHeader({
  title,
  subtitle,
  badge,
  action,
  back,
  className = "",
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl",
        "border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm",
        "px-5 py-5 sm:px-6",
        className
      )}
    >
      {/* Glow decorativo */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(34,211,238,0.04),transparent)]" />

      <div className="relative">
        {/* Breadcrumb / volver */}
        {back && <div className="mb-3">{back}</div>}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {/* Badge */}
            {badge && (
              <span className="mb-2 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                {badge}
              </span>
            )}

            {/* Título */}
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {title}
            </h1>

            {/* Subtítulo */}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            )}
          </div>

          {/* Acción (botón / grupo de botones) */}
          {action && (
            <div className="shrink-0">{action}</div>
          )}
        </div>
      </div>
    </div>
  );
}
