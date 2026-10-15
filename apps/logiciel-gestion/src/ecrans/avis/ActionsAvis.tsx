import { Check, EyeOff } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ModaleDecisionModeration, type ChoixModeration } from "~/ecrans/moderation/ModaleDecisionModeration.tsx";
import type { DecisionAvis } from "~/services/avis.ts";
import { ErreurApi } from "~/services/client-gestion.ts";

type Props = {
  /** « l'avis » ou « la réponse du lieu » */
  le: string;
  /** Ce qui se passe quand on masque, dit à l'équipe */
  siMasque: string;
  trancher: (decision: DecisionAvis) => Promise<unknown>;
  onDecide: () => void;
};

/** « Publier » (rien ne change pour personne) ou « Masquer » (règle enfreinte et explication pour l'auteur, contestable 6 mois). */
export function ActionsAvis({ le, siMasque, trancher, onDecide }: Props) {
  const [masquer, setMasquer] = useState(false);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });

  async function agir(decision: DecisionAvis) {
    setEtat({ enCours: true, erreur: null });
    try {
      await trancher(decision);
      setMasquer(false);
      onDecide();
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, erreur: erreur?.code === "deja-tranche" ? "Déjà tranché depuis un autre poste : actualise la liste." : expliquerErreur(erreur) });
    }
  }
  const confirmer = (choix: ChoixModeration) => agir({ action: "masquer", motif: choix.motif ?? "", motivation: choix.motivation ?? "" });

  return (
    <div className="flex flex-col gap-2 lg:w-52">
      <Bouton icone={Check} chargement={etat.enCours && !masquer} onClick={() => agir({ action: "publier" })}>Publier</Bouton>
      <Bouton variante="danger" icone={EyeOff} onClick={() => (setEtat({ enCours: false, erreur: null }), setMasquer(true))}>Masquer</Bouton>
      {etat.erreur && !masquer && <p role="alert" className="text-sm font-semibold text-tomate">{etat.erreur}</p>}
      {masquer && (
        <ModaleDecisionModeration
          decision="retenu"
          cible={{ le }}
          explication={siMasque}
          urgent={false}
          reexamen={false}
          enCours={etat.enCours}
          erreur={etat.erreur}
          onFermer={() => setMasquer(false)}
          onConfirmer={confirmer}
        />
      )}
    </div>
  );
}
