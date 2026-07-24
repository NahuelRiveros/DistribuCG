import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { UI_NAVBAR as S } from "../styles_components/ui_navbar_style.jsx";

export default function NavbarDropdown({ dropdown, open = false, onToggle, onClose }) {
  const Icon = dropdown.icon;
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        onClose();
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`Abrir menú ${dropdown.label}`}
        className={[
          S.dropdown_trigger,
          open ? S.dropdown_trigger_abierto : S.dropdown_trigger_cerrado,
        ].join(" ")}
      >
        {Icon && <Icon size={16} className="shrink-0" />}
        <span className="truncate">{dropdown.label}</span>
        <ChevronDown
          size={14}
          className={[S.dropdown_chevron, open ? S.dropdown_chevron_abierto : ""].join(" ")}
        />
      </button>

      {open && (
        <div className={dropdown.wide ? S.dropdown_panel_ancho : S.dropdown_panel}>
          <div className={S.dropdown_cabecera}>
            {Icon && <span className={S.dropdown_cabecera_icono}><Icon size={13} /></span>}
            <span className={S.dropdown_cabecera_label}>{dropdown.label}</span>
          </div>

          {dropdown.wide ? (
            <div className={S.dropdown_columnas}>
              {dropdown.items?.map((item) => {
                if (!item.children?.length) return null;
                const GroupIcon = item.icon;
                return (
                  <div key={item.label} className={S.dropdown_columna}>
                    <div className={S.dropdown_columna_grupo_cabecera}>
                      {GroupIcon && (
                        <span className={S.dropdown_columna_grupo_icono}>
                          <GroupIcon size={11} />
                        </span>
                      )}
                      <span className={S.item_grupo_label}>{item.label}</span>
                    </div>
                    <div className={S.item_lista}>
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            onClick={onClose}
                            className={({ isActive }) =>
                              [S.item_link_ancho, isActive ? S.item_link_activo : S.item_link_inactivo].join(" ")
                            }
                          >
                            {ChildIcon && (
                              <span className={S.item_icono_ancho}><ChildIcon size={11} /></span>
                            )}
                            <span className="leading-tight">{child.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={S.dropdown_lista}>
              {dropdown.items?.map((item) => {
                const ItemIcon = item.icon;

                if (item.children?.length) {
                  return (
                    <div key={item.label} className="mb-1 last:mb-0">
                      <div className={S.dropdown_grupo_cabecera}>
                        {ItemIcon && (
                          <span className={S.dropdown_grupo_icono}><ItemIcon size={11} /></span>
                        )}
                        <span className={S.item_grupo_label}>{item.label}</span>
                      </div>
                      <div className={S.item_lista}>
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              onClick={onClose}
                              className={({ isActive }) =>
                                [S.item_link, isActive ? S.item_link_activo : S.item_link_inactivo].join(" ")
                              }
                            >
                              {ChildIcon && (
                                <span className={S.item_icono}><ChildIcon size={13} /></span>
                              )}
                              <span className="truncate">{child.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                      <div className={S.dropdown_grupo_divisor} />
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      [S.item_link, isActive ? S.item_link_activo : S.item_link_inactivo].join(" ")
                    }
                  >
                    {ItemIcon && <span className={S.item_icono}><ItemIcon size={13} /></span>}
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
