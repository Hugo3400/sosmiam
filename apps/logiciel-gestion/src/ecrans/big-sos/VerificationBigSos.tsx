import { Target } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { ETATS_MISSION } from "~/contenus/ambassadeurs.ts";
import { SelecteurAmbassadeur } from "~/ecrans/ambassadeurs/SelecteurAmbassadeur.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { envoyerVerification, type FicheBigSos } from "~/services/big-sos.ts";
import { ErreurApi } from "~/services/client-gestion.ts";

/** La vérification sur place : la mission confiée à un ambassadeur, son compte rendu, ou de quoi en confier une. */
export function VerificationBigSos({ bigSos, onChange }: { bigSos: FicheBigSos; onChange: () => void }) {
  const [compteId, setCompteId] = useState<number | null>(null);
  const [echeance, setEcheance] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const peutEnvoyer = ["demande", "verification"].includes(bigSos.phase);
  const { mission } = bigSos;

  async function envoyer() {
    if (!compteId) return;
    setEtat({ enCours: true, erreur: null });
    try {
      await envoyerVerification(bigSos.id, compteId, echeance ? new Date(`${echeance}T23:59:00`).toISOString() : null);
      setEtat({ enCours: false, erreur: null });
      setCompteId(null);
      onChange();
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <section className="grid gap-3">
      <h3 className="font-extrabold">Vérification sur place</h3>
      {mission ? (
        <div className="grid gap-2 rounded-xl border border-ligne p-3 text-sm">
          <p>
            Confiée à <strong>{mission.compte.prenom}</strong> <Badge ton={ETATS_MISSION[mission.statut].ton}>{ETATS_MISSION[mission.statut].libelle}</Badge>
            {mission.echeance && mission.statut === "a-faire" && <span className="text-gris"> · pour le {formaterDate(mission.echeance)}</span>}
            {mission.faiteLe && <span className="text-gris"> · faite le {formaterDate(mission.faiteLe)}</span>}
          </p>
          {mission.compteRendu ? <p className="rounded-lg bg-creme px-3 py-2 whitespace-pre-line">💬 {mission.compteRendu}</p> : <p className="text-gris">Son compte rendu arrivera ici.</p>}
        </div>
      ) : (
        <p className="text-sm text-gris">Personne n'est encore allé voir. Un ambassadeur du coin passe sur place et raconte ce qu'il a vu.</p>
      )}
      {peutEnvoyer && (
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_11rem_auto] md:items-end">
          <SelecteurAmbassadeur libelle={mission ? "Confier à quelqu'un d'autre" : "Ambassadeur"} valeur={compteId} onChange={setCompteId} />
          <Champ libelle="Pour le (facultatif)" type="date" valeur={echeance} onChange={setEcheance} className="w-full min-w-0" />
          <Bouton icone={Target} desactive={!compteId} chargement={etat.enCours} onClick={envoyer}>Envoyer vérifier</Bouton>
        </div>
      )}
      {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
    </section>
  );
}
