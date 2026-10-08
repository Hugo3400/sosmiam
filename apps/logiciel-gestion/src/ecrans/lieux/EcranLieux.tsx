import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerLieux, type StatutLieu } from "~/services/lieux.ts";
import { FormulaireLieu } from "./FormulaireLieu.tsx";

export const STATUTS_LIEU: Record<StatutLieu, { libelle: string; ton: "vert" | "neutre" | "rouge" }> = {
  publie: { libelle: "En ligne", ton: "vert" },
  brouillon: { libelle: "Brouillon", ton: "neutre" },
  masque: { libelle: "Masqué", ton: "rouge" },
};
const TYPES: Record<string, string> = { resto: "Resto", patisserie: "Pâtisserie", bar: "Bar", sortie: "Sortie" };

/** Les fiches des lieux : liste, recherche, et la fiche complète à créer ou modifier. */
export function EcranLieux() {
  const [statut, setStatut] = useState<StatutLieu | "">("");
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [ouvert, setOuvert] = useState<number | "nouveau" | null>(null);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerLieux(recherche, statut), [recherche, statut]);

  useEffect(() => {
    const minuteur = setTimeout(() => setRecherche(saisie), 300);
    return () => clearTimeout(minuteur);
  }, [saisie]);

  if (ouvert !== null) {
    return <FormulaireLieu id={ouvert === "nouveau" ? null : ouvert} onFermer={() => { setOuvert(null); recharger(); }} />;
  }
  return (
    <>
      <EnTeteEcran
        titre="Lieux"
        sousTitre="Les fiches des restos, pâtisseries, bars et sorties. Seuls les lieux « En ligne » seront montrés dans l'app."
        actions={<Bouton variante="principal" icone={Plus} onClick={() => setOuvert("nouveau")}>Nouveau lieu</Bouton>}
      />
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <Champ libelle={<span className="inline-flex items-center gap-1"><Search className="size-3.5" aria-hidden /> Recherche</span>} valeur={saisie} onChange={setSaisie} placeholder="Nom, ville, quartier…" className="w-72" />
        <Onglets
          libelle="Statut"
          valeur={statut}
          onChange={setStatut}
          options={[{ valeur: "", libelle: "Tous" }, ...Object.entries(STATUTS_LIEU).map(([valeur, { libelle }]) => ({ valeur: valeur as StatutLieu, libelle }))]}
        />
      </div>
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && donnees.length === 0 && (
        <Carte>
          <EtatVide emoji="🏪" titre={recherche || statut ? "Aucun lieu ne correspond" : "Pas encore de lieu"} action={<Bouton variante="principal" icone={Plus} onClick={() => setOuvert("nouveau")}>Créer le premier</Bouton>}>
            Chaque fiche décrit un lieu indépendant : son histoire, son plat signature, ses horaires. Les publications du fil s'y rattachent.
          </EtatVide>
        </Carte>
      )}
      {donnees && donnees.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {donnees.map((lieu) => (
            <li key={lieu.id}>
              <button type="button" onClick={() => setOuvert(lieu.id)} className="flex w-full items-center gap-4 rounded-carte border border-ligne bg-white p-4 text-left transition-colors hover:border-encre">
                <span
                  className="grid size-14 shrink-0 place-items-center rounded-2xl text-2xl"
                  style={{ background: `linear-gradient(135deg, ${lieu.couleurs[0] ?? "#FFD60A"}, ${lieu.couleurs[1] ?? "#FF4D3D"})` }}
                  aria-hidden
                >
                  {lieu.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-titre text-lg font-extrabold">{lieu.nom}</span>
                    <Badge ton={STATUTS_LIEU[lieu.statut].ton}>{STATUTS_LIEU[lieu.statut].libelle}</Badge>
                  </span>
                  <span className="block truncate text-sm text-gris">{TYPES[lieu.type]} · {lieu.info} · {lieu.quartier}, {lieu.ville}</span>
                  <span className="block text-xs text-gris">{lieu._count.publications} publication(s) · modifié {formaterDateRelative(lieu.modifieLe)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
