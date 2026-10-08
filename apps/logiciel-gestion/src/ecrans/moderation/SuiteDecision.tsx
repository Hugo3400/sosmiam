import { Copy, MessageSquareWarning } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { MOTIFS_MODERATION } from "~/contenus/motifs-moderation.ts";
import { creerMessageAuteur } from "~/fonctions/moderation/creer-message-auteur.ts";
import { creerReponseSignalement } from "~/fonctions/moderation/creer-reponse-signalement.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { contesterSignalement, type Signalement } from "~/services/moderation.ts";
import { copier } from "~/services/systeme.ts";

/**
 * Après la décision : la règle et l'explication, les messages prêts à envoyer (à l'auteur, à la personne qui a signalé)
 * tant qu'ils ne partent pas tout seuls, et la contestation reçue par mail.
 */
export function SuiteDecision({ signalement, contenu, onChange }: { signalement: Signalement; contenu: string; onChange: () => void }) {
  const [contestation, setContestation] = useState<string | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });
  const decision = signalement.statut === "retenu" ? "retenu" : "rejete";
  const reexamen = !!signalement.reexamineLe;
  const message = creerMessageAuteur({
    decision, motif: signalement.motif, motivation: signalement.motivation, contenu, masqueeDesLeSignalement: signalement.urgent, reexamen,
  });
  const reponse = creerReponseSignalement({ decision, motif: signalement.motif, dateSignalement: formaterDate(signalement.creeLe), contenu });

  async function enregistrerContestation() {
    if (!contestation) return;
    setEtat({ enCours: true, texte: null });
    try {
      await contesterSignalement(signalement.id, contestation.trim());
      setContestation(null);
      setEtat({ enCours: false, texte: null });
      onChange();
    } catch (probleme) {
      setEtat({ enCours: false, texte: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <div className="grid gap-2 text-sm">
      {signalement.motif && <p><strong>Règle :</strong> {MOTIFS_MODERATION[signalement.motif]?.libelle ?? signalement.motif}</p>}
      {signalement.motivation && <p><strong>Pourquoi :</strong> {signalement.motivation}</p>}
      {reexamen && <p className="text-gris">Réexaminé le {formaterDate(signalement.reexamineLe!)} après contestation.</p>}
      <div className="flex flex-wrap gap-2">
        <Bouton petit icone={Copy} onClick={() => copier(message).then(() => setEtat({ enCours: false, texte: "Message à l'auteur copié : colle-le dans ta messagerie." }))}>Message à l'auteur</Bouton>
        <Bouton petit icone={Copy} onClick={() => copier(reponse).then(() => setEtat({ enCours: false, texte: "Réponse au signalement copiée." }))}>Réponse au signalement</Bouton>
        {!signalement.contesteLe || reexamen ? (
          <Bouton petit variante="discret" icone={MessageSquareWarning} onClick={() => setContestation("")}>Contestation reçue…</Bouton>
        ) : null}
      </div>
      <p className="text-[13px] text-gris">Tant que l'app n'a pas de comptes, ces messages partent de ta messagerie (l'auteur d'une vidéo, ou la personne qui a écrit à bonjour@).</p>
      {etat.texte && <p role="status" className="font-semibold">{etat.texte}</p>}
      {contestation !== null && (
        <Modale
          titre="Contestation reçue"
          ouverte
          onFermer={() => setContestation(null)}
          actions={
            <>
              <Bouton onClick={() => setContestation(null)}>Annuler</Bouton>
              <Bouton variante="principal" desactive={contestation.trim().length < 5} chargement={etat.enCours} onClick={enregistrerContestation}>À réexaminer</Bouton>
            </>
          }
        >
          <ZoneTexte libelle="Ce que la personne conteste (copie son message)" valeur={contestation} onChange={setContestation} maximum={1000} lignes={5} />
          <p className="mt-3 text-sm text-gris">La décision passe dans « Contestés » : tu la réexamines avec un œil neuf, puis tu lui réponds.</p>
        </Modale>
      )}
    </div>
  );
}
