import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import NavbarDropdown from "./navbar_dropdown.jsx";
import { UI_NAVBAR as S } from "../styles_components/ui_navbar_style.jsx";

export default function NavbarDesktop({ config }) {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const navRef = useRef(null);

  function toggleDropdown(id) {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  }

  function closeDropdown() {
    setOpenDropdownId(null);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        closeDropdown();
      }
    }
    if (openDropdownId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeDropdown();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={navRef} className={S.desktop_contenedor}>
      {config.links?.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            onClick={closeDropdown}
            className={({ isActive }) =>
              [S.desktop_link, isActive ? S.desktop_link_activo : S.desktop_link_inactivo].join(" ")
            }
          >
            {Icon && <Icon size={16} className="shrink-0" />}
            <span className="truncate">{link.label}</span>
          </NavLink>
        );
      })}

      {config.dropdowns?.map((dropdown) => (
        <NavbarDropdown
          key={dropdown.id}
          dropdown={dropdown}
          open={openDropdownId === dropdown.id}
          onToggle={() => toggleDropdown(dropdown.id)}
          onClose={closeDropdown}
        />
      ))}
    </div>
  );
}
