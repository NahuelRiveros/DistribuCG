export const money = (n) => Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
