import ProtectedRoute from "../../components/acceso/protected_route.jsx";

export function protegida(element, roles) {
  return roles ? (
    <ProtectedRoute roles={roles}>{element}</ProtectedRoute>
  ) : (
    <ProtectedRoute>{element}</ProtectedRoute>
  );
}
