import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { TuileChiffre } from "~/composants/interface/TuileChiffre.tsx";
import { filtrerZonesFondateurs, type FiltreZones } from "~/fonctions/fondateurs/filtrer-zones-fondateurs.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerZonesFondateurs } from "~/services/fondateurs.ts";

const FILTRES: { valeur: FiltreZones; libelle: string }[] = [
  { valeur: "toutes", libelle: "Toutes les zones" },
  { valeur: "actives", libelle: "Avec des candidatures" },
  { valeur: "completes", libelle: "Au complet" },
  { valeur: "villes", libelle: "Villes" },
  { valeur: "departements", libelle: "Départements" },
];

/**
 * Les places de fondateur, zone par zone (villes de 50 000 habitants ou plus, et départements pour les autres
 * communes) : prises, libres, candidatures à décider, anciens fondateurs partis (souvenirs) et numéro suivant.
 */
export function ZonesFondateurs({ tour }: { tour: number }) {
  const [filtre, setFiltre] = useState<FiltreZones>("toutes");
  const [recherche, setRecherche] = useState("");
  const { donnees, erreur, chargement, recharger } = utiliserChargement(listerZonesFondateurs, [tour]);
  const zones = donnees ? filtrerZonesFondateurs(donnees.zones, filtre, recherche) : [];
  const totaux = donnees?.totaux;

  return (
    <div className="grid gap-5">
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && totaux && (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <TuileChiffre libelle="Places de fondateur" valeur={totaux.places} detail={`dans ${formaterNombre(donnees.zones.length)} villes et départements`} />
            <TuileChiffre libelle="Fondateurs en place" valeur={totaux.prises} detail={`${formaterNombre(totaux.places - totaux.prises)} places libres`} accent />
            <TuileChiffre libelle="Candidatures à décider" valeur={totaux.enAttente} detail={totaux.sansZone > 0 ? `dont ${formaterNombre(totaux.sansZone)} sans commune` : "toutes rangées dans leur zone"} />
            <TuileChiffre libelle="Prochain numéro national" valeur={`n° ${formaterNombre(totaux.prochainNumeroNational)}`} detail="un numéro n'est jamais redonné" />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Champ libelle="Chercher une zone" valeur={recherche} onChange={setRecherche} placeholder="Lyon, Creuse, 974…" className="w-64" />
            <Selecteur libelle="Afficher" valeur={filtre} onChange={setFiltre} options={FILTRES} className="w-56" />
            <p className="pb-2 text-sm text-gris">{formaterNombre(zones.length)} zone{zones.length > 1 ? "s" : ""}</p>
          </div>
          <Carte titre="Zone par zone" sansMarge>
            {zones.length === 0 ? (
              <EtatVide emoji="📍" titre="Aucune zone ici">Change le filtre ou la recherche.</EtatVide>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-ligne text-left text-gris">
                    <tr>
                      <th className="px-5 py-2 font-semibold">Zone</th>
                      <th className="px-3 py-2 font-semibold">Places prises</th>
                      <th className="chiffres px-3 py-2 text-right font-semibold">À décider</th>
                      <th className="chiffres px-3 py-2 text-right font-semibold">Souvenirs</th>
                      <th className="chiffres px-3 py-2 text-right font-semibold">Prochain n°</th>
                      <th className="chiffres px-5 py-2 text-right font-semibold">Habitants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((zone) => (
                      <tr key={zone.code} className="border-b border-ligne/70 last:border-0">
                        <td className="px-5 py-2.5">
                          <span className="font-semibold">{zone.nom}</span>
                          <span className="ml-2 text-[13px] text-gris">{zone.type === "ville" ? "ville" : "département"} · {zone.codeDepartement}</span>
                          {zone.prises >= zone.places && <span className="ml-2"><Badge ton="encre">Au complet</Badge></span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-ligne" aria-hidden="true">
                              <div className="h-full rounded-full bg-encre" style={{ width: `${Math.min(100, (zone.prises / zone.places) * 100)}%` }} />
                            </div>
                            <span className="chiffres">{zone.prises} / {zone.places}</span>
                          </div>
                        </td>
                        <td className="chiffres px-3 py-2.5 text-right">{zone.enAttente > 0 ? <Badge ton="jaune">{zone.enAttente}</Badge> : "—"}</td>
                        <td className="chiffres px-3 py-2.5 text-right">{zone.souvenirs || "—"}</td>
                        <td className="chiffres px-3 py-2.5 text-right">n° {zone.prochainNumero}</td>
                        <td className="chiffres px-5 py-2.5 text-right text-gris">{formaterNombre(zone.population)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Carte>
        </>
      )}
    </div>
  );
}
