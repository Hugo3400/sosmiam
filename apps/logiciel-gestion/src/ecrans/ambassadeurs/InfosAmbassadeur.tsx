import { Save } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { modifierAmbassadeur, type FicheAmbassadeur } from "~/services/ambassadeurs.ts";
import { ErreurApi } from "~/services/client-gestion.ts";

/** Ville, quartier, et la note privée de l'équipe (jamais montrée dans son espace). */
export function InfosAmbassadeur({ fiche, onChange }: { fiche: FicheAmbassadeur; onChange: () => void }) {
  const [ville, setVille] = useState(fiche.ambassadeur?.ville ?? "");
  const [quartier, setQuartier] = useState(fiche.ambassadeur?.quartier ?? "");
  const [note, setNote] = useState(fiche.ambassadeur?.noteEquipe ?? "");
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });
  const modifie = ville !== (fiche.ambassadeur?.ville ?? "") || quartier !== (fiche.ambassadeur?.quartier ?? "") || note !== (fiche.ambassadeur?.noteEquipe ?? "");

  async function enregistrer() {
    setEtat({ enCours: true, texte: null });
    try {
      await modifierAmbassadeur(fiche.id, { ville: ville.trim(), quartier: quartier.trim() || null, noteEquipe: note.trim() || null });
      setEtat({ enCours: false, texte: "Enregistré ✅" });
      onChange();
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, texte: erreur?.champ === "ville" ? "La ville ne peut pas être vide." : expliquerErreur(erreur) });
    }
  }

  return (
    <section className="grid gap-3">
      <h3 className="font-extrabold">Ville et note de l'équipe</h3>
      <div className="grid grid-cols-2 gap-3">
        <Champ libelle="Ville" valeur={ville} onChange={setVille} maxLength={80} className="w-full min-w-0" />
        <Champ libelle="Quartier" valeur={quartier} onChange={setQuartier} maxLength={80} className="w-full min-w-0" />
      </div>
      <ZoneTexte libelle="Note privée (jamais montrée dans son espace)" valeur={note} onChange={setNote} maximum={2000} lignes={3} placeholder="Rencontré au marché, super motivé, connaît tous les bouchons du coin…" />
      <div className="flex items-center gap-3">
        <Bouton petit icone={Save} desactive={!modifie || !ville.trim()} chargement={etat.enCours} onClick={enregistrer}>Enregistrer</Bouton>
        {etat.texte && <p role="status" className="text-sm font-semibold">{etat.texte}</p>}
      </div>
    </section>
  );
}
