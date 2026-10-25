import { CLASSE_BLOC, CLASSE_TITRE_BLOC } from "~/composants/lieux/classes-fiche-lieu";
import { SourceDuLieu } from "~/composants/lieux/SourceDuLieu";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { listerSpecialitesCarte } from "~/fonctions/carte/lister-specialites-carte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FichePublique } from "~/types/pro";

export function BlocLeLieu({ lieu }: { lieu: FichePublique }) {
  const T = TEXTES_FICHE_LIEU.lieu;
  const specialite = lieu.type === "resto" ? listerSpecialitesCarte(lieu.carte, 1)[0] : undefined;
  if (!lieu.texte && !lieu.source && !specialite) return null;
  return (
    <section aria-labelledby="fiche-presentation" className={`flex flex-col gap-3.5 ${CLASSE_BLOC}`}>
      <h2 id="fiche-presentation" className={CLASSE_TITRE_BLOC}>{T.titre[lieu.type]}</h2>
      {lieu.texte && <p lang="fr" className="leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">{lieu.texte}</p>}
      {specialite && (
        <p className="text-[15px]">
          <strong>{lierPonctuation(T.specialite)}</strong>
          <span lang="fr">{specialite.nom}</span>
        </p>
      )}
      {lieu.source && <SourceDuLieu source={lieu.source} />}
    </section>
  );
}
