import { useRouter } from "expo-router";

import { TuileRaccourci } from "~/composants/profil/TuileRaccourci";
import { TEXTES_RACCOURCIS } from "~/contenus/textes-profil";
import { listerSuivisAffichables } from "~/fonctions/suivi/lister-suivis-affichables";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

export function EntreeSuivis() {
  const router = useRouter();
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
    nombrePersonnes > 0 ? `${nombrePersonnes} personne${nombrePersonnes > 1 ? "s" : ""}` : null,
    nombreLieux > 0 ? `${nombreLieux} lieu${nombreLieux > 1 ? "x" : ""}` : null,
    nombreCreateurs > 0 ? `${nombreCreateurs} créateur${nombreCreateurs > 1 ? "s" : ""}` : null,
  ].filter((p) => p !== null);
  // « 2 personnes, 3 lieux et 1 créateur »
  const detail =
    !pret || lectureSuivis !== "lue" || lectureActivite !== "lue"
      ? TEXTES_RACCOURCIS.suivisEnLecture
      : parties.length > 1
        ? `${parties.slice(0, -1).join(", ")} et ${parties[parties.length - 1]}`
        : (parties[0] ?? TEXTES_RACCOURCIS.personne);

  return (
    <TuileRaccourci
      emoji="👀"
      titre={TEXTES_RACCOURCIS.suivis}
      detail={detail}
      indice={TEXTES_RACCOURCIS.indiceSuivis}
      onPress={() => router.push("/suivis")}
    />
  );
}
