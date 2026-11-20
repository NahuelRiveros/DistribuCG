// Ayuda del panel: temas de la distribuidora (AYU-07). Formato y reglas de acceso en
// core/modules/ayuda/ayuda_temas.js. Cada tema cita las reglas que explica: si una regla cambia, revisar su tema.
const ARTICULOS = "/distribuidora/admin/productos";
const CON_PRECIOS = { permisos: ["precios.editar"] };
// El ajuste masivo y las ofertas están en la pantalla de Artículos y además piden "Cambiar precios".
const ARTICULOS_Y_PRECIOS = { permisos: ["productos.editar", "precios.editar"], todosLosPermisos: true };

export const temasAyudaDistribuidora = [
  {
    id: "tienda-y-panel",
    grupo: "Primeros pasos",
    titulo: "La tienda y el panel",
    resumen: "Por qué en la tienda ves lo mismo que un cliente y dónde se ve todo lo demás.",
    palabras: ["catalogo", "cliente", "oculto", "vista"],
    reglas: ["CAT-64", "CAT-62"],
    secciones: [
      { titulo: "Qué es", texto: "La tienda es lo que ven los clientes: el inicio, Productos, la ficha y el carrito. El panel es donde el equipo carga y gestiona todo." },
      { titulo: "Bueno saber", pasos: [
        "Aunque entres con tu usuario del equipo, la tienda te muestra exactamente lo que ve un cliente: sin artículos ocultos ni presentaciones en $0.",
        "Lo oculto, lo que no tiene precio y todo lo que hay que revisar se ve en el panel, en Artículos.",
      ] },
    ],
    relacionados: ["no-aparece", "articulos"],
  },

  // ── Catálogo ──
  {
    id: "articulos",
    grupo: "Catálogo",
    titulo: "Artículos y presentaciones",
    resumen: "Qué es un artículo, qué es una presentación y cómo cargar uno nuevo.",
    palabras: ["producto", "variedad", "codigo", "codigo de barras", "stock", "ficha", "nuevo articulo"],
    reglas: ["CAT-13", "CAT-20", "CAT-21", "CAT-23"],
    pantalla: ARTICULOS,
    secciones: [
      { titulo: "Qué es", texto: "Un artículo es el producto (\"Aceite Natura\"). Cada artículo tiene una o más presentaciones (\"900 ml\", \"1,5 l\"), y cada presentación tiene su código interno, su precio, su IVA, su bulto y su stock." },
      { titulo: "Paso a paso: cargar un artículo", pasos: [
        "En Artículos tocá \"Nuevo artículo\".",
        "Elegí la categoría (Familia › Categoría): un artículo nunca va directo en una familia.",
        "Completá nombre, marca y, en las pestañas, precio, IVA, código interno, unidades por bulto y stock.",
        "Guardá. Si tiene precio mayor a $0 y está activo, ya se ve en la tienda.",
      ] },
      { titulo: "Errores comunes", problemas: [
        { problema: "No me deja elegir la familia como categoría.", solucion: "Es a propósito: elegí una categoría dentro de la familia, o creala en Familias y categorías." },
        { problema: "El código de barras no se guarda.", solucion: "Tiene que tener de 6 a 14 números, sin letras." },
      ] },
    ],
    relacionados: ["familias", "bultos", "precio-iva", "no-aparece"],
  },
  {
    id: "familias",
    grupo: "Catálogo",
    titulo: "Familias y categorías",
    resumen: "Cómo se organiza el catálogo en dos niveles y cómo mover o unir categorías.",
    palabras: ["rubro", "subcategoria", "mover", "fusionar", "nueva familia"],
    reglas: ["CAT-13", "CAT-14", "CAT-15"],
    pantalla: "/distribuidora/admin/categorias",
    secciones: [
      { titulo: "Qué es", texto: "El catálogo tiene dos niveles: la familia (\"Almacén\") y sus categorías (\"Aceites\", \"Galletitas\"). Los artículos van siempre en una categoría." },
      { titulo: "Paso a paso", pasos: [
        "Para empezar una familia, tocá \"Nueva familia\"; adentro creás sus categorías.",
        "Para pasar categorías a otra familia, seleccionalas y usá \"Mover\".",
        "Si hay dos categorías repetidas, usá \"Fusionar\": los artículos de una pasan a la otra y no se pierde nada.",
      ] },
      { titulo: "Errores comunes", problemas: [
        { problema: "No puedo guardar un artículo en una categoría.", solucion: "Esa categoría puede estar dada de baja. Elegí otra o volvé a activarla." },
      ] },
    ],
    relacionados: ["articulos", "marcas"],
  },
  {
    id: "marcas",
    grupo: "Catálogo",
    titulo: "Marcas",
    resumen: "Marcas por familia o categoría y cómo unificar las repetidas.",
    palabras: ["unificar", "repetida", "fabricante"],
    reglas: ["CAT-10", "CAT-11"],
    pantalla: "/distribuidora/admin/marcas",
    secciones: [
      { titulo: "Qué es", texto: "Cada marca se ofrece en las familias o categorías donde vende. En la ficha del artículo se elige entre las marcas de su categoría." },
      { titulo: "Paso a paso: unir marcas repetidas", pasos: [
        "En Marcas buscá la marca (por ejemplo \"Bagley\" y \"BAGLEY\").",
        "Seleccioná las repetidas y tocá \"Unificar\": todos sus artículos quedan con una sola.",
      ] },
    ],
    relacionados: ["familias", "articulos"],
  },
  {
    id: "bultos",
    grupo: "Catálogo",
    titulo: "Unidades y bultos (Equival)",
    resumen: "Cuántas unidades trae una caja o paquete y cómo se muestra en la tienda y en la lista de carga.",
    palabras: ["caja", "paquete", "equivalencia", "equival", "suelto", "display"],
    reglas: ["CAT-22", "CAT-43"],
    pantalla: ARTICULOS,
    secciones: [
      { titulo: "Qué es", texto: "\"Unidades por bulto\" dice cuántas unidades trae cada caja, paquete o display. Es el \"Equival\" del sistema del cliente." },
      { titulo: "Ejemplo", ejemplo: "Poxilina: bulto de 20. Si un cliente pide 45 unidades, la lista de carga muestra 2 cajas y 5 sueltas." },
      { titulo: "Bueno saber", pasos: [
        "Bulto 1 (o Equival 0 en el sistema del cliente) significa que se vende suelto, sin caja.",
        "Se puede de 1 a 10.000 unidades por bulto.",
      ] },
    ],
    relacionados: ["articulos", "lista-carga"],
  },
  {
    id: "no-aparece",
    grupo: "Catálogo",
    titulo: "Por qué un artículo no aparece en la tienda",
    resumen: "Oculto, sin precio, en $0 o dado de baja: cómo saber qué le pasa y cómo arreglarlo.",
    palabras: ["no se ve", "no aparece", "oculto", "inactivo", "precio 0", "cero", "sin precio"],
    reglas: ["CAT-43", "CAT-62", "CAT-64", "PRE-34"],
    pantalla: ARTICULOS,
    secciones: [
      { titulo: "Qué revisar", pasos: [
        "Que esté activo: en Artículos, filtrá por \"Inactivos\".",
        "Que tenga precio mayor a $0: una presentación en $0 no se vende ni se muestra. Si todas están en $0, el artículo no aparece.",
        "Que no esté dado de baja.",
      ] },
      { titulo: "Por qué hay tantos ocultos", texto: "El catálogo replica el Listado de Artículos del cliente: lo que no tiene precio en su lista se cargó oculto. Aparece solo cuando \"Actualizar precios\" le pone precio." },
      { titulo: "Errores comunes", problemas: [
        { problema: "Lo veo en el panel pero no en la tienda.", solucion: "La tienda te muestra lo mismo que a un cliente. Revisá que esté activo y que tenga precio." },
        { problema: "Un artículo dice \"Desde $ ...\" pero una presentación no aparece.", solucion: "Esa presentación está en $0: cargale precio y aparece." },
      ] },
    ],
    relacionados: ["actualizar-precios", "tienda-y-panel", "articulos"],
  },
  {
    id: "fotos",
    grupo: "Catálogo",
    titulo: "Fotos de los artículos",
    resumen: "Cómo se relaciona cada foto con su artículo y qué hacer si falta.",
    palabras: ["imagen", "cloudinary", "foto", "sin foto"],
    reglas: ["CAT-25", "CAT-61"],
    pantalla: ARTICULOS,
    secciones: [
      { titulo: "Qué es", texto: "Cada artículo tiene una foto. Las del catálogo del cliente se relacionan por código interno; también se puede subir una a mano desde la ficha del artículo." },
      { titulo: "Bueno saber", pasos: [
        "Una foto subida a mano desde la ficha nunca se reemplaza sola.",
        "El inicio de la tienda muestra primero los artículos con foto.",
      ] },
    ],
    relacionados: ["respaldo", "articulos"],
  },
  {
    id: "importar",
    grupo: "Catálogo",
    titulo: "Importar artículos desde Excel",
    resumen: "Cargar o actualizar muchos artículos de una vez con una planilla.",
    palabras: ["excel", "csv", "planilla", "importacion", "mapeo", "columnas"],
    reglas: ["CAT-17", "CAT-43", "PRE-66"],
    pantalla: "/distribuidora/admin/importar",
    secciones: [
      { titulo: "Paso a paso", pasos: [
        "Entrá a Importar productos y elegí el archivo (Excel o CSV).",
        "Indicá la hoja y la fila de encabezados, y relacioná cada columna (Precio, IVA, Unidades por bulto…).",
        "Elegí si el precio del archivo ya incluye IVA.",
        "Opcional: si el archivo trae \"Costo neto\" y \"Rentabilidad %\", el precio se calcula con el IVA y se guardan los dos. Sin rentabilidad, la columna Precio es el precio final.",
        "Revisá la muestra del resultado y confirmá. En \"Mis importaciones\" queda cada carga.",
      ] },
      { titulo: "Errores comunes", problemas: [
        { problema: "Una fila queda con error de categoría.", solucion: "La planilla tiene que decir \"Familia > Categoría\": no se crean artículos directo en una familia." },
        { problema: "Un artículo nuevo quedó oculto.", solucion: "Vino sin precio: se crea oculto y aparece cuando le ponés precio." },
      ] },
    ],
    relacionados: ["familias", "actualizar-precios"],
  },

  // ── Precios ──
  {
    id: "precio-iva",
    grupo: "Precios",
    titulo: "Precio final, IVA y neto",
    resumen: "El precio que cargás es el que paga el cliente, con IVA incluido.",
    palabras: ["iva", "neto", "bruto", "final", "21", "10,5"],
    reglas: ["PRE-01", "PRE-03", "PRE-21"],
    pantalla: ARTICULOS,
    secciones: [
      { titulo: "Qué es", texto: "El \"Precio final\" es lo que paga el cliente, con IVA incluido. Si cargás el precio neto, se calcula solo; si no, se escribe a mano y la ficha te muestra el neto sin IVA." },
      { titulo: "Ejemplo", ejemplo: "Precio final $1.210 con IVA 21 % → neto $1.000 + IVA $210." },
      { titulo: "Bueno saber", pasos: [
        "Se guarda la fecha del último cambio de precio de cada artículo.",
        "Sin el permiso \"Cambiar precios\" ves el precio pero no lo podés cambiar.",
      ] },
    ],
    relacionados: ["precio-desde-costo", "ofertas", "ajuste-masivo", "listas-regionales"],
  },
  {
    id: "precio-desde-costo",
    grupo: "Precios",
    titulo: "Precio desde el costo y rentabilidad",
    resumen: "Cargar el costo neto y la ganancia que querés, y que el sistema arme el precio con el IVA.",
    palabras: ["costo", "rentabilidad", "margen", "ganancia", "neto", "proveedor", "perdida", "debajo del costo"],
    reglas: ["PRE-60", "PRE-61", "PRE-62", "PRE-63", "PRE-67", "PRE-70"],
    pantalla: ARTICULOS,
    acceso: ARTICULOS_Y_PRECIOS,
    secciones: [
      { titulo: "Qué es", texto: "En la ficha del artículo, pestaña Precios, cargás el precio neto (lo que te cuesta, sin IVA), la rentabilidad que querés ganar y el IVA: el precio final, el que ve el cliente, se calcula solo. Si no cargás el precio neto, el precio final se escribe a mano como siempre." },
      { titulo: "Cómo se calcula", texto: "Precio = costo neto × (1 + rentabilidad %) × (1 + IVA %), redondeado a pesos enteros. La rentabilidad es lo que ganás sobre el costo." },
      { titulo: "Ejemplo", ejemplo: "Costo $1.000 + 30 % = $1.300 neto + IVA 21 % ($273) = $1.573. Ganás $300 por unidad." },
      { titulo: "Paso a paso", pasos: [
        "Abrí la ficha del artículo y andá a la pestaña Precios.",
        "Cargá el precio neto, la rentabilidad % y elegí el IVA.",
        "Revisá el precio final y el desglose (cuánto ganás por unidad) y guardá.",
      ] },
      { titulo: "Bueno saber", pasos: [
        "Si después cambiás el precio a mano o lo cambia la lista del cliente, el costo queda y la rentabilidad se recalcula: así ves la ganancia real.",
        "El ajuste masivo, en los artículos con costo, sube el costo y mantiene la rentabilidad.",
        "El costo y la rentabilidad no los ve ningún cliente ni nadie sin el permiso \"Cambiar precios\".",
      ] },
      { titulo: "Errores comunes", problemas: [
        { problema: "Aparece en rojo \"Estás vendiendo por debajo del costo\".", solucion: "El precio no cubre el costo con IVA: perdés plata en cada venta. Subí el precio o revisá el costo. No impide guardar." },
        { problema: "No veo los campos de costo.", solucion: "Hace falta el permiso \"Cambiar precios\"." },
      ] },
    ],
    relacionados: ["precio-iva", "ajuste-masivo", "actualizar-precios"],
  },
  {
    id: "ofertas",
    grupo: "Precios",
    titulo: "Ofertas (precio anterior)",
    resumen: "Cómo mostrar un precio tachado y que el artículo aparezca en Ofertas.",
    palabras: ["oferta", "tachado", "descuento", "promocion", "precio anterior"],
    reglas: ["PRE-02"],
    pantalla: ARTICULOS,
    acceso: ARTICULOS_Y_PRECIOS,
    secciones: [
      { titulo: "Paso a paso", pasos: [
        "En la ficha del artículo, pestaña Precios, cargá el \"Precio anterior\" (el de antes de la oferta).",
        "Tiene que ser mayor al precio de venta: así se muestra tachado y el artículo entra en Ofertas.",
        "Para terminar la oferta, borrá el precio anterior.",
      ] },
      { titulo: "Ejemplo", ejemplo: "Precio anterior $2.000 y precio de venta $1.500: el cliente ve $2.000 tachado y paga $1.500." },
    ],
    relacionados: ["precio-iva", "listas-regionales"],
  },
  {
    id: "listas-regionales",
    grupo: "Precios",
    titulo: "Listas de precios regionales",
    resumen: "Precios distintos según la localidad del cliente.",
    palabras: ["lista", "localidad", "zona", "region", "interior"],
    reglas: ["PRE-10", "PRE-11", "PRE-12", "PRE-14", "PRE-16"],
    pantalla: "/distribuidora/admin/listas-precio",
    secciones: [
      { titulo: "Qué es", texto: "La lista \"General\" es el precio de cada artículo. Una lista regional guarda solo las excepciones (precios distintos) y se aplica a los clientes de sus localidades." },
      { titulo: "Paso a paso", pasos: [
        "En Listas de precios creá la lista y sumale sus localidades (cada localidad va en una sola lista).",
        "Cargá los precios especiales a mano o importalos por código.",
        "Si la pausás, sus clientes vuelven a ver la General.",
      ] },
      { titulo: "Bueno saber", texto: "El panel siempre muestra el precio General. Un cliente sin sesión, o sin lista para su localidad, ve la General." },
    ],
    relacionados: ["precio-iva", "actualizar-precios"],
  },
  {
    id: "actualizar-precios",
    grupo: "Precios",
    titulo: "Actualizar precios con la lista del cliente",
    resumen: "Subir el Excel de precios del sistema del cliente, revisar los cambios y aplicarlos.",
    palabras: ["lista de precios", "excel", "hoja lista", "datos exportados", "precio 0", "deshacer", "revisar"],
    reglas: ["PRE-30", "PRE-33", "PRE-34", "PRE-35", "PRE-36", "PRE-37", "PRE-38", "PRE-39", "PRE-65", "PRE-67"],
    pantalla: "/distribuidora/admin/precios-cliente",
    secciones: [
      { titulo: "Paso a paso", pasos: [
        "En Actualizar precios tocá \"Subir la lista\" y elegí el Excel (tiene que tener la hoja LISTA).",
        "La vista previa agrupa los cambios: códigos repetidos, cambios extremos, a revisar, suben, bajan, primer precio y sin precio.",
        "Revisá los que piden decisión (más de 20 % de diferencia o nombre distinto) y elegí aplicar o descartar.",
        "Dejá marcado \"Ajustar también las listas regionales\" si querés que las listas suban en el mismo porcentaje.",
        "Tocá \"Aplicar actualización\". Se aplica por partes; podés seguir trabajando.",
      ] },
      { titulo: "Ejemplo", ejemplo: "Aceite a $3.000 y la lista lo trae a $3.900 (+30 %): va a \"a revisar\" y no se aplica hasta que lo confirmes." },
      { titulo: "Errores comunes", problemas: [
        { problema: "Un artículo viene en $0.", solucion: "Un 0 significa que dejó de venderse: no se toca su precio, solo se avisa. Si pasa 6 meses sin precio, el artículo se oculta." },
        { problema: "Un código aparece repetido con dos precios.", solucion: "No se aplica hasta que elijas cuál vale." },
        { problema: "Me equivoqué al aplicar.", solucion: "En \"Mis actualizaciones\" podés deshacerla: lo que alguien cambió después no se pisa." },
        { problema: "Una fila dice \"Por debajo del costo\".", solucion: "El precio de la lista no cubre el costo con IVA de ese artículo. Se puede aplicar igual; revisá el costo o el precio." },
      ] },
      { titulo: "Costo y rentabilidad", texto: "La lista trae precios finales: no cambia el costo de los artículos, y su rentabilidad se recalcula con el precio nuevo." },
    ],
    relacionados: ["no-aparece", "listas-regionales", "ajuste-masivo", "precio-desde-costo"],
  },
  {
    id: "ajuste-masivo",
    grupo: "Precios",
    titulo: "Ajuste masivo de precios",
    resumen: "Subir o bajar un porcentaje los precios de un artículo, una categoría o todo el catálogo.",
    palabras: ["aumento", "porcentaje", "inflacion", "subir precios", "bajar precios", "masivo"],
    reglas: ["PRE-20", "PRE-64"],
    pantalla: ARTICULOS,
    acceso: ARTICULOS_Y_PRECIOS,
    secciones: [
      { titulo: "Paso a paso", pasos: [
        "En Artículos tocá \"Ajuste masivo\".",
        "Elegí a qué se aplica: un artículo, una categoría o todo el catálogo.",
        "Escribí el porcentaje: positivo sube, negativo baja.",
        "Confirmá. Se guarda la fecha del cambio en cada artículo.",
      ] },
      { titulo: "Ejemplo", ejemplo: "Sin costo: +10 % sobre $1.500 → $1.650. Con costo: costo $1.000 +10 % = $1.100, con 30 % de rentabilidad e IVA 21 % → $1.730." },
      { titulo: "Bueno saber", texto: "En los artículos con costo cargado, el porcentaje se aplica al costo neto y se mantiene la rentabilidad (sirve cuando aumenta el proveedor). En los que no tienen costo, se ajusta el precio final." },
    ],
    relacionados: ["precio-desde-costo", "precio-iva", "actualizar-precios"],
  },

  // ── Pedidos y cobros ──
  {
    id: "pedidos",
    grupo: "Pedidos y cobros",
    titulo: "Notas de pedido y sus estados",
    resumen: "Cómo avanza un pedido desde que lo envía el cliente hasta que se entrega.",
    palabras: ["pedido", "nota", "estado", "confirmar", "preparacion", "entregado", "cancelar", "stock"],
    reglas: ["PED-06", "PED-10", "PED-11", "PED-14", "PED-19", "PED-20", "PED-21"],
    pantalla: "/distribuidora/admin/notas-pedido",
    secciones: [
      { titulo: "Qué es", texto: "Cuando el cliente envía su carrito se crea una nota de pedido en estado Recibido. Enviar no reserva stock ni cobra nada: el equipo confirma." },
      { titulo: "Los estados", pasos: [
        "Recibido: el cliente lo envió. El cliente todavía lo puede cancelar.",
        "Confirmado: el equipo lo aceptó. Acá se descuenta el stock.",
        "En preparación: se está armando.",
        "Entregado: listo.",
        "Cancelado: si estaba confirmado, el stock vuelve.",
      ] },
      { titulo: "Paso a paso: avanzar un pedido", acceso: { permisos: ["pedidos.gestionar"] }, pasos: [
        "Abrí el pedido: el botón principal dice el próximo paso (\"Confirmar pedido\", \"Empezar preparación\", \"Marcar como entregado\").",
        "Para volver atrás, cancelar o reabrir, el sistema pide un motivo. Todo queda en el historial.",
      ] },
      { titulo: "Bueno saber", texto: "Se puede preparar y entregar un pedido sin cobrarlo (venta a cuenta): el cobro va aparte." },
      { titulo: "Errores comunes", problemas: [
        { problema: "No me deja confirmar.", solucion: "Falta stock de alguna presentación que controla stock: el aviso dice cuál." },
        { problema: "Otro compañero cambió el pedido a la vez.", solucion: "El sistema te avisa: actualizá la lista y volvé a intentar." },
      ] },
    ],
    relacionados: ["cobros", "lista-carga"],
  },
  {
    id: "cobros",
    grupo: "Pedidos y cobros",
    titulo: "Cobros y comprobantes",
    resumen: "Registrar el dinero recibido y aceptar o rechazar los comprobantes de transferencia.",
    palabras: ["pago", "cobro", "transferencia", "comprobante", "efectivo", "saldo"],
    reglas: ["PED-14", "PED-23", "PED-24", "PED-26"],
    pantalla: "/distribuidora/admin/notas-pedido",
    acceso: { permisos: ["cobros.gestionar"] },
    secciones: [
      { titulo: "Paso a paso", pasos: [
        "En el pedido, tocá \"Registrar dinero recibido\" y cargá monto y medio (efectivo, transferencia u otro).",
        "Si el cliente subió un comprobante, revisalo y tocá \"Aceptar y registrar cobro\" o \"Rechazar\" con el motivo.",
      ] },
      { titulo: "Bueno saber", pasos: [
        "Si el comprobante aceptado cubre todo el pedido, el pedido pasa solo a En preparación.",
        "Si falta stock, el cobro se registra igual y el pedido no avanza: el aviso dice qué falta.",
        "Los pedidos en efectivo o a cuenta se confirman a mano con \"Confirmar pedido\".",
      ] },
    ],
    relacionados: ["pedidos"],
  },
  {
    id: "lista-carga",
    grupo: "Pedidos y cobros",
    titulo: "Lista de carga",
    resumen: "Juntar varios pedidos para armar el reparto, por familia, en bultos y sueltos.",
    palabras: ["reparto", "carga", "camion", "imprimir", "preparar"],
    reglas: ["CAT-22", "PAN-15"],
    pantalla: "/distribuidora/admin/lista-carga",
    secciones: [
      { titulo: "Paso a paso", pasos: [
        "Entrá a Lista de carga y elegí los pedidos que salen juntos.",
        "Se arma la lista de artículos sumados, agrupados por familia y en bultos y sueltos.",
        "Imprimila: el menú no sale en la hoja.",
      ] },
      { titulo: "Ejemplo", ejemplo: "Dos pedidos de 30 y 15 unidades de un artículo con bulto de 20 → 2 cajas y 5 sueltas." },
    ],
    relacionados: ["pedidos", "bultos"],
  },

  // ── Clientes ──
  {
    id: "clientes",
    grupo: "Clientes",
    titulo: "Clientes",
    resumen: "Datos de contacto, facturación y entrega de cada cliente y sus pedidos.",
    palabras: ["cliente", "cuit", "dni", "direccion", "contacto", "facturacion"],
    reglas: ["CLI-11", "CLI-12", "CLI-13", "CLI-14"],
    pantalla: "/distribuidora/admin/clientes",
    secciones: [
      { titulo: "Qué es", texto: "El listado de los clientes registrados con sus datos para contactarlos, facturarles y entregarles, y sus pedidos." },
      { titulo: "Bueno saber", texto: "Son datos personales: solo los ve quien tiene el permiso \"Ver clientes\"." },
    ],
    relacionados: ["pedidos"],
  },

  // ── Respaldo ──
  {
    id: "respaldo",
    grupo: "Respaldo",
    titulo: "Respaldo del catálogo",
    resumen: "Bajar una planilla con todos los artículos, precios y fotos para guardarla fuera del sistema.",
    palabras: ["backup", "copia", "descargar", "csv", "excel", "seguridad"],
    reglas: ["CAT-65", "CAT-66", "CAT-67"],
    pantalla: ARTICULOS,
    secciones: [
      { titulo: "Paso a paso", pasos: [
        "En Artículos tocá \"Descargar respaldo\".",
        "Se baja una planilla para Excel con cada presentación: código, artículo, familia, categoría, marca, precios, IVA, bulto, si está a la venta y el link de su foto.",
        "Guardala en un lugar seguro (por ejemplo, una carpeta en la nube).",
      ] },
      { titulo: "Las fotos", texto: "Para bajar también todas las fotos, el encargado del sistema corre el comando de respaldo desde su compu. Con ese respaldo se pueden volver a subir si algún día se pierden." },
    ],
    relacionados: ["fotos", "articulos"],
  },
];
