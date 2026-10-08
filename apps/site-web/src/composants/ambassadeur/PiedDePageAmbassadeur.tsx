import { site } from "~/contenus/legal/informations-legales";
import { liensLegaux } from "~/contenus/legal/liens-legaux";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/**
 * Pied de page de l'espace ambassadeur. Les pages légales sont sur sosmiam.fr : adresses complètes (l'espace a son propre
 * sous-domaine, une adresse courte resterait sur ambassadeur.sosmiam.fr).
 */
export function PiedDePageAmbassadeur() {
  return (
    <footer className="bg-encre py-8 text-creme">
      <nav aria-label="Pages légales" className="mx-auto flex w-[min(1120px,100%-32px)] flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
        {liensLegaux.map((lien) => (
          <a key={lien.href} href={`https://${site.adresse}${lien.href}`} className="opacity-80 hover:opacity-100">{lien.texte}</a>
        ))}
        <a href={`mailto:${site.emailContact}`} className="opacity-80 hover:opacity-100">Contact</a>
      </nav>
      <p className="mx-auto mt-4 w-[min(1120px,100%-32px)] text-center text-sm opacity-70">
        {lierPonctuation("SOS Miam Ambassadeurs : un programme de passionnés, dès 18 ans.")}
      </p>
    </footer>
  );
}
