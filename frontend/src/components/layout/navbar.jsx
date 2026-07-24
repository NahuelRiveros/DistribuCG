import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/auth_context.jsx";
import { filtrarNavbarPorRol } from "./navbar_permissions.js";
import { navbar_config } from "./navbar_config.jsx";
import NavbarDesktop from "./navbar_desktop.jsx";
import NavbarMobile from "./navbar_mobile.jsx";
import NavbarUserBox from "./navbar_userbox.jsx";
import { UI_NAVBAR as S } from "../styles_components/ui_navbar_style.jsx";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { usuario } = useAuth();

  const navbarFiltrado = filtrarNavbarPorRol(navbar_config, usuario);

  function cerrarMobile() {
    setMobileOpen(false);
  }

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 6);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") cerrarMobile();
    }
    if (mobileOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className={[S.barra_header, scrolled ? S.barra_header_con_sombra : ""].join(" ")}>
        <div className={S.barra_linea_acento} />

        <nav className={S.barra_nav_container}>
          <NavLink to={navbar_config.brand.linkTo} onClick={cerrarMobile} className={S.brand_link}>
            {navbar_config.brand.logoUrl ? (
              <img
                src={navbar_config.brand.logoUrl}
                alt={navbar_config.brand.titulo}
                className="h-9 w-9 rounded-xl object-cover shadow-md"
              />
            ) : (
              <div className={S.brand_badge}>
                {navbar_config.brand.fallbackLetter}
                <div className={S.brand_badge_brillo} />
              </div>
            )}

            {navbar_config.brand.mostrarTitulo !== false && (
              <div className={S.brand_textos}>
                <p className={S.brand_titulo}>{navbar_config.brand.titulo}</p>
                {navbar_config.brand.mostrarSubtitulo && navbar_config.brand.subtitulo && (
                  <p className={S.brand_subtitulo}>{navbar_config.brand.subtitulo}</p>
                )}
              </div>
            )}
          </NavLink>

          <NavbarDesktop config={navbarFiltrado} />

          <div className="hidden shrink-0 lg:block">
            {usuario ? (
              <NavbarUserBox />
            ) : (
              <NavLink to="/login" className={S.btn_login_desktop}>
                Iniciar sesión
              </NavLink>
            )}
          </div>

          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
              className={S.btn_hamburguesa}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        <NavbarMobile config={navbarFiltrado} open={mobileOpen} onNavigate={cerrarMobile} />
      </header>

      {mobileOpen && (
        <div className={S.barra_backdrop_mobile} onClick={cerrarMobile} aria-hidden="true" />
      )}
    </>
  );
}
