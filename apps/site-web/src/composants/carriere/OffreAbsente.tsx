import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_CARRIERE_PAR_LANGUE, TEXTES_OFFRE_CARRIERE_PAR_LANGUE } from "~/contenus/carriere";
import { creerLienEcrireNous } from "~/fonctions/carriere/creer-lien-ecrire-nous";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function OffreAbsente({ cas }: { cas: "introuvable" | "indisponible" }) {
  const C = utiliserTextes(TEXTES_CARRIERE_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_OFFRE_CARRIERE_PAR_LANGUE).absente;
  const lien = utiliserLienLangue();
  const { titre, texte } = T[cas];
  return (
    <section className="bg-creme py-16 md:py-24">
      <div className="mx-auto flex w-[min(760px,100%-32px)] flex-col items-center rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut md:px-12">
        <Mascotte expression="surprise" className="h-28 w-28" />
        <h1 className="mt-4 text-[clamp(2rem,5vw,2.8rem)] font-extrabold tracking-tight">{lierPonctuation(titre)}</h1>
        <p className="mt-3 max-w-lg text-lg text-gris">{lierPonctuation(texte)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Bouton vers={lien("/carriere")} variante="encre">{T.voirOffres}</Bouton>
          <Bouton href={creerLienEcrireNous(C.sujetMail)} variante="blanc">{C.ecrisNous}</Bouton>
        </div>
      </div>
    </section>
  );
}
