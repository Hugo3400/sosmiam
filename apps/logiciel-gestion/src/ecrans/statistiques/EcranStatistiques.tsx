import { ChevronLeft, ChevronRight, Download, RotateCw } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { GraphiqueColonnes } from "~/composants/interface/GraphiqueColonnes.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { dateVersSemaine } from "~/fonctions/dates/date-vers-semaine.ts";
import { semaineVersDimanche } from "~/fonctions/dates/semaine-vers-dimanche.ts";
import { creerCsvStatistiques } from "~/fonctions/statistiques/creer-csv-statistiques.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { nommerPeriode } from "~/fonctions/texte/nommer-periode.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireStatistiques, type Echelle, type SourceStatistiques } from "~/services/statistiques.ts";
import { enregistrerFichier } from "~/services/systeme.ts";
import { CarteEnDirect } from "./CarteEnDirect.tsx";
import { CarteJoursHeures } from "./CarteJoursHeures.tsx";
import { GrilleClassements, GROUPES_CLASSEMENTS } from "./GrilleClassements.tsx";
import { StatistiquesCommunaute } from "./StatistiquesCommunaute.tsx";
import { TuilesStatistiques } from "./TuilesStatistiques.tsx";

type Mesure = "visiteurs" | "visites" | "vues" | "inscriptions";

type Choix = "7j" | "30j" | "12s" | "12m" | "annees" | "semaine";
const CHOIX: { valeur: Choix; libelle: string; echelle: Echelle; nombre: number; enCours: string; precedente: string }[] = [
  { valeur: "7j", libelle: "7 jours", echelle: "jour", nombre: 7, enCours: "aujourd'hui", precedente: "par rapport à hier" },
  { valeur: "30j", libelle: "30 jours", echelle: "jour", nombre: 30, enCours: "aujourd'hui", precedente: "par rapport à hier" },
  { valeur: "12s", libelle: "12 semaines", echelle: "semaine", nombre: 12, enCours: "cette semaine", precedente: "par rapport à la semaine dernière" },
  { valeur: "12m", libelle: "12 mois", echelle: "mois", nombre: 12, enCours: "ce mois-ci", precedente: "par rapport au mois dernier" },
  { valeur: "annees", libelle: "Années", echelle: "annee", nombre: 5, enCours: "cette année", precedente: "par rapport à l'an dernier" },
  // Une semaine précise : ses totaux et classements, et ses 7 jours sur le graphique
  { valeur: "semaine", libelle: "Une semaine…", echelle: "semaine", nombre: 1, enCours: "cette semaine-là", precedente: "par rapport à la semaine d'avant" },
];
const MESURES: { valeur: Mesure; libelle: string }[] = [
  { valeur: "visiteurs", libelle: "Visiteurs" },
  { valeur: "visites", libelle: "Visites" },
  { valeur: "vues", libelle: "Pages vues" },
  { valeur: "inscriptions", libelle: "Inscriptions" },
];
const NOMS_DIMENSIONS = Object.fromEntries(GROUPES_CLASSEMENTS.flatMap((g) => g.classements.map((c) => [c.dimension, c.titre])));

