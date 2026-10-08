import { Link } from "react-router";

import { Logo } from "~/composants/interface/Logo";
import { liensLegaux } from "~/contenus/legal/liens-legaux";

/** Pied de page commun : FAQ, contact et pages légales. */
export function PiedDePage() {
  const annee = new Date().getFullYear();
  return (
    <footer className="bg-encre py-10 text-creme">
      <div className="mx-auto flex w-[min(1120px,100%-32px)] flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
        <Logo clair />
        <nav aria-label="Liens du pied de page" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link to="/faq" className="opacity-80 hover:opacity-100">FAQ</Link>
          <a href="mailto:bonjour@sosmiam.fr" className="opacity-80 hover:opacity-100">Contact</a>
          {liensLegaux.map((lien) => <Link key={lien.href} to={lien.href} className="opacity-80 hover:opacity-100">{lien.texte}</Link>)}
        </nav>
        {/* Année calculée au rendu : peut différer entre serveur et navigateur autour du 1er janvier */}
        <p className="text-sm opacity-70" suppressHydrationWarning>© {annee} SOS Miam — fait avec 🧡 pour les adresses de ton quartier</p>
      </div>
    </footer>
  );
}
