import { Bouton } from "~/composants/interface/Bouton";

type Props = {
  /** Sur fond jaune : le bouton principal passe à l'encre */
  surJaune?: boolean;
  centre?: boolean;
};

/** Les deux portes d'entrée de l'espace ambassadeur : créer son compte, ou se connecter. */
export function BoutonsProgramme({ surJaune = false, centre = false }: Props) {
  return (
    <div className={`flex flex-wrap gap-3.5 ${centre ? "justify-center" : ""}`}>
      <Bouton vers="/inscription" variante={surJaune ? "encre" : "jaune"}>Créer mon compte</Bouton>
      <Bouton vers="/connexion" variante="blanc">J'ai déjà un compte</Bouton>
    </div>
  );
}
