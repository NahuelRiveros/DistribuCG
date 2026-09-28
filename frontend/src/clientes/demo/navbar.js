// Links propios del cliente. Los módulos (catálogo, tienda, admin) suman sus
// propios ítems automáticamente cuando están activos en proyecto.config.js.
export const navbar = {
  mostrar_rubro: true,
  // Cómo se llama la sección de productos en el menú, el título y los botones ("Ver productos").
  // Ej: "Productos", "Tienda", "Colección".
  productos: "Productos",
  // Cómo se muestran los productos en el menú:
  //   "enlace"     → un solo link ("Productos"). Ideal para distribuidoras.
  //   "categorias" → las categorías marcadas "Mostrar en el menú" en el panel, con sus
  //                  subcategorías desplegables (ej. ropa: Mujer ▾ · Hombre ▾ · Calzado ▾).
  menu_productos: "enlace",
  // Links extra (opcionales): "Novedades" = últimos cargados; "Ofertas" = con precio anterior tachado.
  novedades: false,
  ofertas: false,
  links: [
    { etiqueta: "Inicio", a: "/" },
    { etiqueta: "Cómo pedir", a: "/#como-pedir" },
    { etiqueta: "Contacto", a: "/#contacto" },
  ],
};
