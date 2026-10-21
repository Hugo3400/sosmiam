import { EyeOff, Globe, Pencil, Trash2, Users } from "lucide-react";
import { useState } from "react";

import type { OffreCarriereGestion } from "../../../../../packages/commun/src/types/carriere.ts";
import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { DOMAINES_OFFRE, TYPES_OFFRE } from "~/contenus/carriere.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { fermerOffreCarriere, publierOffreCarriere, supprimerOffreCarriere } from "~/services/carriere.ts";
import { ErreurApi } from "~/services/client-gestion.ts";

type Props = { offre: OffreCarriereGestion; onModifier: () => void; onVoirCandidatures: () => void; onChange: (message: string) => void };

export function CarteOffre({ offre: o, onModifier, onVoirCandidatures, onChange }: Props) {
  const [erreur, setErreur] = useState<string | null>(null);
  const ouverte = o.publieeLe !== null && o.fermeeLe === null;
  const etat = o.fermeeLe ? { libelle: "Fermée", ton: "neutre" as const } : o.publieeLe ? { libelle: "Publiée", ton: "vert" as const } : { libelle: "Brouillon", ton: "jaune" as const };

  const agir = (action: () => Promise<unknown>, message: string) =>
    action().then(() => onChange(message), (probleme: unknown) => setErreur(expliquerErreur(probleme instanceof ErreurApi ? probleme : null)));

  return (
    <li className="grid gap-2 rounded-carte border border-ligne bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 font-titre text-base font-extrabold">{o.titre}</p>
        <Badge ton={etat.ton}>{etat.libelle}</Badge>
      </div>
      <p className="text-[13px] text-gris">
        {TYPES_OFFRE.find((t) => t.valeur === o.type)?.libelle} · {DOMAINES_OFFRE.find((d) => d.valeur === o.domaine)?.libelle} · {o.lieu}
        {o.publieeLe ? ` · publiée le ${formaterDate(o.publieeLe)}` : ""}
      </p>
      <p className="text-sm">{o.resume}</p>
      <div className="flex flex-wrap gap-2">
        {!ouverte && <Bouton petit variante="principal" icone={Globe} onClick={() => window.confirm(`Publier « ${o.titre} » sur sosmiam.fr ?`) && agir(() => publierOffreCarriere(o.id), "Offre publiée ✅")}>{o.fermeeLe ? "Rouvrir" : "Publier"}</Bouton>}
        {ouverte && <Bouton petit icone={EyeOff} onClick={() => agir(() => fermerOffreCarriere(o.id), "Offre fermée")}>Fermer</Bouton>}
        <Bouton petit icone={Pencil} onClick={onModifier}>Modifier</Bouton>
        <Bouton petit icone={Users} onClick={onVoirCandidatures}>Candidatures ({o.candidatures}{o.nouvelles ? `, ${o.nouvelles} nouvelle${o.nouvelles > 1 ? "s" : ""}` : ""})</Bouton>
        <Bouton petit variante="danger" icone={Trash2} onClick={() => window.confirm(`Supprimer « ${o.titre} » ? Ses ${o.candidatures} candidature(s) et leurs CV partent avec.`) && agir(() => supprimerOffreCarriere(o.id), "Offre supprimée")}>
          Supprimer
        </Bouton>
      </div>
      {erreur && <p role="alert" className="text-sm font-semibold text-tomate">{erreur}</p>}
    </li>
  );
}
