import { Award, Trash2 } from "lucide-react";
import { useState } from "react";

import type { GraviteSignalementSecurite, SignalementSecuriteGestion, StatutSignalementSecurite } from "../../../../../packages/commun/src/types/securite.ts";
import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { BoutonEcrireMail } from "~/composants/interface/BoutonEcrireMail.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { CIBLES_SECURITE, GRAVITES_SECURITE, STATUTS_SECURITE } from "~/contenus/securite.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { changerSignalementSecurite, donnerBadgeSecurite, supprimerSignalementSecurite } from "~/services/securite.ts";
import { CaptureSecurite } from "./CaptureSecurite.tsx";

const ERREURS: Record<string, string> = {
  "sans-nom-tableau": "La personne n'a pas donné de nom pour le tableau d'honneur.",
  "compte-introuvable": "Aucun compte SOS Miam confirmé avec cet e-mail : pas de badge possible.",
};

export function CarteSignalementSecurite({ signalement: s, onChange }: { signalement: SignalementSecuriteGestion; onChange: (message: string) => void }) {
  const [erreur, setErreur] = useState<string | null>(null);
  const agir = (action: () => Promise<unknown>, message: string) =>
    action().then(() => onChange(message), (probleme: unknown) => {
      const e = probleme instanceof ErreurApi ? probleme : null;
      setErreur((e && ERREURS[e.code]) ?? expliquerErreur(e));
    });

  return (
    <li className={`grid gap-2 rounded-carte border bg-white p-4 ${s.statut === "nouveau" ? "border-2 border-tomate" : "border-ligne"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 font-titre text-base font-extrabold">{s.titre}</p>
        {s.gravite && <Badge ton={s.gravite === "critique" || s.gravite === "haute" ? "rouge" : "jaune"}>{GRAVITES_SECURITE.find((g) => g.valeur === s.gravite)?.libelle}</Badge>}
        {s.statut === "nouveau" && <Badge ton="rouge">Nouveau</Badge>}
      </div>
      <p className="text-[13px] text-gris">
        {CIBLES_SECURITE[s.cible]} · {s.nom} · {s.email} · reçu le {formaterDate(s.creeLe, true)}
        {s.effaceLe ? ` · effacé le ${formaterDate(s.effaceLe)}` : ""}
      </p>
      <p className="rounded-xl bg-creme px-3 py-2 text-sm whitespace-pre-line">{s.description}</p>
      {s.lien && <p className="text-[13px]">Lien donné : <span className="font-semibold break-all">{s.lien}</span></p>}
      {s.images > 0 && <div className="grid gap-2">{Array.from({ length: s.images }, (_, i) => <CaptureSecurite key={i} signalementId={s.id} numero={i} />)}</div>}
      <div className="flex flex-wrap items-end gap-3">
        <Selecteur libelle="Statut" valeur={s.statut} onChange={(statut: StatutSignalementSecurite) => agir(() => changerSignalementSecurite(s.id, { statut }), "Statut changé ✅")} options={STATUTS_SECURITE} className="w-40" />
        <Selecteur
          libelle="Gravité"
          valeur={s.gravite ?? ""}
          onChange={(gravite: GraviteSignalementSecurite | "") => agir(() => changerSignalementSecurite(s.id, { gravite: gravite || null }), "Gravité notée ✅")}
          options={GRAVITES_SECURITE}
          className="w-48"
        />
        <BoutonEcrireMail destinataire={{ adresse: s.email, prenom: s.nom }} categorie="autre" objet={`Ton signalement : ${s.titre}`} />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {s.nomTableauHonneur ? (
          <CaseACocher
            libelle={`Au tableau d'honneur sous le nom « ${s.nomTableauHonneur} »`}
            coche={s.auTableauHonneur}
            onChange={(auTableauHonneur) => agir(() => changerSignalementSecurite(s.id, { auTableauHonneur }), auTableauHonneur ? "Ajouté au tableau d'honneur ✅" : "Retiré du tableau d'honneur")}
          />
        ) : (
          <span className="text-gris">Pas de nom pour le tableau d'honneur.</span>
        )}
        {s.badgeDonne ? (
          <Badge ton="vert">Badge « Chasseur de bugs » donné</Badge>
        ) : s.compteTrouve ? (
          <Bouton petit icone={Award} onClick={() => agir(() => donnerBadgeSecurite(s.id), "Badge « Chasseur de bugs » donné ✅")}>Donner le badge</Bouton>
        ) : (
          <span className="text-gris">Pas de compte SOS Miam avec cet e-mail : pas de badge.</span>
        )}
        <span className="ml-auto">
          <Bouton petit variante="danger" icone={Trash2} onClick={() => window.confirm("Supprimer ce signalement et ses captures ?") && agir(() => supprimerSignalementSecurite(s.id), "Signalement supprimé")}>Supprimer</Bouton>
        </span>
      </div>
      {erreur && <p role="alert" className="text-sm font-semibold text-tomate">{erreur}</p>}
    </li>
  );
}
