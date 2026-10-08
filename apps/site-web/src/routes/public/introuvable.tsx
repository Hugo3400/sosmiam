import { data } from "react-router";

// Toute adresse sans page (dernière route de routes.ts) : 404, affichée par l'ErrorBoundary de root.tsx (« Page
// introuvable »). Cette route existe pour que les middlewares de root.tsx passent aussi par ces adresses : partage des
// hôtes (ambassadeur.sosmiam.fr/xxx → 301 vers sosmiam.fr/xxx) et statistiques (la 404 est comptée).
export function loader() {
  throw data(null, { status: 404 });
}

// Un formulaire envoyé à une adresse inconnue : 404 aussi (sans action, React Router répondrait 405)
export function action() {
  throw data(null, { status: 404 });
}

// Obligatoire : sans composant, React Router prendrait cette route pour une simple ressource, sans la page d'erreur
export default function PageIntrouvable() {
  return null;
}
