import { ThumbsUp } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { donnerRaisonAuClient, type ContestationVisite } from "~/services/surveillance.ts";

type Props = { ouverte: boolean; contestation: ContestationVisite; onFermer: () => void; onFait: () => void };

/** Confirmer « donner raison au client » : ce qui va se passer pour lui, et pour le lieu (rien). */
export function ModaleDonnerRaison({ ouverte, contestation: c, onFermer, onFait }: Props) {
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const valider = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      await donnerRaisonAuClient(c.id);
      onFermer();
      onFait();
    } catch (probleme) {
      setErreur(expliquerErreur(probleme instanceof ErreurApi ? probleme : null));
    } finally {
      setEnvoi(false);
    }
  };
  return (
    <Modale
      titre="Donner raison au client ?"
      ouverte={ouverte}
      onFermer={onFermer}
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" icone={ThumbsUp} chargement={envoi} onClick={valider}>Donner raison</Bouton>
        </>
      }
    >
      <ul className="grid list-disc gap-1.5 pl-5 text-sm">
        <li>La visite de <span className="font-semibold">{c.compte.prenom}</span> chez <span className="font-semibold">{c.lieu.nom}</span> passe en validée, comme si le lieu l'avait validée : points, tampon de fidélité, avis à donner.</li>
        <li>{c.compte.prenom} reçoit une notification : « On a revu ta visite, elle est validée ».</li>
        <li>Le lieu n'est pas prévenu, ne voit jamais le mot du client et ne pourra pas annuler cette validation.</li>
      </ul>
      <p className="mt-3 text-[13px] text-gris">C'est noté au journal (numéros seulement).</p>
      {erreur && <p role="alert" className="mt-3 text-sm font-semibold text-tomate">{erreur}</p>}
    </Modale>
  );
}
