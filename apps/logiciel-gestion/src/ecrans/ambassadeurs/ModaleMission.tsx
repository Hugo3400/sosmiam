import { Target } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { creerMission } from "~/services/ambassadeurs.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { SelecteurAmbassadeur } from "./SelecteurAmbassadeur.tsx";

type Props = { compteId?: number; prenom?: string; onFermer: () => void; onCreee: () => void };

/** Confier une mission à un ambassadeur actif : il la voit dans son espace, et la termine avec un compte rendu. */
export function ModaleMission({ compteId: compteImpose, prenom, onFermer, onCreee }: Props) {
  const [compteId, setCompteId] = useState<number | null>(compteImpose ?? null);
  const [titre, setTitre] = useState("");
  const [detail, setDetail] = useState("");
  const [echeance, setEcheance] = useState("");
  const [lieuId, setLieuId] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });

  async function confier() {
    setEtat({ enCours: true, erreur: null });
    try {
      await creerMission({
        compteId: compteId!,
        titre: titre.trim(),
        detail: detail.trim(),
        lieuId: lieuId ? Number(lieuId) : null,
        // Échéance : la fin de la journée choisie
        echeance: echeance ? new Date(`${echeance}T23:59:00`).toISOString() : null,
      });
      onCreee();
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, erreur: erreur?.champ === "lieuId" ? "Ce numéro de lieu ne va pas." : expliquerErreur(erreur) });
    }
  }

  return (
    <Modale
      titre={prenom ? `Une mission pour ${prenom}` : "Confier une mission"}
      ouverte
      onFermer={onFermer}
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" icone={Target} desactive={!compteId || !titre.trim()} chargement={etat.enCours} onClick={confier}>Confier la mission</Bouton>
        </>
      }
    >
      <div className="grid gap-4">
        {!compteImpose && <SelecteurAmbassadeur valeur={compteId} onChange={setCompteId} />}
        <Champ libelle="Mission" valeur={titre} onChange={setTitre} maxLength={100} placeholder="Goûter le nouveau bouchon de la rue Mercière" className="w-full min-w-0" />
        <ZoneTexte libelle="Détails (facultatif)" valeur={detail} onChange={setDetail} maximum={2000} lignes={4} placeholder="Ce qu'il faut regarder, à qui parler, quoi photographier…" />
        <div className="grid grid-cols-2 gap-3">
          <Champ libelle="Pour le (facultatif)" type="date" valeur={echeance} onChange={setEcheance} className="w-full min-w-0" />
          <Champ libelle="N° de fiche du lieu (facultatif)" type="number" min={1} valeur={lieuId} onChange={setLieuId} aide="Visible dans « Lieux »" className="w-full min-w-0" />
        </div>
        <p className="text-sm text-gris">Elle apparaît dans son espace ambassadeur. Une fois la mission faite, son compte rendu s'affiche ici.</p>
        {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
      </div>
    </Modale>
  );
}
