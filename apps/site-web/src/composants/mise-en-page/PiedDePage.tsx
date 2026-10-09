import { Link } from "react-router";

import { Logo } from "~/composants/interface/Logo";
import { site } from "~/contenus/legal/informations-legales";
import { groupesPiedDePage, type LienPiedDePage } from "~/contenus/liens-pied-de-page";
import { HOTE_AMBASSADEUR, HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Espace = "principal" | "ambassadeur" | "pro";

type Props = {
  /** Le site qui affiche le pied de page : les liens vers l'autre site deviennent des adresses complètes */
  espace?: Espace;
  /** Phrase sous le logo ; par défaut celle de sosmiam.fr */
  accroche?: string;
};

const classeLien = "opacity-80 underline-offset-4 hover:underline hover:opacity-100";

/** Un lien du pied de page : <Link> sur le même site, <a> avec l'adresse complète vers l'autre site ou un réseau. */
function LienDuPied({ lien, espace }: { lien: LienPiedDePage; espace: Espace }) {
  if (lien.site === espace) return <Link to={lien.adresse} className={classeLien}>{lien.texte}</Link>;
  const hotes = { principal: site.adresse, ambassadeur: HOTE_AMBASSADEUR, pro: HOTE_PRO, externe: null };
  const hote = hotes[lien.site];
  const adresse = hote ? `https://${hote}${lien.adresse}` : lien.adresse;
  return <a href={adresse} className={classeLien}>{lien.texte}</a>;
}

/** Pied de page de sosmiam.fr, de l'espace ambassadeur et de l'espace pro : tous les liens du site, de l'espace, des réseaux et légaux. */
export function PiedDePage({ espace = "principal", accroche = "Fait avec 🧡 pour les adresses de ton quartier." }: Props) {
  const annee = new Date().getFullYear();
  return (
    <footer className="bg-encre pt-12 pb-8 text-creme">
      <div className="mx-auto w-[min(1120px,100%-32px)]">
        <div className="grid gap-10 md:grid-cols-[1fr_3fr]">
          <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
            <Logo clair />
            <p className="max-w-60 text-sm opacity-80">{lierPonctuation(accroche)}</p>
          </div>
          <nav aria-label="Tous les liens" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {groupesPiedDePage.map((groupe, position) => (
              <div key={groupe.titre}>
                <h2 id={`pied-groupe-${position}`} className="mb-3 font-titre text-base font-extrabold text-jaune">{groupe.titre}</h2>
                <ul aria-labelledby={`pied-groupe-${position}`} className="flex flex-col gap-2 text-sm">
                  {groupe.liens.map((lien) => <li key={lien.adresse}><LienDuPied lien={lien} espace={espace} /></li>)}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        {/* Année calculée au rendu : peut différer entre serveur et navigateur autour du 1er janvier */}
        <p className="mt-10 border-t border-creme/15 pt-6 text-center text-sm opacity-70" suppressHydrationWarning>© {annee} SOS Miam</p>
      </div>
    </footer>
  );
}
