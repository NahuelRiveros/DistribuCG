import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../auth/auth_context.jsx";
import { authConfig } from "../../../config/auth_config.js";
import { authLink } from "../../acceso/return_to.js";
import Modal from "../../ui/modal.jsx";
import NavbarUserBox from "./navbar_userbox.jsx";
import NavbarLink from "./navbar_link.jsx";
import { UI_NAVBAR as S } from "./navbar_style.js";
function Items({ items, onNavigate }) {
  return items.map((item) => item.children?.length
    ? <div key={item.label}><p className="px-3 py-2 text-xs font-bold text-slate-500">{item.label}</p><Items items={item.children} onNavigate={onNavigate} /></div>
    : <NavbarLink key={item.to} item={item} onNavigate={onNavigate} base={S.mobile_link} active={S.mobile_link_activo} inactive={S.mobile_link_inactivo} />);
}
export default function NavbarMobile({ config, open, onNavigate, onClose, returnTo }) {
  const [groups, setGroups] = useState({});
  const { usuario } = useAuth();
  return <Modal open={open} onClose={onClose} title="Menú de navegación" className="!m-0 !ml-auto !h-dvh !max-h-dvh !w-[min(90vw,24rem)] !rounded-r-none">
    <nav aria-label="Navegación móvil" className="space-y-4">
      <div className="space-y-1"><Items items={config.links ?? []} onNavigate={onNavigate} /></div>
      {config.dropdowns?.map((group) => <div key={group.id} className="rounded-xl border border-(--kt-border)">
        <button type="button" aria-expanded={!!groups[group.id]} aria-controls={`mobile-${group.id}`}
          onClick={() => setGroups((p) => ({ ...p, [group.id]: !p[group.id] }))}
          className="flex min-h-12 w-full items-center justify-between gap-2 px-3 text-left text-sm font-bold">{group.label}<ChevronDown size={16} /></button>
        {groups[group.id] && <div id={`mobile-${group.id}`} className="space-y-1 p-2"><Items items={group.items} onNavigate={onNavigate} /></div>}
      </div>)}
      {usuario ? <NavbarUserBox mobile links={config.accountLinks} onLogout={onNavigate} /> : <div className="grid gap-2 border-t border-(--kt-border) pt-4">
        <Link to={authLink("/login", returnTo)} onClick={onNavigate} className={S.mobile_btn_login}>Ingresar</Link>
        {authConfig.publicRegistration && <Link to={authLink("/register", returnTo)} onClick={onNavigate} className="min-h-11 rounded-xl border p-3 text-center text-sm font-semibold">Crear cuenta</Link>}
      </div>}
    </nav>
  </Modal>;
}
