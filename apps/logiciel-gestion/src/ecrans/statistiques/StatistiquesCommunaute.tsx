import { useState } from "react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { GraphiqueColonnes } from "~/composants/interface/GraphiqueColonnes.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { TuileChiffre } from "~/composants/interface/TuileChiffre.tsx";
import { nommerPeriode } from "~/fonctions/texte/nommer-periode.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireStatistiquesCommunaute, type MesureCommunaute } from "~/services/statistiques.ts";

const MESURES: { valeur: MesureCommunaute; libelle: string }[] = [
  { valeur: "comptes", libelle: "Comptes créés" },
  { valeur: "ambassadeurs", libelle: "Ambassadeurs validés" },
  { valeur: "lieuxProposes", libelle: "Lieux proposés" },
  { valeur: "missions", libelle: "Missions faites" },
  { valeur: "bigSos", libelle: "BIG SOS à la une" },
  { valeur: "mails", libelle: "Mails envoyés" },
  { valeur: "notifications", libelle: "Notifications reçues" },
];

/** La communauté semaine par semaine : comptes, ambassadeurs, pépites proposées, missions, BIG SOS, mails et notifications. */
export function StatistiquesCommunaute() {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireStatistiquesCommunaute, []);
  const [mesure, setMesure] = useState<MesureCommunaute>("comptes");
  const libelle = MESURES.find((m) => m.valeur === mesure)?.libelle ?? "";
  if (!donnees) return chargement ? <Chargement /> : <MessageErreur erreur={erreur} reessayer={recharger} />;
  const { totaux, semaines } = donnees;
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <TuileChiffre libelle="Comptes" valeur={totaux.comptes} accent />
        <TuileChiffre libelle="Ambassadeurs actifs" valeur={totaux.ambassadeursActifs} />
        <TuileChiffre libelle="Missions faites" valeur={totaux.missionsFaites} />
        <TuileChiffre libelle="BIG SOS à la une" valeur={totaux.bigSos} detail="depuis le début" />
        <TuileChiffre libelle="Téléphones inscrits" valeur={totaux.telephones} detail="aux notifications" />
      </div>
      <Carte titre={`${libelle}, 12 dernières semaines`} actions={<Onglets libelle="Mesure" valeur={mesure} onChange={setMesure} options={MESURES} />}>
        <GraphiqueColonnes
          mesure={libelle}
          points={semaines.map((semaine, i) => ({
            cle: semaine.cle,
            libelle: nommerPeriode(semaine.cle),
            libelleLong: nommerPeriode(semaine.cle, true),
            valeur: semaine[mesure],
            enCours: i === semaines.length - 1,
          }))}
        />
        <p className="mt-3 text-[13px] text-gris">Les mails ne sont gardés que 90 jours dans le journal : les plus anciennes semaines peuvent en montrer moins qu'en réalité.</p>
      </Carte>
    </div>
  );
}
