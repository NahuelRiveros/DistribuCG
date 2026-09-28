// Errores de negocio. Los servicios los lanzan y manejador_errores.js los convierte
// en la respuesta { ok: false, codigo, mensaje, detalles }.

export class ErrorApp extends Error {
  constructor(status, codigo, mensaje, detalles = []) {
    super(mensaje);
    this.name = "ErrorApp";
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export class DatosInvalidos extends ErrorApp {
  constructor(mensaje = "Revisá los datos ingresados.", detalles = [], codigo = "DATOS_INVALIDOS") {
    super(400, codigo, mensaje, detalles);
  }
}

export class NoAutorizado extends ErrorApp {
  constructor(mensaje = "Ingresá para continuar.", codigo = "NO_AUTORIZADO") {
    super(401, codigo, mensaje);
  }
}

export class SinPermiso extends ErrorApp {
  constructor(mensaje = "No tenés permisos para esta acción.", codigo = "SIN_PERMISO") {
    super(403, codigo, mensaje);
  }
}

export class NoEncontrado extends ErrorApp {
  constructor(mensaje = "No encontramos lo que buscabas.", codigo = "NO_ENCONTRADO") {
    super(404, codigo, mensaje);
  }
}

export class Conflicto extends ErrorApp {
  constructor(mensaje, codigo = "CONFLICTO") {
    super(409, codigo, mensaje);
  }
}
