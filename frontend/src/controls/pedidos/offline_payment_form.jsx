import { useId, useState } from "react";
import InputField from "../ui/input_field.jsx";
import SelectField from "../ui/select_field.jsx";
import ActionButton from "../ui/action_button.jsx";
import ErrorBanner from "../ui/error_banner.jsx";
import { money } from "./order_format.js";

// Conserva la misma operación ante una respuesta incierta, incluso al recargar.
export default function OfflinePaymentForm({ balance, methods, onSubmit, storageKey }) {
  const id = useId();
  const [attempt, setAttempt] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(storageKey)) || null; } catch { return null; }
  });
  const [amount, setAmount] = useState(() => attempt?.monto ?? "");
  const [method, setMethod] = useState(() => attempt?.metodo ?? methods[0]?.value ?? "");
  const [reference, setReference] = useState(() => attempt?.nota ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = (value) => {
    // Si el navegador impide persistir, no enviar: necesitamos recuperar un reintento.
    if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
    else sessionStorage.removeItem(storageKey);
    setAttempt(value);
  };
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const payload = attempt || { monto: Number(amount), metodo: method, nota: reference.trim() || null, key: crypto.randomUUID() };
      if (!attempt) save(payload);
      await onSubmit(payload);
      save(null); setAmount(""); setReference("");
    } catch (e) {
      if (e.response?.status >= 400 && e.response?.status < 500) save(null);
      setError(e.response?.data?.mensaje || "No pudimos confirmar el registro. Reintentá para comprobar la misma operación.");
    } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 p-3">
    <p className="text-sm font-semibold">Registrar dinero recibido</p>
    <p className="text-sm text-slate-600">Registrá un cobro que ya recibiste. Saldo: {money(balance)}.</p>
    <ErrorBanner message={error} />
    {attempt && <p role="status" className="text-sm text-amber-800">Hay un registro pendiente de confirmar. El reintento conserva su importe y referencia.</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      <InputField id={id + "-amount"} label="Importe recibido" type="number" required min="0.01" max={attempt ? undefined : balance} step="0.01" value={amount} disabled={busy || !!attempt} onChange={(e) => setAmount(e.target.value)} />
      <SelectField id={id + "-method"} label="Medio de cobro" options={methods} showPlaceholderOption={false} value={method} disabled={busy || !!attempt} onChange={(e) => setMethod(e.target.value)} />
    </div>
    <InputField id={id + "-reference"} label="Referencia u observación (opcional)" maxLength={255} value={reference} disabled={busy || !!attempt} onChange={(e) => setReference(e.target.value)} />
    <ActionButton type="submit" disabled={busy}>{busy ? "Guardando…" : attempt ? "Verificar registro pendiente" : "Registrar cobro recibido"}</ActionButton>
  </form>;
}
