import { Eye, EyeOff } from "lucide-react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerCommentairesIdee, masquerCommentaireIdee } from "~/services/communaute.ts";

const nom = (a: { pseudo: string | null; prenom: string } | null) => (a ? (a.pseudo ? `@${a.pseudo}` : a.prenom) : "compte supprimé");

export function CommentairesIdee({ ideeId }: { ideeId: number }) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerCommentairesIdee(ideeId), [ideeId]);
  if (!donnees) return chargement ? <Chargement /> : <MessageErreur erreur={erreur} reessayer={recharger} />;
  if (donnees.commentaires.length === 0) return <p className="text-sm text-gris">Pas encore de commentaire.</p>;
  return (
    <ul className="grid gap-2">
      {donnees.commentaires.map((c) => (
        <li key={c.id} className={`grid gap-1 rounded-xl px-3 py-2 text-sm ${c.masque || c.retire ? "bg-ligne/50 text-gris" : "bg-creme"} ${c.reponseAId ? "ml-6" : ""}`}>
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold">{nom(c.auteur)}</span>
            <span className="text-gris">{formaterDate(c.creeLe, true)}</span>
            {c.masque && <Badge>Masqué</Badge>}
            {c.suspendu && <Badge ton="jaune">Signalé</Badge>}
            {c.retire && <Badge ton="rouge">Retiré</Badge>}
            {!c.retire && (
              <span className="ml-auto">
                <Bouton petit variante="discret" icone={c.masque ? Eye : EyeOff} onClick={() => masquerCommentaireIdee(c.id, !c.masque).then(recharger, recharger)}>
                  {c.masque ? "Remettre" : "Masquer"}
                </Bouton>
              </span>
            )}
          </div>
          <p className="whitespace-pre-line">{c.texte}</p>
        </li>
      ))}
    </ul>
  );
}
