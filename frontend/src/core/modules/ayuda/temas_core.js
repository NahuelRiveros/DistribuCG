// Temas de ayuda del core: sirven para cualquier proyecto (panel, personal, permisos, banners).
// Los de cada rubro los aporta su modulo.js (`ayuda`). Formato y reglas de acceso: ayuda_temas.js.
export const temasAyudaCore = [
  {
    id: "panel",
    grupo: "Primeros pasos",
    titulo: "Cómo está organizado el panel",
    resumen: "Qué ves en el menú, por qué no ves todo y cómo moverte en compu y en celular.",
    palabras: ["menu", "inicio", "permiso", "no veo", "pantalla"],
    reglas: ["PAN-01", "PAN-04", "PAN-10", "PAN-13", "PAN-14", "PAN-20"],
    secciones: [
      { titulo: "Qué es", texto: "El panel de gestión es la parte del sistema que usa el equipo. Está separado de la tienda: los clientes nunca entran acá." },
      { titulo: "Qué vas a ver", pasos: [
        "Inicio: un resumen del negocio según tu rol y accesos a tus pantallas.",
        "El menú de la izquierda, agrupado por tema. Solo aparecen las pantallas que tu rol puede usar.",
        "Ayuda (esta pantalla): guías de lo que podés hacer.",
      ] },
      { titulo: "En compu y en celular", texto: "En compu podés achicar el menú a íconos y el navegador lo recuerda. En celular el menú se abre con el botón ☰ de arriba." },
      { titulo: "Errores comunes", problemas: [
        { problema: "Abrí un link y me llevó al inicio con \"No tenés permiso para ver esa pantalla\".", solucion: "Esa pantalla pide un permiso que tu rol no tiene. Si lo necesitás, pedíselo a quien administra Roles y permisos." },
        { problema: "No veo una pantalla que ve un compañero.", solucion: "Cada rol ve cosas distintas. El menú y esta Ayuda se arman con tus permisos." },
      ] },
    ],
    relacionados: ["permisos", "personal"],
  },
  {
    id: "personal",
    grupo: "Personal y permisos",
    titulo: "Personal: dar de alta y de baja al equipo",
    resumen: "Cómo crear a alguien del equipo, cambiarle la contraseña o darlo de baja.",
    palabras: ["usuario", "empleado", "contraseña", "alta", "baja", "vendedor"],
    reglas: ["PER-20", "PER-23", "PER-24", "PER-34", "PER-36"],
    pantalla: "/admin/staffManager",
    secciones: [
      { titulo: "Qué es", texto: "En Personal están las personas del equipo que entran al panel, cada una con su rol." },
      { titulo: "Paso a paso: dar de alta", pasos: [
        "Entrá a Personal y tocá \"Nuevo integrante\".",
        "Completá usuario, contraseña (8 caracteres o más), nombre, apellido y rol. Email y documento son opcionales.",
        "Guardá. Esa persona ya puede ingresar con su usuario o su email.",
      ] },
      { titulo: "Contraseñas", texto: "Si la persona tiene email, puede recuperar la contraseña sola desde el ingreso. Si no tiene, se la cambia un administrador desde Personal." },
      { titulo: "Errores comunes", problemas: [
        { problema: "No puedo borrarme a mí mismo.", solucion: "Es a propósito: otra persona con permiso tiene que hacerlo." },
        { problema: "Di de baja a alguien y quiero ver sus pedidos o cobros.", solucion: "La baja solo le impide ingresar: su historial se conserva." },
      ] },
    ],
    relacionados: ["permisos"],
  },
  {
    id: "permisos",
    grupo: "Personal y permisos",
    titulo: "Roles y permisos",
    resumen: "Qué puede hacer cada rol, cómo crear uno nuevo y qué pasa al quitar un permiso.",
    palabras: ["rol", "acceso", "gerente", "encargado", "vendedor", "supervisor"],
    reglas: ["PER-01", "PER-03", "PER-04", "PER-05", "PER-10", "PER-11", "PER-12"],
    pantalla: "/admin/permisos",
    secciones: [
      { titulo: "Qué es", texto: "Cada persona del equipo tiene un rol, y cada rol tiene permisos tildados (ver pedidos, cambiar precios, editar artículos…). El menú, los botones y esta Ayuda se arman con esos permisos." },
      { titulo: "Paso a paso: crear un rol", pasos: [
        "Entrá a Roles y permisos, tocá \"Nuevo rol\" y escribí su nombre (de 3 a 40 letras).",
        "Tildá sus permisos. Si un permiso necesita otro, se tilda solo.",
        "Guardá y asignale el rol a las personas desde Personal.",
      ] },
      { titulo: "Bueno saber", pasos: [
        "El Gerente general y el Administrador del sistema tienen todos los permisos siempre.",
        "Quitar un permiso tiene efecto enseguida, sin que esa persona vuelva a ingresar.",
        "El sistema controla cada permiso también del lado del servidor: ocultar un botón no es la única protección.",
      ] },
      { titulo: "Errores comunes", problemas: [
        { problema: "No me deja borrar un rol.", solucion: "Los roles del sistema no se borran, y uno creado por ustedes solo se borra si no tiene personas asignadas." },
      ] },
    ],
    relacionados: ["personal", "panel"],
  },
  {
    id: "banners",
    grupo: "Primeros pasos",
    titulo: "Banners y promociones del inicio",
    resumen: "El carrusel de imágenes y la cinta de anuncios de la tienda, con fecha de inicio y fin.",
    palabras: ["carrusel", "cinta", "promocion", "imagen", "anuncio"],
    reglas: ["SIS-32", "SIS-34"],
    pantalla: "/admin/banners",
    secciones: [
      { titulo: "Qué es", texto: "Un banner es una imagen del carrusel del inicio de la tienda o un texto de la cinta de arriba de todas las páginas." },
      { titulo: "Paso a paso", pasos: [
        "Entrá a Banners y promociones y elegí \"Nuevo banner del carrusel\" (imagen) o \"Nuevo texto de la cinta\".",
        "Poné desde y hasta qué día se muestra.",
        "Dejalo activo y guardá.",
      ] },
      { titulo: "Errores comunes", problemas: [
        { problema: "Lo cargué y no aparece en la tienda.", solucion: "Revisá que esté activo y que hoy esté entre su \"desde\" y su \"hasta\" (hora de Argentina)." },
      ] },
    ],
  },
];
