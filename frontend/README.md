Necesito desarrollar un sistema web para la gestión integral de un gimnasio.

El sistema debe permitir administrar alumnos, planes, pagos, ingresos al gimnasio y estadísticas de recaudación y concurrencia.

Tecnologías sugeridas:
- Frontend: React JS
- Backend: Node.js con Express
- Base de datos: PostgreSQL
- ORM: Sequelize
- Autenticación con JWT
- Diseño responsive y moderno

Módulos principales del sistema:

1. Módulo de alumnos
Debe permitir registrar, editar, consultar y dar de baja alumnos.
Datos sugeridos:
- Nombre
- Apellido
- DNI / documento
- Teléfono
- Email
- Fecha de nacimiento
- Estado del alumno: activo, inactivo, suspendido
- Observaciones

2. Módulo de planes
Debe permitir crear y administrar planes del gimnasio.
Ejemplos:
- Plan mensual
- Plan semanal
- Plan por cantidad de clases
- Plan libre
- Plan personalizado

Datos del plan:
- Nombre del plan
- Precio
- Duración en días
- Cantidad de ingresos permitidos, si corresponde
- Estado del plan

3. Módulo de pagos y recaudación
Debe permitir registrar pagos de alumnos, controlar vencimientos y calcular recaudación.
Cada pago debe asociarse a un alumno y a un plan.

Datos del pago:
- Alumno
- Plan contratado
- Monto pagado
- Medio de pago
- Fecha de pago
- Fecha de inicio
- Fecha de vencimiento
- Estado: vigente, vencido, pendiente

El sistema debe calcular automáticamente la fecha de vencimiento según el plan seleccionado.

4. Módulo de ingreso de alumnos
Debe permitir que el alumno ingrese al gimnasio colocando su DNI o documento.
Al ingresar el DNI, el sistema debe:
- Buscar al alumno
- Verificar si tiene un plan vigente
- Registrar fecha y hora de ingreso
- Mostrar mensaje de acceso permitido o acceso denegado
- Indicar si el plan está vencido o próximo a vencer

También debe guardar el historial de ingresos de cada alumno.

5. Módulo de control de vencimientos
Debe mostrar alumnos con:
- Plan vigente
- Plan próximo a vencer
- Plan vencido
- Alumnos sin pago registrado

Debe permitir filtrar por fecha, estado, plan y alumno.

6. Dashboard estadístico
Debe mostrar indicadores generales del gimnasio:
- Recaudación diaria
- Recaudación semanal
- Recaudación mensual
- Recaudación anual
- Cantidad de alumnos activos
- Cantidad de planes vencidos
- Cantidad de ingresos del día
- Planes más vendidos

También debe incluir gráficos de:
- Recaudación por mes
- Recaudación por semana
- Ingresos por día
- Horarios más concurridos
- Días más concurridos
- Cantidad de alumnos por plan

7. Módulo de reportes
Debe permitir generar reportes de:
- Recaudación mensual
- Recaudación semanal
- Recaudación anual
- Ingresos por alumno
- Planes vencidos
- Alumnos activos e inactivos

Opcionalmente, permitir exportar reportes en PDF o Excel.

8. Módulo de usuarios del sistema
Debe permitir administrar usuarios internos, como administrador, recepcionista o entrenador.
Cada rol debe tener permisos diferentes.

Roles sugeridos:
- Administrador: acceso total
- Recepcionista: alumnos, pagos e ingresos
- Entrenador: consulta de alumnos e ingresos

Requisitos generales:
- Interfaz simple, moderna y fácil de usar
- Formularios validados
- Tablas con búsqueda, filtros y paginación
- Diseño responsive
- Código organizado en frontend y backend
- Backend separado por rutas, controladores, servicios y modelos
- Base de datos normalizada
- Manejo correcto de errores
- Seguridad básica con autenticación y autorización por roles

Quiero que primero se proponga:
1. La arquitectura general del sistema.
2. El modelo de base de datos con tablas y relaciones.
3. Los endpoints principales del backend.
4. La estructura de carpetas del frontend y backend.
5. Luego comenzar con la implementación paso a paso.

El sistema debe ser pensado para un gimnasio pequeño o mediano, pero con posibilidad de crecer en el futuro.