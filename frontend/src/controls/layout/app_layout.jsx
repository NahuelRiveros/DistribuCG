import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./navbar/navbar.jsx";
import Footer from "./footer.jsx";
import SuscripcionBanner from "../suscripcion/suscripcion_banner.jsx";
import ErrorBoundary from "../ui/error_boundary.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

export default function AppLayout({ children }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollToTop />
      <Navbar />
      <SuscripcionBanner />
      <main>
        <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
