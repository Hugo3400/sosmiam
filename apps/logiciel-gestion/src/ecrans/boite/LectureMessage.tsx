import { Reply, UserRound } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { ModaleEcrireMail } from "~/composants/interface/ModaleEcrireMail.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { repondreMessageRecu, type MessageComplet } from "~/services/boite.ts";

type Props = { message: MessageComplet; onOuvrirCompte?: (compteId: number) => void; onRepondu: () => void };

/** Un mail reçu, en entier : qui, quand, le texte, les pièces jointes (nommées), et « Répondre » dans le même fil. */
export function LectureMessage({ message, onOuvrirCompte, onRepondu }: Props) {
  const [reponse, setReponse] = useState(false);
  const [bilan, setBilan] = useState<string | null>(null);
  const prenom = message.compte?.prenom ?? (message.de.nom || null);
  return (
    <article className="grid gap-3">
      <div className="grid gap-1">
        <h2 className="font-titre text-xl font-extrabold">{message.objet || "(sans objet)"}</h2>
        <p className="text-sm">
          <strong>{message.de.nom || message.de.adresse}</strong>
          {message.de.nom && <span className="text-gris"> · {message.de.adresse}</span>}
          {message.date && <span className="text-gris"> · {formaterDate(message.date, true)}</span>}
        </p>
        {message.repondreA.adresse !== message.de.adresse && <p className="text-[13px] text-gris">Réponse demandée à : {message.repondreA.adresse}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Bouton variante="principal" icone={Reply} onClick={() => (setBilan(null), setReponse(true))}>Répondre</Bouton>
        {message.compte && onOuvrirCompte && <Bouton icone={UserRound} onClick={() => onOuvrirCompte(message.compte!.id)}>Ouvrir la fiche de {message.compte.prenom}</Bouton>}
      </div>
      {bilan && <p role="status" className="rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{bilan}</p>}
      <div className="rounded-xl border border-ligne bg-white p-4 text-[15px] leading-relaxed whitespace-pre-wrap">{message.texte || "(mail vide)"}</div>
      {message.pieces.length > 0 && (
        <p className="text-sm text-gris">📎 {message.pieces.join(" · ")} (pièces jointes : à ouvrir depuis ta messagerie)</p>
      )}
      <ModaleEcrireMail
        ouverte={reponse}
        onFermer={() => setReponse(false)}
        destinataire={{ adresse: message.repondreA.adresse, prenom }}
        objet={/^re\s*:/i.test(message.objet) ? message.objet : `Re: ${message.objet}`}
        envoyer={(texte) => repondreMessageRecu(message.uid, texte)}
        onEnvoye={(texte) => {
          setBilan(texte);
          onRepondu();
        }}
      />
    </article>
  );
}
