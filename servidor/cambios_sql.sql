ALTER TABLE public.gym_cat_tipoplan
ADD COLUMN gym_cat_tipoplan_precio numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.gym_fecha_disponible
ALTER COLUMN gym_fecha_montopagado TYPE numeric(12,2)
USING gym_fecha_montopagado::numeric(12,2);

ALTER TABLE public.gym_fecha_disponible
ADD COLUMN gym_fecha_rela_usuario_cobro integer;


ALTER TABLE public.gym_fecha_disponible
ADD CONSTRAINT fk_fecha_usuario_cobro
FOREIGN KEY (gym_fecha_rela_usuario_cobro)
REFERENCES public.gym_usuario (gym_usuario_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

ALTER TABLE public.gym_cat_tipoplan
ADD COLUMN gym_cat_tipoplan_activo boolean NOT NULL DEFAULT true;


ALTER TABLE public.gym_persona
ALTER COLUMN gym_persona_fechacambio
TYPE timestamptz
USING gym_persona_fechacambio AT TIME ZONE 'America/Argentina/Cordoba';
ALTER TABLE public.gym_alumno
ALTER COLUMN gym_alumno_fechacambio
TYPE timestamptz
USING gym_alumno_fechacambio AT TIME ZONE 'America/Argentina/Cordoba';
ALTER TABLE public.gym_fecha_disponible
ALTER COLUMN gym_fecha_fechacambio
TYPE timestamptz
USING gym_fecha_fechacambio AT TIME ZONE 'America/Argentina/Cordoba';
ALTER TABLE public.gym_dia_ingreso
ALTER COLUMN gym_dia_fechacambio
TYPE timestamptz
USING gym_dia_fechacambio AT TIME ZONE 'America/Argentina/Cordoba';

ALTER TABLE public.gym_dia_ingreso
ALTER COLUMN gym_dia_horaingreso
TYPE timestamptz
USING gym_dia_horaingreso AT TIME ZONE 'America/Argentina/Cordoba';

ALTER TABLE public.gym_usuario
ALTER COLUMN gym_usuario_fechacambio
TYPE timestamptz
USING gym_usuario_fechacambio AT TIME ZONE 'America/Argentina/Cordoba';

ALTER TABLE public.gym_usuario
ALTER COLUMN gym_usuario_ultimo_login
TYPE timestamptz
USING gym_usuario_ultimo_login AT TIME ZONE 'America/Argentina/Cordoba';


ALTER TABLE public.gym_log_estado_alumno
ALTER COLUMN gym_log_estadoalumno_fechacambio
TYPE timestamptz
USING gym_log_estadoalumno_fechacambio AT TIME ZONE 'America/Argentina/Cordoba';


