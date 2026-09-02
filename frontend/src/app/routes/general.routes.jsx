import HomePage from "../../modules/home/home_page.jsx";
import LoginPage from "../../modules/usuarios/login_page.jsx";
import RegisterPage from "../../modules/usuarios/register_page.jsx";

export const generalRoutes = [
  { path: "/", element: <HomePage /> },
  { path: "*", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
];
