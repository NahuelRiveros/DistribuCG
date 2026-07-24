import { useState, useRef, useEffect } from "react";
import { LogOut, User, Settings, UserCircle, ChevronDown } from "lucide-react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../auth/auth_context.jsx";
import { UI_NAVBAR as S } from "../styles_components/ui_navbar_style.jsx";

export default function NavbarUserBox({ mobile = false, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!usuario) return null;

  async function cerrarSesion() {
    await logout();
    onLogout?.();
    navigate("/login");
  }

  const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ")
    || usuario.email
    || "Usuario";
  const rol = (usuario.roles?.[0] ?? usuario.rol ?? "usuario")
    .replace(/^\w/, (c) => c.toUpperCase());
  const initials = nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (mobile) {
    return (
      <div className={S.userbox_mobile_tarjeta}>
        <div className={S.userbox_mobile_header}>
          <div className={S.userbox_avatar_xl}>
            {initials || <User size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className={S.userbox_nombre}>{nombre}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={S.userbox_online_sm}>
                <span className={S.userbox_online_sm_ping} />
                <span className={S.userbox_online_sm_solido} />
              </span>
              <p className={S.userbox_rol}>{rol}</p>
            </div>
          </div>
        </div>
        <div className={S.userbox_mobile_logout_area}>
          <button type="button" onClick={cerrarSesion} className={S.userbox_mobile_logout_btn}>
            <span className={S.userbox_logout_icono}><LogOut size={14} /></span>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          S.userbox_desktop_trigger,
          open ? S.userbox_desktop_trigger_abierto : S.userbox_desktop_trigger_cerrado,
        ].join(" ")}
      >
        <div className={S.userbox_avatar_sm}>
          {initials || <User size={14} />}
        </div>
        <div className="min-w-0 text-left leading-tight">
          <p className={S.userbox_desktop_nombre}>{nombre}</p>
          <p className={S.userbox_desktop_rol}>{rol}</p>
        </div>
        <span className={S.userbox_online_md}>
          <span className={S.userbox_online_md_ping} />
          <span className={S.userbox_online_md_solido} />
        </span>
        <ChevronDown
          size={14}
          className={[S.userbox_desktop_chevron, open ? "rotate-180" : ""].join(" ")}
        />
      </button>

      {open && (
        <div className={S.userbox_desktop_panel}>
          <div className={S.userbox_desktop_panel_header}>
            <div className={S.userbox_avatar_lg}>
              {initials || <User size={20} />}
            </div>
            <div className="min-w-0">
              <p className={S.userbox_nombre}>{nombre}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={S.userbox_online_sm}>
                  <span className={S.userbox_online_sm_ping} />
                  <span className={S.userbox_online_sm_solido} />
                </span>
                <p className={S.userbox_rol}>{rol}</p>
              </div>
            </div>
          </div>

          <div className={S.userbox_desktop_links_area}>
            <NavLink
              to="/perfil"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                [S.userbox_desktop_link, isActive ? S.userbox_desktop_link_activo : S.userbox_desktop_link_inactivo].join(" ")
              }
            >
              <span className={S.userbox_desktop_link_icono}><UserCircle size={14} /></span>
              Mi perfil
            </NavLink>

            <NavLink
              to="/configuracion/persona"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                [S.userbox_desktop_link, isActive ? S.userbox_desktop_link_activo : S.userbox_desktop_link_inactivo].join(" ")
              }
            >
              <span className={S.userbox_desktop_link_icono}><Settings size={14} /></span>
              Configuración
            </NavLink>
          </div>

          <div className={S.userbox_desktop_logout_area}>
            <button type="button" onClick={cerrarSesion} className={S.userbox_desktop_logout_btn}>
              <span className={S.userbox_logout_icono}><LogOut size={14} /></span>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
