import { FileText, Trash2 } from "lucide-react";
import { useState } from "react";

import type { CandidatureGestion, StatutCandidature } from "../../../../../packages/commun/src/types/carriere.ts";
import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { BoutonEcrireMail } from "~/composants/interface/BoutonEcrireMail.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { STATUTS_CANDIDATURE } from "~/contenus/carriere.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { changerStatutCandidature, supprimerCandidatureCarriere } from "~/services/carriere.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { VisionneuseCv } from "./VisionneuseCv.tsx";

type Props = { candidature: CandidatureGestion; onChange: (message: string) => void };

export function CarteCandidature({ candidature: c, onChange }: Props) {
  const [cv, setCv] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const agir = (action: () => Promise<unknown>, message: string) =>
    action().then(() => onChange(message), (probleme: unknown) => setErreur(expliquerErreur(probleme instanceof ErreurApi ? probleme : null)));

  return (
    <li className={`grid gap-2 rounded-carte border bg-white p-4 ${c.statut === "nouvelle" ? "border-2 border-jaune" : "border-ligne"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 font-titre text-base font-extrabold">{c.nom}</p>
        {c.statut === "nouvelle" && <Badge ton="jaune">Nouvelle</Badge>}
      </div>
      <p className="text-[13px] text-gris">{c.offreTitre} · reçue le {formaterDate(c.creeLe, true)} · {c.email} · effacée le {formaterDate(c.effaceeLe)}</p>
      <p className="rounded-xl bg-creme px-3 py-2 text-sm whitespace-pre-line">{c.message}</p>
      {c.lien && <p className="text-[13px]">Lien donné : <span className="font-semibold break-all">{c.lien}</span></p>}
      <div className="flex flex-wrap items-end gap-2">
        <Selecteur libelle="Statut" valeur={c.statut} onChange={(statut: StatutCandidature) => agir(() => changerStatutCandidature(c.id, statut), "Statut changé ✅")} options={STATUTS_CANDIDATURE} className="w-44" />
        {c.aUnCv && <Bouton petit icone={FileText} onClick={() => setCv(true)}>Voir le CV</Bouton>}
        <BoutonEcrireMail destinataire={{ adresse: c.email, prenom: c.nom }} categorie="autre" objet={`Ta candidature : ${c.offreTitre}`} />
        <span className="ml-auto">
          <Bouton petit variante="danger" icone={Trash2} onClick={() => window.confirm(`Supprimer la candidature de ${c.nom}${c.aUnCv ? " et son CV" : ""} ?`) && agir(() => supprimerCandidatureCarriere(c.id), "Candidature supprimée")}>
            Supprimer
          </Bouton>
        </span>
      </div>
      {erreur && <p role="alert" className="text-sm font-semibold text-tomate">{erreur}</p>}
      {cv && <VisionneuseCv candidatureId={c.id} nom={c.nom} onFermer={() => setCv(false)} />}
    </li>
  );
}
