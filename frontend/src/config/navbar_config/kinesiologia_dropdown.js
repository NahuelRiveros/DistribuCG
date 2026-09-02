import { HeartPulse, Users, Stethoscope } from "lucide-react";

// Independiente de gym_dropdown.js — el gate maestro (projectModules.kinesiologia,
// de gate_config.js) se aplica en main.js.
export const kinesiologiaDropdown = {
  id: "kinesiologia",
  labelNoAuth: "Kinesiología",
  labelAuth: "Kinesiología",
  icon: HeartPulse,
  items: [
    {
      label: "Pacientes",
      to: "/admin/kinesiologia",
      requiereAuth: true,
      modulo: "kinesiologia",
      roles: ["admin", "profesional"],
      icon: Users,
    },
    {
      label: "Patologías",
      to: "/admin/kinesiologia/patologias",
      requiereAuth: true,
      modulo: "kinesiologia",
      roles: ["admin", "profesional"],
      icon: Stethoscope,
    },
  ],
};