/** Statistiques de visite du site (et, plus tard, de l'app) : par jour, semaine, mois ou année. */
export function EcranStatistiques() {
  const [vue, setVue] = useState<SourceStatistiques | "communaute">("site");
  const source: SourceStatistiques = vue === "app" ? "app" : "site";
  const [choix, setChoix] = useState<Choix>("30j");
  const [semaine, setSemaine] = useState(() => dateVersSemaine(new Date()));
  const [mesure, setMesure] = useState<Mesure>("visiteurs");
  const [comparer, setComparer] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const reglage = CHOIX.find((c) => c.valeur === choix) ?? CHOIX[1]!;
  const { echelle } = reglage;
  const uneSemaine = choix === "semaine";
  const jusqua = uneSemaine ? (semaineVersDimanche(semaine) ?? undefined) : undefined;
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => lireStatistiques(source, echelle, reglage.nombre, jusqua), [source, choix, jusqua]);
  // Une semaine précise : ses 7 jours pour le graphique (comparés aux 7 jours de la semaine d'avant)
  const jours = utiliserChargement(() => (uneSemaine ? lireStatistiques(source, "jour", 7, jusqua) : Promise.resolve(null)), [source, uneSemaine, jusqua]);
  const decalerSemaine = (semaines: number) => {
    const dimanche = semaineVersDimanche(semaine);
    if (dimanche) setSemaine(dateVersSemaine(new Date(new Date(`${dimanche}T12:00:00`).getTime() + semaines * 7 * 86_400_000)));
  };
  const periodes = donnees?.periodes ?? [];
  const graphe = uneSemaine ? jours.donnees : donnees;
  const periodesGraphe = graphe?.periodes ?? [];
  const actuelle = periodes[periodes.length - 1];
  const precedente = uneSemaine ? donnees?.precedentes[0] : periodes[periodes.length - 2];
  const libelleMesure = MESURES.find((m) => m.valeur === mesure)?.libelle ?? "";
  const valeur = (index: number, avant = false) => {
    const liste = avant ? graphe?.precedentes : periodesGraphe;
    if (mesure === "inscriptions") return avant ? 0 : (graphe?.conversions[index]?.inscriptions ?? 0);
    return liste?.[index]?.[mesure] ?? 0;
  };

  async function exporter() {
    if (!donnees) return;
    const nom = `statistiques-sos-miam-${source}-${echelle}-${new Date().toISOString().slice(0, 10)}.csv`;
    if (await enregistrerFichier(nom, creerCsvStatistiques(donnees, NOMS_DIMENSIONS))) setMessage("Statistiques exportées ✅");
  }

  return (
    <>
      <EnTeteEcran
        titre="Statistiques"
        sousTitre="Comptées par le serveur, sans cookie : seulement des totaux, jamais d'adresse IP. Les navigateurs qui demandent à ne pas être suivis ne sont pas comptés."
        actions={
          <>
            <Bouton icone={Download} desactive={!donnees} onClick={exporter}>Exporter en CSV</Bouton>
            <Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>
          </>
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Onglets libelle="Source" valeur={vue} onChange={setVue} options={[{ valeur: "site", libelle: "Site web" }, { valeur: "app", libelle: "App" }, { valeur: "communaute", libelle: "Communauté" }]} />
        {vue !== "communaute" && <Onglets libelle="Période" valeur={choix} onChange={setChoix} options={CHOIX.map(({ valeur, libelle }) => ({ valeur, libelle }))} />}
        {vue !== "communaute" && uneSemaine && (
          <div className="flex items-center gap-1">
            <Bouton petit variante="discret" icone={ChevronLeft} titre="Semaine précédente" onClick={() => decalerSemaine(-1)} />
            <label className="sr-only" htmlFor="semaine-choisie">Semaine</label>
            <input
              id="semaine-choisie"
              type="week"
              value={semaine}
              max={dateVersSemaine(new Date())}
              onChange={(e) => e.target.value && setSemaine(e.target.value)}
              className="h-9 rounded-xl border border-ligne bg-white px-2 text-sm"
            />
            <Bouton petit variante="discret" icone={ChevronRight} titre="Semaine suivante" desactive={semaine >= dateVersSemaine(new Date())} onClick={() => decalerSemaine(1)} />
          </div>
        )}
        {vue !== "communaute" && <CaseACocher libelle="Comparer à la période d'avant" coche={comparer} onChange={setComparer} />}
      </div>
      {message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{message}</p>}
      {vue === "communaute" ? (
        <StatistiquesCommunaute />
      ) : (
        <>
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
          <div className="grid gap-6">
            <TuilesStatistiques
              actuelle={actuelle}
              precedente={precedente}
              conversions={donnees.conversions[donnees.conversions.length - 1]}
              enCours={reglage.enCours}
              reference={reglage.precedente}
            />
            <Carte titre={libelleMesure} actions={<Onglets libelle="Mesure du graphique" valeur={mesure} onChange={setMesure} options={MESURES} />}>
              <GraphiqueColonnes
                mesure={libelleMesure}
                comparer={comparer && mesure !== "inscriptions"}
                points={periodesGraphe.map((periode, i) => ({
                  cle: periode.cle,
                  libelle: nommerPeriode(periode.cle),
                  libelleLong: nommerPeriode(periode.cle, true),
                  valeur: valeur(i),
                  avant: valeur(i, true),
                  libelleAvant: graphe?.precedentes[i] ? nommerPeriode(graphe.precedentes[i]!.cle, true) : undefined,
                  details: MESURES.filter((m) => m.valeur !== mesure && m.valeur !== "inscriptions")
                    .map((m) => `${formaterNombre(periode[m.valeur as "visiteurs" | "visites" | "vues"])} ${m.libelle.toLowerCase()}`),
                  enCours: i === periodesGraphe.length - 1 && !uneSemaine,
                }))}
              />
              <p className="mt-3 text-[13px] text-gris">
                Un visiteur est compté une fois par période : la même personne revenue deux jours de suite compte pour 2 dans les jours,
                pour 1 dans la semaine. Au-delà de quelques centaines, les visiteurs sont estimés (à 2 % près).
              </p>
            </Carte>
            {source === "site" && (
              <div className={`grid gap-5 ${uneSemaine ? "" : "xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"}`}>
                {!uneSemaine && <CarteEnDirect />}
                <CarteJoursHeures creneaux={donnees.details.creneau ?? []} />
              </div>
            )}
            <GrilleClassements details={donnees.details} />
          </div>
        ) : null}
        </>
      )}
    </>
  );
}
