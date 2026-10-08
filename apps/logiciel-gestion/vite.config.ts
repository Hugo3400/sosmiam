import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Interface du logiciel de gestion. Tauri l'affiche dans sa fenêtre (dist/ une fois construite, ce serveur en développement).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) } },
  clearScreen: false,
  server: { host: "127.0.0.1", port: 5193, strictPort: true },
  build: { target: "chrome120", sourcemap: false },
});
