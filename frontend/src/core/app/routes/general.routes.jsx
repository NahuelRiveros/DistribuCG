import { lazy } from "react";
const RecoveryPage = lazy(() => import("../../modules/usuarios/recovery_page.jsx"));
const HomePage = lazy(() => import("../../modules/home/home_page.jsx"));
const LoginPage = lazy(() => import("../../modules/usuarios/login_page.jsx"));
const RegisterPage = lazy(() => import("../../modules/usuarios/register_page.jsx"));

export const generalRoutes = [
  { path: "/", element: <HomePage /> },
  { path: "*", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <RecoveryPage /> },
  { path: "/reset-password", element: <RecoveryPage reset /> },
];
