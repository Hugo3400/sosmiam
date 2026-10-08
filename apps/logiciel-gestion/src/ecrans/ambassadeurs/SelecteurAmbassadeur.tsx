import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerAmbassadeurs } from "~/services/ambassadeurs.ts";

type Props = { valeur: number | null; onChange: (compteId: number | null) => void; libelle?: string; avecTous?: boolean };

/** Choix d'un ambassadeur actif (pour une mission ou un message) ; « tous » en option pour les messages. */
export function SelecteurAmbassadeur({ valeur, onChange, libelle = "Ambassadeur", avecTous }: Props) {
  const { donnees } = utiliserChargement(() => listerAmbassadeurs({ statut: "actif", palier: "", recherche: "" }), []);
  const options = [
    avecTous ? { valeur: "", libelle: "Tous les ambassadeurs actifs" } : { valeur: "", libelle: donnees ? "Choisis un ambassadeur" : "Chargement…" },
    ...(donnees?.ambassadeurs ?? [])
      .map((a) => ({ valeur: String(a.id), libelle: `${a.prenom} · ${a.ambassadeur?.ville ?? ""}${a.ambassadeur?.quartier ? ` (${a.ambassadeur.quartier})` : ""}` }))
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
  ];
  return <Selecteur libelle={libelle} valeur={valeur === null ? "" : String(valeur)} options={options} onChange={(v) => onChange(v ? Number(v) : null)} className="w-full min-w-0" />;
}
