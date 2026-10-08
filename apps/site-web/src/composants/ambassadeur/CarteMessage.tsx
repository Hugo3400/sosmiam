import { Form } from "react-router";

import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { MessageAmbassadeur } from "~/types/compte";

/**
 * Un message de l'équipe : texte brut affiché tel quel (échappé, retours à la ligne gardés), et « Marquer comme lu ».
 * Une fois le message lu, son bouton disparaît : le focus passe à la confirmation de la page (routes/ambassadeur/messages.tsx).
 */
export function CarteMessage({ message }: { message: MessageAmbassadeur }) {
  const titreId = `message-${message.id}-titre`;
  return (
    <article aria-labelledby={titreId} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id={titreId} className="text-xl font-extrabold">{message.titre}</h2>
        {!message.luLe && <span className="rounded-full bg-encre px-3 py-1 text-sm font-bold text-jaune">Nouveau</span>}
      </div>
      <p className="mt-1 text-sm text-gris">Reçu le <DateEnLettres iso={message.creeLe} /></p>
      <p className="mt-4 whitespace-pre-line">{message.texte}</p>
      {message.luLe ? (
        <p className="mt-5 text-sm text-gris"><span aria-hidden="true">✓ </span>Lu le <DateEnLettres iso={message.luLe} /></p>
      ) : (
        <Form method="post" className="mt-5">
          <input type="hidden" name="messageId" value={message.id} />
          {/* Le titre du message, lu seulement par les lecteurs d'écran : chaque bouton a son propre nom */}
          <Bouton type="submit" variante="blanc" petit>
            Marquer comme lu<span className="sr-only">{lierPonctuation(` : ${message.titre}`)}</span>
          </Bouton>
        </Form>
      )}
    </article>
  );
}
