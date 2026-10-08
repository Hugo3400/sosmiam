import { RotateCw } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { GraphiqueColonnes } from "~/composants/interface/GraphiqueColonnes.tsx";
import { ListeClassement } from "~/composants/interface/ListeClassement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { TuileChiffre } from "~/composants/interface/TuileChiffre.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { nommerPays } from "~/fonctions/texte/nommer-pays.ts";
import { nommerPeriode } from "~/fonctions/texte/nommer-periode.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireStatistiques, type Dimension, type Echelle, type SourceStatistiques } from "~/services/statistiques.ts";

type Mesure = "visiteurs" | "visites" | "vues";

const ECHELLES: { valeur: Echelle; libelle: string; nombre: number; enCours: string; precedente: string }[] = [
  { valeur: "jour", libelle: "30 jours", nombre: 30, enCours: "aujourd'hui", precedente: "par rapport à hier" },
  { valeur: "semaine", libelle: "12 semaines", nombre: 12, enCours: "cette semaine", precedente: "par rapport à la semaine dernière" },
  { valeur: "mois", libelle: "12 mois", nombre: 12, enCours: "ce mois-ci", precedente: "par rapport au mois dernier" },
  { valeur: "annee", libelle: "Années", nombre: 5, enCours: "cette année", precedente: "par rapport à l'an dernier" },
];
const MESURES: { valeur: Mesure; libelle: string }[] = [
  { valeur: "visiteurs", libelle: "Visiteurs" },
  { valeur: "visites", libelle: "Visites" },
  { valeur: "vues", libelle: "Pages vues" },
];
const CLASSEMENTS: { dimension: Dimension; titre: string; unite: string; nommer?: (valeur: string) => string }[] = [
  { dimension: "page", titre: "Pages les plus vues", unite: "pages vues" },
  { dimension: "provenance", titre: "D'où viennent les visites", unite: "visites" },
  { dimension: "appareil", titre: "Appareils", unite: "visites" },
  { dimension: "navigateur", titre: "Navigateurs", unite: "visites" },
  { dimension: "systeme", titre: "Systèmes", unite: "visites" },
  { dimension: "pays", titre: "Pays", unite: "visites", nommer: nommerPays },
];

const ecart = (actuel: number, avant: number | undefined) => (!avant ? null : ((actuel - avant) / avant) * 100);

/** Statistiques de visite du site (et, plus tard, de l'app) : par jour, semaine, mois ou année. */
export function EcranStatistiques() {
  const [source, setSource] = useState<SourceStatistiques>("site");
  const [echelle, setEchelle] = useState<Echelle>("jour");
  const [mesure, setMesure] = useState<Mesure>("visiteurs");
  const reglage = ECHELLES.find((e) => e.valeur === echelle) ?? ECHELLES[0]!;
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => lireStatistiques(source, echelle, reglage.nombre), [source, echelle]);
  const periodes = donnees?.periodes ?? [];
  const actuelle = periodes[periodes.length - 1];
  const precedente = periodes[periodes.length - 2];
  const libelleMesure = MESURES.find((m) => m.valeur === mesure)?.libelle ?? "";

  return (
    <>
      <EnTeteEcran
        titre="Statistiques"
        sousTitre="Comptées par le serveur, sans cookie : seulement des totaux, jamais d'adresse IP. Les navigateurs qui demandent à ne pas être suivis ne sont pas comptés."
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>}
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Onglets libelle="Source" valeur={source} onChange={setSource} options={[{ valeur: "site", libelle: "Site web" }, { valeur: "app", libelle: "App" }]} />
        <Onglets libelle="Période" valeur={echelle} onChange={setEchelle} options={ECHELLES.map(({ valeur, libelle }) => ({ valeur, libelle }))} />
      </div>
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {source === "app" && periodes.every((p) => p.vues === 0) && !chargement ? (
        <Carte>
          <EtatVide emoji="📱" titre="L'app n'envoie pas encore de statistiques">
            Elles arriveront ici avec la sortie de l'app : ouvertures, écrans vus, rescousses, scans… comptés de la même façon, sans pistage.
          </EtatVide>
        </Carte>
      ) : !donnees && chargement ? (
        <Chargement />
      ) : donnees && actuelle ? (
        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <TuileChiffre libelle={`Visiteurs ${reglage.enCours}`} valeur={actuelle.visiteurs} ecart={{ pourcentage: ecart(actuelle.visiteurs, precedente?.visiteurs), reference: reglage.precedente }} accent />
            <TuileChiffre libelle={`Visites ${reglage.enCours}`} valeur={actuelle.visites} ecart={{ pourcentage: ecart(actuelle.visites, precedente?.visites), reference: reglage.precedente }} />
            <TuileChiffre libelle={`Pages vues ${reglage.enCours}`} valeur={actuelle.vues} ecart={{ pourcentage: ecart(actuelle.vues, precedente?.vues), reference: reglage.precedente }} />
            <TuileChiffre
              libelle="Pages par visite"
              valeur={actuelle.visites ? (actuelle.vues / actuelle.visites).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "—"}
              detail="Période en cours : elle n'est pas finie, la comparaison est donc provisoire."
            />
          </div>
          <Carte titre={libelleMesure} actions={<Onglets libelle="Mesure du graphique" valeur={mesure} onChange={setMesure} options={MESURES} />}>
            <GraphiqueColonnes
              mesure={libelleMesure}
              points={periodes.map((periode, i) => ({
                cle: periode.cle,
                libelle: nommerPeriode(periode.cle),
                libelleLong: nommerPeriode(periode.cle, true),
                valeur: periode[mesure],
                details: MESURES.filter((m) => m.valeur !== mesure).map((m) => `${formaterNombre(periode[m.valeur])} ${m.libelle.toLowerCase()}`),
                enCours: i === periodes.length - 1,
              }))}
            />
            <p className="mt-3 text-[13px] text-gris">
              Un visiteur est compté une fois par période : la même personne revenue deux jours de suite compte pour 2 dans les jours,
              pour 1 dans la semaine. Au-delà de quelques centaines, les visiteurs sont estimés (à 2 % près).
            </p>
          </Carte>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {CLASSEMENTS.map(({ dimension, titre, unite, nommer }) => (
              <Carte key={dimension} titre={titre}>
                <p className="-mt-1 mb-3 text-[13px] text-gris">En {unite}, sur les {reglage.libelle.toLowerCase()} affichés</p>
                <ListeClassement elements={donnees.details[dimension] ?? []} nommer={nommer} vide="Pas encore de visite sur cette période." />
              </Carte>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
