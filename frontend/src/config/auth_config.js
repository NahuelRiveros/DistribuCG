export const authConfig = {
  storageKey: "token", // donde se guarda el token
  endpoints: {
    login: "/auth/login",
    me: "/auth/me",
    logout: "/auth/logout",
    register: "/auth/register", // lo dejamos listo aunque no lo uses todavía
  },
  // para proyectos futuros: campos default
  loginCampos: {
    emailLabel: "Email",
    passwordLabel: "Contraseña",
    botonLabel: "Ingresar",
  },

};

export const registroConfig = {
  titulo: "Crear cuenta",
  subtitulo: "Completá tus datos para registrarte.",
  botonLabel: "Registrar",

  // navegación tras registrarse
  redirigirA: "/login",
};

