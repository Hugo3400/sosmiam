import { liensLegaux } from "~/contenus/legal/liens-legaux";
import { site } from "~/contenus/legal/informations-legales";

/**
 * Pied de page simple des pages légales et de /liens.
 * Les liens sont des <a> classiques (rechargement complet), hérités de l'époque de la page « Bientôt ».
 */
export function PiedDePageLegal() {
  return (
    <footer className="bg-encre py-8 text-creme">
      <nav aria-label="Pages légales" className="mx-auto flex w-[min(1120px,100%-32px)] flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
        {liensLegaux.map((lien) => <a key={lien.href} href={lien.href} className="opacity-80 hover:opacity-100">{lien.texte}</a>)}
        <a href={`mailto:${site.emailContact}`} className="opacity-80 hover:opacity-100">Contact</a>
      </nav>
    </footer>
  );
}
