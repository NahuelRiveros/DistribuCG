import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../../auth/auth_context.jsx";
import NavbarUserBox from "./navbar_userbox.jsx";
import { UI_NAVBAR as S } from "../styles_components/ui_navbar_style.jsx";

export default function NavbarMobile({ config, open, onNavigate }) {
  const [openGroups, setOpenGroups] = useState({});
  const { usuario } = useAuth();

  function toggleGroup(id) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleNavigate() {
    setOpenGroups({});
    onNavigate();
  }

  return (
    <div
      className={[
        S.mobile_panel,
        open ? S.mobile_panel_abierto : S.mobile_panel_cerrado,
      ].join(" ")}
    >
      <div className={S.mobile_scroll}>
        {(config.links?.length ?? 0) > 0 && (
          <div className={S.mobile_links_lista}>
            {config.links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact}
                  onClick={handleNavigate}
                  className={({ isActive }) =>
                    [S.mobile_link, isActive ? S.mobile_link_activo : S.mobile_link_inactivo].join(" ")
                  }
                >
                  {Icon && <span className={S.mobile_link_icono}><Icon size={15} /></span>}
                  {link.label}
                </NavLink>
              );
            })}
          </div>
        )}

        {(config.dropdowns?.length ?? 0) > 0 && (
          <div className={S.mobile_dropdowns_lista}>
            {config.dropdowns.map((dropdown) => {
              const Icon = dropdown.icon;
              const isOpen = Boolean(openGroups[dropdown.id]);

              return (
                <div
                  key={dropdown.id}
                  className={[
                    S.mobile_dropdown_tarjeta,
                    isOpen ? S.mobile_dropdown_tarjeta_abierta : S.mobile_dropdown_tarjeta_cerrada,
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(dropdown.id)}
                    className={[
                      S.mobile_dropdown_trigger,
                      isOpen ? S.mobile_dropdown_trigger_abierto : S.mobile_dropdown_trigger_cerrado,
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-3">
                      <span className={isOpen ? S.mobile_dropdown_icono_abierto : S.mobile_dropdown_icono_cerrado}>
                        {Icon && <Icon size={16} />}
                      </span>
                      <span className={isOpen ? S.mobile_dropdown_label_abierto : S.mobile_dropdown_label_cerrado}>
                        {dropdown.label}
                      </span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={isOpen ? S.mobile_dropdown_chevron_abierto : S.mobile_dropdown_chevron_cerrado}
                    />
                  </button>

                  {isOpen && (
                    <div className={S.mobile_dropdown_contenido}>
                      {dropdown.items?.map((item) => {
                        const ItemIcon = item.icon;

                        if (item.children?.length) {
                          return (
                            <div key={item.label} className={S.mobile_subgrupo_wrapper}>
                              <div className={S.mobile_subgrupo_cabecera}>
                                {ItemIcon && (
                                  <span className={S.mobile_subgrupo_icono}><ItemIcon size={11} /></span>
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
                                      onClick={handleNavigate}
                                      className={({ isActive }) =>
                                        [S.item_link, isActive ? S.item_link_activo : S.item_link_inactivo].join(" ")
                                      }
                                    >
                                      {ChildIcon && <span className={S.item_icono}><ChildIcon size={13} /></span>}
                                      <span className="truncate">{child.label}</span>
                                    </NavLink>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={handleNavigate}
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
              );
            })}
          </div>
        )}

        <div className={S.mobile_pie_usuario}>
          {usuario ? (
            <NavbarUserBox mobile onLogout={handleNavigate} />
          ) : (
            <NavLink to="/login" onClick={handleNavigate} className={S.mobile_btn_login}>
              Iniciar sesión
            </NavLink>
          )}
        </div>
      </div>
    </div>
  );
}
