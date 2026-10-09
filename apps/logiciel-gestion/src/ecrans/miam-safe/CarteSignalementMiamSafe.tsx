import { Clock, Gavel } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { BoutonEcrireMail } from "~/composants/interface/BoutonEcrireMail.tsx";
import { ACTIONS_MIAM_SAFE, RAISONS_MIAM_SAFE } from "~/contenus/miam-safe.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { deciderSignalementMiamSafe, type ActionMiamSafe, type SignalementMiamSafe } from "~/services/miam-safe.ts";
import { ModaleDecisionMiamSafe } from "./ModaleDecisionMiamSafe.tsx";

/** Un signalement Miam Safe : le lieu, ce qui s'est passé, la personne (pour lui répondre), et la décision. */
export function CarteSignalementMiamSafe({ signalement: s, onDecide }: { signalement: SignalementMiamSafe; onDecide: () => void }) {
  const [ouverte, setOuverte] = useState(false);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });

  async function confirmer(choix: { action: ActionMiamSafe; note: string }) {
    setEtat({ enCours: true, erreur: null });
    try {
      await deciderSignalementMiamSafe(s.id, choix);
      setOuverte(false);
      setEtat({ enCours: false, erreur: null });
      onDecide();
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <article className={`grid gap-4 rounded-carte border bg-white p-5 lg:grid-cols-[minmax(0,1fr)_auto] ${s.enRetard ? "border-2 border-tomate" : "border-ligne"}`}>
      <div className="grid content-start gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge ton={s.raison === "agression" ? "rouge" : "jaune"}>{RAISONS_MIAM_SAFE[s.raison] ?? s.raison}</Badge>
          {s.enRetard && <Badge ton="rouge"><Clock className="size-3.5" aria-hidden /> Plus de 48 h</Badge>}
          <Badge ton={s.lieu.charteActive ? "encre" : "contour"}>{s.lieu.charteActive ? "🛡 Charte signée" : "Sans charte"}</Badge>
          {s.action && <Badge ton="vert">{ACTIONS_MIAM_SAFE[s.action].libelle}</Badge>}
          <span className="text-xs text-gris">{formaterDate(s.creeLe, true)}</span>
        </div>
        <p className="font-titre text-lg font-extrabold">{s.lieu.emoji} {s.lieu.nom} <span className="text-sm font-semibold text-gris">· {s.lieu.ville} · lieu n° {s.lieu.id}</span></p>
        {s.explication ? <p className="rounded-xl bg-creme px-3 py-2 text-sm whitespace-pre-line">« {s.explication} »</p> : <p className="text-sm text-gris">Pas de détail écrit.</p>}
        <p className="text-[13px] text-gris">
          {s.compte ? `Raconté par ${s.compte.prenom} (${s.compte.email}). Ne jamais donner son nom au lieu.` : "La personne a supprimé son compte depuis."}
        </p>
        {s.note && <p className="text-sm"><strong>Ta note :</strong> {s.note}</p>}
      </div>
      <div className="flex flex-col gap-2 lg:w-56">
        {s.statut === "a-traiter" && <Bouton variante="principal" icone={Gavel} onClick={() => setOuverte(true)}>Décider</Bouton>}
        {s.compte && (
          <BoutonEcrireMail
            destinataire={{ compteId: s.compte.id, adresse: s.compte.email, prenom: s.compte.prenom }}
            categorie="moderation"
            lieu={s.lieu.nom}
            objet={`Ce que tu nous as raconté sur ${s.lieu.nom}`}
            libelle="Répondre à la personne"
          />
        )}
      </div>
      {ouverte && <ModaleDecisionMiamSafe nomLieu={s.lieu.nom} enCours={etat.enCours} erreur={etat.erreur} onFermer={() => setOuverte(false)} onConfirmer={confirmer} />}
    </article>
  );
}
