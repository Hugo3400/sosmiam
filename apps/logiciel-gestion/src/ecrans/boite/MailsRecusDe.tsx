import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireMessageRecu, listerMessagesRecus } from "~/services/boite.ts";
import { LectureMessage } from "./LectureMessage.tsx";

/** Dans la fiche d'un compte : les mails reçus de son adresse sur bonjour@ (chargés à la demande), lisibles et répondables. */
export function MailsRecusDe({ adresse, prenom }: { adresse: string; prenom: string }) {
  const [voir, setVoir] = useState(false);
  const [ouvert, setOuvert] = useState<number | null>(null);
  const liste = utiliserChargement(async () => (voir ? listerMessagesRecus(adresse) : null), [voir, adresse]);
  const message = utiliserChargement(async () => (ouvert === null ? null : lireMessageRecu(ouvert)), [ouvert]);

  if (!voir) return <Bouton petit onClick={() => setVoir(true)}>Voir les mails reçus de {prenom}</Bouton>;
  return (
    <div className="grid gap-2">
      <MessageErreur erreur={liste.erreur} reessayer={liste.recharger} />
      {!liste.donnees && liste.chargement && <Chargement />}
      {liste.donnees?.length === 0 && <p className="text-sm text-gris">Aucun mail reçu de {adresse} dans bonjour@.</p>}
      {liste.donnees && liste.donnees.length > 0 && (
        <ul className="grid gap-0.5 rounded-xl border border-ligne p-1 text-sm">
          {liste.donnees.map((m) => (
            <li key={m.uid}>
              <button type="button" onClick={() => setOuvert(m.uid)} className="flex w-full items-baseline gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-creme">
                <span className={`min-w-0 flex-1 truncate ${m.lu ? "" : "font-extrabold"}`}>{m.repondu ? "↩︎ " : ""}{m.objet || "(sans objet)"}</span>
                <span className="shrink-0 text-xs text-gris">{m.date ? formaterDateRelative(m.date) : ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {ouvert !== null && (
        <Modale large titre="Mail reçu" ouverte onFermer={() => setOuvert(null)}>
          <MessageErreur erreur={message.erreur} reessayer={message.recharger} />
          {!message.donnees && message.chargement && <Chargement />}
          {message.donnees && <LectureMessage message={message.donnees} onRepondu={liste.recharger} />}
        </Modale>
      )}
    </div>
  );
}
