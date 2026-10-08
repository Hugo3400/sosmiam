import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque";
import "./styles/app.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Application } from "./Application.tsx";

const racine = document.getElementById("racine");
if (racine) createRoot(racine).render(<StrictMode><Application /></StrictMode>);
