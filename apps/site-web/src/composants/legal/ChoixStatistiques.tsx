import { Form } from "react-router";

import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_CHOIX_STATISTIQUES_PAR_LANGUE } from "~/contenus/legal/choix-statistiques";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Refus enregistré par le cookie de /statistiques */
  refus: boolean;
  /** Le navigateur envoie « Global Privacy Control » ou « Do Not Track » */
  signalNavigateur: boolean;
};

/** L'encadré de /statistiques : compté ou pas, et le bouton pour changer (droit d'opposition, en un clic). */
export function ChoixStatistiques({ refus, signalNavigateur }: Props) {
  const T = utiliserTextes(TEXTES_CHOIX_STATISTIQUES_PAR_LANGUE);
  const compte = !refus && !signalNavigateur;
  return (
    <div className="rounded-carte border-2 border-encre bg-white p-6 text-encre shadow-brut">
      <p className="text-xl font-extrabold" role="status">{compte ? T.comptees : T.nonComptees}</p>
      <p className="mt-3 text-gris">
        {signalNavigateur ? T.signalNavigateur : refus ? T.refus : T.proposition}
      </p>
      {!signalNavigateur && (
        <Form method="post" className="mt-5">
          <input type="hidden" name="choix" value={refus ? "accepter" : "refuser"} />
          <Bouton type="submit" variante={refus ? "jaune" : "blanc"}>
            {refus ? T.compterANouveau : T.nePlusCompter}
          </Bouton>
        </Form>
      )}
    </div>
  );
}
