import { useState } from "react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { GraphiqueColonnes } from "~/composants/interface/GraphiqueColonnes.tsx";
import { ListeClassement } from "~/composants/interface/ListeClassement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { TuileChiffre } from "~/composants/interface/TuileChiffre.tsx";
import { nommerPeriode } from "~/fonctions/texte/nommer-periode.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireActiviteApp, type MesureActiviteApp } from "~/services/statistiques.ts";

const MESURES: { valeur: MesureActiviteApp; libelle: string }[] = [
  { valeur: "visites", libelle: "Visites validées" },
  { valeur: "rescousses", libelle: "Rescousses" },
  { valeur: "avis", libelle: "Avis publiés" },
  { valeur: "reservations", libelle: "Réservations" },
  { valeur: "sorties", libelle: "Sorties créées" },
  { valeur: "messages", libelle: "Messages envoyés" },
  { valeur: "commentaires", libelle: "Commentaires" },
];

/** Ce qui se passe dans l'app, semaine par semaine, tiré de la base : des nombres seulement (un message est compté, jamais lu). */
export function StatistiquesActiviteApp() {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireActiviteApp, []);
  const [mesure, setMesure] = useState<MesureActiviteApp>("visites");
  const libelle = MESURES.find((m) => m.valeur === mesure)?.libelle ?? "";
  if (!donnees) return chargement ? <Chargement /> : <MessageErreur erreur={erreur} reessayer={recharger} />;
  const { totaux, semaines, villes } = donnees;
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <TuileChiffre libelle="Actifs cette semaine" valeur={totaux.actifsSemaine} detail="connectés à l'app depuis 7 jours" accent />
        <TuileChiffre libelle="Comptes vus sur l'app" valeur={totaux.surApp} detail="depuis le début" />
        <TuileChiffre libelle="Visites validées" valeur={totaux.visites} detail="depuis le début" />
        <TuileChiffre libelle="Rescousses" valeur={totaux.rescousses} detail="depuis le début" />
        <TuileChiffre libelle="Avis publiés" valeur={totaux.avis} detail="depuis le début" />
      </div>
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <Carte titre={`${libelle}, 12 dernières semaines`}>
          <div className="mb-4">
            <Onglets libelle="Mesure" valeur={mesure} onChange={setMesure} options={MESURES} />
          </div>
          <GraphiqueColonnes
            mesure={libelle}
            points={semaines.map((semaine, i) => ({
              cle: semaine.cle, libelle: nommerPeriode(semaine.cle), libelleLong: nommerPeriode(semaine.cle, true), valeur: semaine[mesure], enCours: i === semaines.length - 1,
            }))}
          />
        </Carte>
        <Carte titre="Villes où l'on valide le plus">
          <ListeClassement
            elements={villes.map((v) => ({ valeur: v.ville, nombre: v.visites }))}
            vide="Pas encore de visite validée sur les 12 dernières semaines."
            maximum={10}
          />
        </Carte>
      </div>
    </div>
  );
}
