import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { proyecto } from "compartido/proyecto.js";

export const API = "http://localhost:3001/api";

// Cada test declara las respuestas que necesita con servidorMock.use(...). Única excepción:
// la config de pagos, que la piden la ficha, las tarjetas y el checkout (valores iniciales del proyecto).
export const servidorMock = setupServer(http.get(`${API}/configuracion/pagos`, () => HttpResponse.json({ ok: true, data: proyecto.pagos })));
