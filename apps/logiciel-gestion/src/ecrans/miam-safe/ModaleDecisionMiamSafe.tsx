import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { ACTIONS_MIAM_SAFE } from "~/contenus/miam-safe.ts";
import type { ActionMiamSafe } from "~/services/miam-safe.ts";

type Props = {
  nomLieu: string;
  enCours: boolean;
  erreur: string | null;
  onFermer: () => void;
  onConfirmer: (choix: { action: ActionMiamSafe; note: string }) => void;
};

/** Décider d'un signalement Miam Safe : ce qu'on fait, et pourquoi (obligatoire dès qu'on agit sur le lieu). */
export function ModaleDecisionMiamSafe({ nomLieu, enCours, erreur, onFermer, onConfirmer }: Props) {
  const [action, setAction] = useState<ActionMiamSafe>("lieu-contacte");
  const [note, setNote] = useState("");
  const noteRequise = action !== "aucune";
  const valide = !noteRequise || note.trim().length >= 10;

  return (
    <Modale
      titre={`Signalement sur ${nomLieu}`}
      ouverte
      onFermer={onFermer}
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante={action === "charte-retiree" || action === "lieu-masque" ? "danger" : "principal"} desactive={!valide} chargement={enCours}
            onClick={() => onConfirmer({ action, note: note.trim() })}>
            Confirmer
          </Bouton>
        </>
      }
    >
      <div className="grid gap-4">
        <Selecteur
          libelle="Ce que tu fais"
          valeur={action}
          onChange={(valeur) => setAction(valeur as ActionMiamSafe)}
          options={Object.entries(ACTIONS_MIAM_SAFE).map(([valeur, a]) => ({ valeur, libelle: a.libelle }))}
          className="w-full"
        />
        <p className="rounded-xl bg-creme px-3 py-2 text-[13px]">{ACTIONS_MIAM_SAFE[action].effet}</p>
        <ZoneTexte
          libelle={noteRequise ? "Pourquoi, et ce que tu as dit au lieu (privé, obligatoire)" : "Note privée (facultative)"}
          valeur={note}
          onChange={setNote}
          maximum={1000}
          lignes={3}
          aide="Rien de cette note n'apparaît sur la fiche du lieu. La personne qui a raconté n'est jamais nommée au lieu."
        />
        {erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{erreur}</p>}
      </div>
    </Modale>
  );
}
