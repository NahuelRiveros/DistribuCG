import { NavLink } from "react-router-dom";
// Los enlaces a secciones usan el hash; no se marcan todos activos en Inicio.
export default function NavbarLink({ item, onNavigate, base, active, inactive }) {
  if (item.to.includes("#")) return <a href={item.to} onClick={onNavigate} className={[base, inactive].join(" ")}>{item.label}</a>;
  return <NavLink to={item.to} end={item.exact} onClick={onNavigate}
    className={({ isActive }) => [base, isActive ? active : inactive].join(" ")}>{item.label}</NavLink>;
}
