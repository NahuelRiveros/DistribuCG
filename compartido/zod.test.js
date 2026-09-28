import { describe, expect, it } from "vitest";
import { z } from "./zod.js";

describe("zod compartido", () => {
  it("devuelve los mensajes por defecto en español", () => {
    const resultado = z.object({ cantidad: z.number() }).safeParse({ cantidad: "diez" });
    const mensaje = resultado.error.issues[0].message;
    expect(mensaje).not.toMatch(/Invalid input|expected/i);
    expect(mensaje).toMatch(/[Ee]ntrada inválida|se esperaba/);
  });
});
