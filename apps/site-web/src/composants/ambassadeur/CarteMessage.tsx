import { useEffect, useRef } from "react";
import { Form } from "react-router";

import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { Bouton } from "~/composants/interface/Bouton";
import type { MessageAmbassadeur } from "~/types/compte";

type Props = {
  message: MessageAmbassadeur;
  /** Vrai juste après « Marquer comme lu » : le bouton disparaît, le focus passe au titre du message */
  vientDEtreLu?: boolean;
};

/** Un message de l'équipe : texte brut affiché tel quel (échappé, retours à la ligne gardés), et « Marquer comme lu ». */
export function CarteMessage({ message, vientDEtreLu = false }: Props) {
  const titre = useRef<HTMLHeadingElement>(null);
  const titreId = `message-${message.id}-titre`;
  useEffect(() => {
    if (vientDEtreLu) titre.current?.focus();
  }, [vientDEtreLu]);

  return (
    <article aria-labelledby={titreId} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 ref={titre} id={titreId} tabIndex={-1} className="text-xl font-extrabold">{message.titre}</h2>
        {!message.luLe && <span className="rounded-full bg-encre px-3 py-1 text-sm font-bold text-jaune">Nouveau</span>}
      </div>
      <p className="mt-1 text-sm text-gris">Reçu le <DateEnLettres iso={message.creeLe} /></p>
      <p className="mt-4 whitespace-pre-line">{message.texte}</p>
      {message.luLe ? (
        <p className="mt-5 text-sm text-gris"><span aria-hidden="true">✓ </span>Lu le <DateEnLettres iso={message.luLe} /></p>
      ) : (
        <Form method="post" className="mt-5">
          <input type="hidden" name="messageId" value={message.id} />
          <Bouton type="submit" variante="blanc" petit>Marquer comme lu</Bouton>
        </Form>
      )}
    </article>
  );
}
