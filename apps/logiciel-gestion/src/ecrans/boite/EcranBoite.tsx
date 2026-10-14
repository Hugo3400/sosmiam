import { useState } from "react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import type { Ecran } from "~/contenus/menu.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireMessageRecu, listerMessagesRecus, type DossierBoite } from "~/services/boite.ts";
import { LectureMessage } from "./LectureMessage.tsx";

const DOSSIERS: { valeur: DossierBoite; libelle: string; vide: string }[] = [
  { valeur: "recus", libelle: "Reçus", vide: "Les réponses aux mails partis du logiciel arriveront ici." },
  { valeur: "envoyes", libelle: "Envoyés", vide: "Chaque mail qui part de bonjour@ (écrit à la main ou automatique) est rangé ici, liens personnels masqués." },
  { valeur: "indesirables", libelle: "Indésirables", vide: "Rien dans les indésirables : le filtre du serveur mail n'a rien écarté." },
];

/**
 * La boîte mail de bonjour@sosmiam.fr : les mails reçus, une copie de tous ceux qui partent (même automatiques, liens
 * personnels masqués ; une seule copie par envoi groupé), et les indésirables. Lue en direct sur le serveur mail ; une
 * réponse part de bonjour@, dans le même fil.
 */
export function EcranBoite({ allerA, onLu }: { allerA: (ecran: Ecran, id: number | null) => void; onLu: () => void }) {
  const [dossier, setDossier] = useState<DossierBoite>("recus");
  const liste = utiliserChargement(() => listerMessagesRecus(undefined, dossier), [dossier]);
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [automatiques, setAutomatiques] = useState(false);
  const message = utiliserChargement(async () => {
    if (ouvert === null) return null;
    const lu = await lireMessageRecu(ouvert, dossier);
    onLu();
    return lu;
  }, [ouvert]);
  const messages = (liste.donnees ?? []).filter((m) => automatiques || !m.automatique);
  const caches = (liste.donnees ?? []).length - messages.length;
  const actuel = DOSSIERS.find((d) => d.valeur === dossier) ?? DOSSIERS[0]!;

  return (
    <>
      <EnTeteEcran titre="Boîte mail" sousTitre="Les mails de bonjour@sosmiam.fr : reçus, envoyés (même automatiques) et indésirables. Tes réponses partent de cette adresse, dans le même fil de discussion." />
      <div className="mb-4">
        <Onglets libelle="Dossier" valeur={dossier} onChange={(valeur) => (setDossier(valeur), setOuvert(null))} options={DOSSIERS.map(({ valeur, libelle }) => ({ valeur, libelle }))} />
      </div>
      <MessageErreur erreur={liste.erreur} reessayer={liste.recharger} />
      {!liste.donnees && liste.chargement && <Chargement />}
      {liste.donnees && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <Carte sansMarge titre={`${actuel.libelle} (${messages.length})`} actions={caches > 0 || automatiques ? <CaseACocher libelle={`Mails automatiques${caches ? ` (${caches})` : ""}`} coche={automatiques} onChange={setAutomatiques} /> : undefined}>
            {messages.length === 0 ? (
              <EtatVide emoji="📭" titre="Rien ici">{actuel.vide}</EtatVide>
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
                        <span className={`min-w-0 flex-1 truncate ${m.lu ? "" : "font-extrabold"}`}>{dossier === "envoyes" ? `À ${m.compte?.prenom ?? (m.a[0]?.nom || m.a[0]?.adresse || "?")}` : m.compte?.prenom ?? (m.de.nom || m.de.adresse)}</span>
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
            {message.donnees && <LectureMessage message={message.donnees} dossier={dossier} onOuvrirCompte={(id) => allerA("utilisateurs", id)} onRepondu={liste.recharger} />}
          </div>
        </div>
      )}
    </>
  );
}
