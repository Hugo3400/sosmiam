import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import type { ModificationLot } from "~/services/lieux.ts";

type Props = { nombre: number; onFermer: () => void; onValider: (modification: ModificationLot) => Promise<void> };

/** Modifier plusieurs fiches d'un coup : seuls les champs remplis changent, le reste de chaque fiche est gardé. */
export function ModaleModifierLieux({ nombre, onFermer, onValider }: Props) {
  const [ville, setVille] = useState("");
  const [quartier, setQuartier] = useState("");
  const [type, setType] = useState<"" | NonNullable<ModificationLot["type"]>>("");
  const [prix, setPrix] = useState<"" | NonNullable<ModificationLot["prix"]>>("");
  const [reservable, setReservable] = useState<"" | "oui" | "non">("");
  const [enCours, setEnCours] = useState(false);
  const modification: ModificationLot = {
    ...(ville.trim() ? { ville: ville.trim() } : {}),
    ...(quartier.trim() ? { quartier: quartier.trim() } : {}),
    ...(type ? { type } : {}),
    ...(prix ? { prix } : {}),
    ...(reservable ? { reservable: reservable === "oui" } : {}),
  };
  const vide = Object.keys(modification).length === 0;

  return (
    <Modale
      titre={`Modifier ${nombre} lieu${nombre > 1 ? "x" : ""}`}
      ouverte
      onFermer={onFermer}
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton
            variante="principal"
            desactive={vide}
            chargement={enCours}
            onClick={() => {
              setEnCours(true);
              void onValider(modification).finally(() => setEnCours(false));
            }}
          >
            Appliquer à {nombre} lieu{nombre > 1 ? "x" : ""}
          </Bouton>
        </>
      }
    >
      <p className="mb-4 text-sm text-gris">Laisse vide ce qui ne doit pas changer.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ libelle="Ville" valeur={ville} maxLength={80} onChange={setVille} placeholder="Ne pas changer" />
        <Champ libelle="Quartier" valeur={quartier} maxLength={60} onChange={setQuartier} placeholder="Ne pas changer" />
        <Selecteur
          libelle="Type"
          valeur={type}
          onChange={setType}
          options={[{ valeur: "", libelle: "Ne pas changer" }, { valeur: "resto", libelle: "Resto" }, { valeur: "patisserie", libelle: "Pâtisserie" }, { valeur: "bar", libelle: "Bar" }, { valeur: "sortie", libelle: "Sortie" }]}
        />
        <Selecteur
          libelle="Prix"
          valeur={prix}
          onChange={setPrix}
          options={[{ valeur: "", libelle: "Ne pas changer" }, { valeur: "€", libelle: "€" }, { valeur: "€€", libelle: "€€" }, { valeur: "€€€", libelle: "€€€" }]}
        />
        <Selecteur
          libelle="Réservable"
          valeur={reservable}
          onChange={setReservable}
          options={[{ valeur: "", libelle: "Ne pas changer" }, { valeur: "oui", libelle: "Oui" }, { valeur: "non", libelle: "Non" }]}
        />
      </div>
    </Modale>
  );
}
