import { Reply, UserRound } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { ModaleEcrireMail } from "~/composants/interface/ModaleEcrireMail.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { repondreMessageRecu, type DossierBoite, type MessageComplet } from "~/services/boite.ts";
import { ApercuHtmlMail } from "./ApercuHtmlMail.tsx";
import { PiecesMessage } from "./PiecesMessage.tsx";

type Props = { message: MessageComplet; dossier?: DossierBoite; onOuvrirCompte?: (compteId: number) => void; onRepondu: () => void };

/**
 * Un mail en entier : qui, quand, sa mise en forme (ou le texte seul), ses images et pièces jointes, et « Répondre » dans le
 * même fil (pas pour un mail envoyé).
 */
export function LectureMessage({ message, dossier = "recus", onOuvrirCompte, onRepondu }: Props) {
  const [vue, setVue] = useState<"forme" | "texte">("forme");
  const [reponse, setReponse] = useState(false);
  const [bilan, setBilan] = useState<string | null>(null);
  const prenom = message.compte?.prenom ?? (message.de.nom || null);
  return (
    <article className="grid gap-3">
      <div className="grid gap-1">
        <h2 className="font-titre text-xl font-extrabold">{message.objet || "(sans objet)"}</h2>
        <p className="text-sm">
          {dossier === "envoyes" ? (
            <><span className="text-gris">À </span><strong>{message.a.map((d) => d.nom || d.adresse).join(", ") || "?"}</strong>
              {message.a[0]?.nom && <span className="text-gris"> · {message.a[0].adresse}</span>}</>
          ) : (
            <><strong>{message.de.nom || message.de.adresse}</strong>{message.de.nom && <span className="text-gris"> · {message.de.adresse}</span>}</>
          )}
          {message.date && <span className="text-gris"> · {formaterDate(message.date, true)}</span>}
        </p>
        {dossier !== "envoyes" && message.repondreA.adresse !== message.de.adresse && <p className="text-[13px] text-gris">Réponse demandée à : {message.repondreA.adresse}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {dossier !== "envoyes" && <Bouton variante="principal" icone={Reply} onClick={() => (setBilan(null), setReponse(true))}>Répondre</Bouton>}
        {message.compte && onOuvrirCompte && <Bouton icone={UserRound} onClick={() => onOuvrirCompte(message.compte!.id)}>Ouvrir la fiche de {message.compte.prenom}</Bouton>}
      </div>
      {bilan && <p role="status" className="rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{bilan}</p>}
      {message.html && (
        <div><Onglets libelle="Affichage" valeur={vue} onChange={setVue} options={[{ valeur: "forme", libelle: "Mise en forme" }, { valeur: "texte", libelle: "Texte seul" }]} /></div>
      )}
      {message.html && vue === "forme"
        ? <ApercuHtmlMail html={message.html} titre={message.objet} />
        : <div className="rounded-xl border border-ligne bg-white p-4 text-[15px] leading-relaxed whitespace-pre-wrap">{message.texte || "(mail vide)"}</div>}
      <PiecesMessage uid={message.uid} dossier={dossier} pieces={message.pieces} />
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
