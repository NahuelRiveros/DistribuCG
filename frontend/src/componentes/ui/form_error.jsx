export default function FormError({ mensaje }) {
  if (!mensaje) return null;
  return (
    <div role="alert" className="rounded-xl bg-peligro/10 p-3 text-center text-sm text-peligro">
      {mensaje}
    </div>
  );
}
