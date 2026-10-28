import { useRouter } from "expo-router";

import { TuileRaccourci } from "~/composants/profil/TuileRaccourci";
import { TEXTES_RACCOURCIS_PAR_LANGUE } from "~/contenus/textes-profil";
import { TEXTES_ENTREE_SUIVIS_PAR_LANGUE } from "~/contenus/textes-profil-onglet";
import { listerPrenomsLangue } from "~/fonctions/langue/lister-prenoms-langue";
import { listerSuivisAffichables } from "~/fonctions/suivi/lister-suivis-affichables";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function EntreeSuivis() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_ENTREE_SUIVIS_PAR_LANGUE);
  const raccourcis = utiliserTextes(TEXTES_RACCOURCIS_PAR_LANGUE);
  const { langue } = utiliserLangue();
  // Abonnements acceptés seulement (une demande en attente ne compte pas encore)
  const { pret, lectureSuivis, nombreAbonnements: nombrePersonnes } = utiliserSuivisPersonnes();
  const { suivis, lectureActivite } = utiliserActivite();
  const { lieux: tousLesLieux } = utiliserLieux();
  const { publications: toutesLesPublications } = utiliserPublications();
  // Comptés comme dans la liste « Tu suis » : ce qui existe encore
  const affichables = listerSuivisAffichables(suivis, tousLesLieux, toutesLesPublications);
  const nombreLieux = affichables.filter((s) => s.type === "lieu").length;
  const nombreCreateurs = affichables.length - nombreLieux;

  const parties = [
    nombrePersonnes > 0 ? T.personnes(nombrePersonnes) : null,
    nombreLieux > 0 ? T.lieux(nombreLieux) : null,
    nombreCreateurs > 0 ? T.createurs(nombreCreateurs) : null,
  ].filter((p) => p !== null);
  // « 2 personnes, 3 lieux et 1 créateur »
  const detail =
    !pret || lectureSuivis !== "lue" || lectureActivite !== "lue"
      ? raccourcis.suivisEnLecture
      : parties.length > 1
        ? listerPrenomsLangue(parties, langue)
        : (parties[0] ?? raccourcis.personne);

  return (
    <TuileRaccourci
      emoji="👀"
      titre={raccourcis.suivis}
      detail={detail}
      indice={raccourcis.indiceSuivis}
      onPress={() => router.push("/suivis")}
    />
  );
}
