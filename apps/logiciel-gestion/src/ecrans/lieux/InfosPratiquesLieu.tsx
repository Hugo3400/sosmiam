import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { LIBELLES_CHAMPS_LIEU, VALEURS_INFOS_PRATIQUES } from "~/contenus/champs-lieu.ts";
import type { InfosPratiquesLieu as Infos, SaisieLieu } from "~/services/lieux.ts";

type Props = { lieu: SaisieLieu; changer: (modif: Partial<SaisieLieu>) => void };

const OUI_NON = ["accessible", "terrasse", "wifi", "enfants", "parking"] as const;
const PAS_RENSEIGNE = { valeur: "", libelle: "Pas renseigné" };
const versOuiNon = (valeur: boolean | null) => (valeur === null ? "" : valeur ? "oui" : "non");
const options = (champ: "animaux" | "reservation") => [PAS_RENSEIGNE, ...Object.entries(VALEURS_INFOS_PRATIQUES[champ] ?? {}).map(([valeur, libelle]) => ({ valeur, libelle }))];

/**
 * Les infos pratiques d'une fiche (animaux, accès en fauteuil, équipements, paiements, réservation). Toutes
 * facultatives : « Pas renseigné » n'est jamais affiché dans l'app, on ne devine pas à la place du lieu.
 */
export function InfosPratiquesLieu({ lieu, changer }: Props) {
  return (
    <>
      <Selecteur libelle={LIBELLES_CHAMPS_LIEU.animaux} valeur={lieu.animaux ?? ""} options={options("animaux")} onChange={(valeur) => changer({ animaux: (valeur || null) as Infos["animaux"] })} />
      <Selecteur libelle={LIBELLES_CHAMPS_LIEU.reservation} valeur={lieu.reservation ?? ""} options={options("reservation")} onChange={(valeur) => changer({ reservation: (valeur || null) as Infos["reservation"] })} />
      {OUI_NON.map((champ) => (
        <Selecteur
          key={champ}
          libelle={LIBELLES_CHAMPS_LIEU[champ]}
          valeur={versOuiNon(lieu[champ])}
          options={[PAS_RENSEIGNE, { valeur: "oui", libelle: "Oui" }, { valeur: "non", libelle: "Non" }]}
          onChange={(valeur) => changer({ [champ]: valeur === "" ? null : valeur === "oui" })}
        />
      ))}
      <fieldset className="md:col-span-2">
        <legend className="mb-2 text-sm font-semibold">{LIBELLES_CHAMPS_LIEU.paiements}</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(VALEURS_INFOS_PRATIQUES.paiements ?? {}).map(([valeur, libelle]) => (
            <CaseACocher
              key={valeur}
              libelle={libelle}
              coche={lieu.paiements.includes(valeur)}
              onChange={(coche) => changer({ paiements: coche ? [...lieu.paiements, valeur] : lieu.paiements.filter((p) => p !== valeur) })}
            />
          ))}
        </div>
      </fieldset>
    </>
  );
}
