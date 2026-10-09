import { useState } from "react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import type { Ecran } from "~/contenus/menu.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireMessageRecu, listerMessagesRecus } from "~/services/boite.ts";
import { LectureMessage } from "./LectureMessage.tsx";

/**
 * La boîte de réception de bonjour@sosmiam.fr : les réponses aux mails partis du logiciel et tout ce qui arrive. Lue en
 * direct sur le serveur mail (rien n'est copié ailleurs) ; une réponse part de bonjour@, dans le même fil.
 */
export function EcranBoite({ allerA, onLu }: { allerA: (ecran: Ecran, id: number | null) => void; onLu: () => void }) {
  const liste = utiliserChargement(() => listerMessagesRecus(), []);
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [automatiques, setAutomatiques] = useState(false);
  const message = utiliserChargement(async () => {
    if (ouvert === null) return null;
    const lu = await lireMessageRecu(ouvert);
    onLu();
    return lu;
  }, [ouvert]);
  const messages = (liste.donnees ?? []).filter((m) => automatiques || !m.automatique);
  const caches = (liste.donnees ?? []).length - messages.length;

  return (
    <>
      <EnTeteEcran titre="Boîte mail" sousTitre="Les mails reçus sur bonjour@sosmiam.fr. Tes réponses partent de cette adresse, dans le même fil de discussion." />
      <MessageErreur erreur={liste.erreur} reessayer={liste.recharger} />
      {!liste.donnees && liste.chargement && <Chargement />}
      {liste.donnees && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <Carte sansMarge titre={`Reçus (${messages.length})`} actions={caches > 0 || automatiques ? <CaseACocher libelle={`Mails automatiques${caches ? ` (${caches})` : ""}`} coche={automatiques} onChange={setAutomatiques} /> : undefined}>
            {messages.length === 0 ? (
              <EtatVide emoji="📭" titre="Rien de neuf">Les réponses aux mails partis du logiciel arriveront ici.</EtatVide>
            ) : (
              <ul className="max-h-[70vh] overflow-y-auto">
                {messages.map((m) => (
                  <li key={m.uid}>
                    <button
                      type="button"
                      aria-current={m.uid === ouvert}
                      onClick={() => {
                        setOuvert(m.uid);
                        m.lu = true;
                      }}
                      className={`grid w-full gap-0.5 border-b border-ligne/70 px-4 py-2.5 text-left text-sm last:border-0 ${m.uid === ouvert ? "bg-jaune-clair" : "hover:bg-creme"} ${m.automatique ? "opacity-60" : ""}`}
                    >
                      <span className="flex items-baseline gap-2">
                        {!m.lu && <span className="size-2 shrink-0 rounded-full bg-tomate" aria-label="pas lu" />}
                        <span className={`min-w-0 flex-1 truncate ${m.lu ? "" : "font-extrabold"}`}>{m.compte?.prenom ?? (m.de.nom || m.de.adresse)}</span>
                        <span className="shrink-0 text-xs text-gris">{m.date ? formaterDateRelative(m.date) : ""}</span>
                      </span>
                      <span className={`truncate ${m.lu ? "text-gris" : "font-semibold"}`}>{m.repondu ? "↩︎ " : ""}{m.objet || "(sans objet)"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Carte>
          <div className="min-w-0">
            {ouvert === null && <Carte><EtatVide emoji="✉️" titre="Choisis un mail">Il s'ouvre ici, avec « Répondre » et la fiche de la personne si elle a un compte.</EtatVide></Carte>}
            <MessageErreur erreur={message.erreur} reessayer={message.recharger} />
            {ouvert !== null && !message.donnees && message.chargement && <Chargement />}
            {message.donnees && <LectureMessage message={message.donnees} onOuvrirCompte={(id) => allerA("utilisateurs", id)} onRepondu={liste.recharger} />}
          </div>
        </div>
      )}
    </>
  );
}
