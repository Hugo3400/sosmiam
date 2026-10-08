import { Form } from "react-router";

import { Bouton } from "~/composants/interface/Bouton";

/**
 * « Se déconnecter » : un petit formulaire envoyé à /deconnexion (POST, vérifié par React Router ; l'adresse seule ne
 * déconnecte pas). En lien discret dans l'en-tête, en bouton dans « Mon compte ».
 */
export function BoutonDeconnexion({ discret = false }: { discret?: boolean }) {
  return (
    <Form method="post" action="/deconnexion">
      {discret ? (
        <button
          type="submit"
          className="font-medium whitespace-nowrap decoration-jaune decoration-[3px] underline-offset-4 hover:underline
            focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
        >
          Se déconnecter
        </button>
      ) : (
        <Bouton type="submit" variante="blanc">Se déconnecter</Bouton>
      )}
    </Form>
  );
}
