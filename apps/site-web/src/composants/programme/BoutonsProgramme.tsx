import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE } from "~/contenus/programme-ambassadeur";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Sur fond jaune : le bouton principal passe à l'encre */
  surJaune?: boolean;
  centre?: boolean;
};

/** Les deux portes d'entrée de l'espace ambassadeur : créer son compte, ou se connecter. */
export function BoutonsProgramme({ surJaune = false, centre = false }: Props) {
  const T = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).boutons;
  return (
    <div className={`flex flex-wrap gap-3.5 ${centre ? "justify-center" : ""}`}>
      <Bouton vers="/inscription" variante={surJaune ? "encre" : "jaune"}>{T.creer}</Bouton>
      <Bouton vers="/connexion" variante="blanc">{T.connexion}</Bouton>
    </div>
  );
}
