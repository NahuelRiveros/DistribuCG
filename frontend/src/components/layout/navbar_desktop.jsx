import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import NavbarDropdown from "./navbar_dropdown.jsx";
import { UI_NAVBAR as S } from "./navbar_style.js";

export default function NavbarDesktop({ config }) {
  const [openDropdownId, setOpenDropdownId] = useState(null);

  function toggleDropdown(id) {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  }

  function closeDropdown() {
    setOpenDropdownId(null);
  }

  // El click-afuera ya lo maneja cada NavbarDropdown (conoce su trigger y su
  // panel, aunque el panel esté portado a document.body). Un handler acá
  // duplicaba esa lógica pero sin saber del portal: al clickear un link del
  // panel, mousedown caía "afuera" de navRef y cerraba el dropdown antes de
  // que el click llegara a dispararse, así que el NavLink nunca navegaba.

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeDropdown();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={S.desktop_contenedor}>
      {config.links?.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.exact}
          onClick={closeDropdown}
          className={({ isActive }) =>
            [S.desktop_link, isActive ? S.desktop_link_activo : S.desktop_link_inactivo].join(" ")
          }
        >
          <span className="truncate">{link.label}</span>
        </NavLink>
      ))}

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
