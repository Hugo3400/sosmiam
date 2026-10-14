import { Form } from "react-router";

import { Bouton } from "~/composants/interface/Bouton";

type Props = {
  /** Refus enregistré par le cookie de /statistiques */
  refus: boolean;
  /** Le navigateur envoie « Global Privacy Control » ou « Do Not Track » */
  signalNavigateur: boolean;
};

/** L'encadré de /statistiques : compté ou pas, et le bouton pour changer (droit d'opposition, en un clic). */
export function ChoixStatistiques({ refus, signalNavigateur }: Props) {
  const compte = !refus && !signalNavigateur;
  return (
    <div className="rounded-carte border-2 border-encre bg-white p-6 text-encre shadow-brut">
      <p className="text-xl font-extrabold" role="status">{compte ? "Tes visites sont comptées" : "Tes visites ne sont pas comptées"}</p>
      <p className="mt-3 text-gris">
        {signalNavigateur
          ? "Ton navigateur demande à ne pas être suivi (signal « Global Privacy Control » ou « Do Not Track ») : on respecte, tu n'es pas compté. Rien d'autre à faire."
          : refus
            ? "C'est noté : un petit cookie retient ton choix pendant 13 mois dans ce navigateur. Il ne sert qu'à ça. Si tu effaces tes cookies, il faudra refaire ton choix."
            : "Tu préfères ne pas être compté, même anonymement ? Un clic suffit. On garde ton choix 13 mois dans un petit cookie qui ne sert qu'à ça."}
      </p>
      {!signalNavigateur && (
        <Form method="post" className="mt-5">
          <input type="hidden" name="choix" value={refus ? "accepter" : "refuser"} />
          <Bouton type="submit" variante={refus ? "jaune" : "blanc"}>
            {refus ? "Compter à nouveau mes visites" : "Ne plus compter mes visites"}
          </Bouton>
        </Form>
      )}
    </div>
  );
}
