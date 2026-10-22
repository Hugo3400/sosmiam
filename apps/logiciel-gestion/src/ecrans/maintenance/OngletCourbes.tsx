import { useState, type ReactNode } from "react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { GraphiqueLigne, type PointLigne } from "~/composants/interface/GraphiqueLigne.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { calculerGraduations } from "~/fonctions/graphiques/calculer-graduations.ts";
import { formaterPourcentage } from "~/fonctions/maintenance/formater-pourcentage.ts";
import { nommerMomentCourbe } from "~/fonctions/maintenance/nommer-moment-courbe.ts";
import { resumerCourbe } from "~/fonctions/maintenance/resumer-courbe.ts";
import { formaterDebit } from "~/fonctions/texte/formater-debit.ts";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ID_MACHINE_PRINCIPALE, lireCourbesMachine, type CourbesMachine, type PeriodeCourbes, type PointMachine } from "~/services/machines.ts";

const PERIODES: { valeur: PeriodeCourbes; libelle: string }[] = [
  { valeur: "1h", libelle: "1 h" },
  { valeur: "24h", libelle: "24 h" },
  { valeur: "7j", libelle: "7 j" },
  { valeur: "30j", libelle: "30 j" },
];
const GO = 1024 ** 3;
const KO = 1024;

function preparer(courbes: CourbesMachine, lire: (point: PointMachine) => number | null, diviseur = 1): PointLigne[] {
  return courbes.points.map((point) => {
    const valeur = lire(point);
    return {
      cle: point.le,
      valeur: valeur === null ? null : valeur / diviseur,
      libelle: nommerMomentCourbe(point.le, courbes.periode),
      libelleLong: nommerMomentCourbe(point.le, courbes.periode, true),
    };
  });
}

function Resume({ points, formater, sans }: { points: PointLigne[]; formater: (valeur: number) => string; sans?: boolean }) {
  const resume = resumerCourbe(points.map((point) => point.valeur));
  if (!resume) return null;
  return (
    <p className="chiffres flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-gris">
      <span>Moyenne <b className="text-encre">{formater(resume.moyenne)}</b></span>
      <span>Pointe <b className="text-encre">{formater(resume.pointe)}</b></span>
      {!sans && <span>Maintenant <b className="text-encre">{formater(resume.dernier)}</b></span>}
    </p>
  );
}

function Bloc({ titre, aide, children }: { titre: string; aide: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-sm">{titre}</b><span className="text-[12.5px] text-gris">{aide}</span></p>
      {children}
    </div>
  );
}

export function OngletCourbes({ tour }: { tour: number }) {
  const [periode, setPeriode] = useState<PeriodeCourbes>("24h");
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => lireCourbesMachine(ID_MACHINE_PRINCIPALE, periode), [periode, tour]);

  const contenu = () => {
    if (!donnees && chargement) return <Chargement />;
    if (!donnees) return <MessageErreur erreur={erreur} reessayer={recharger} />;
    if (donnees.points.length < 2) {
      return <EtatVide emoji="📈" titre="Les courbes se remplissent">Une mesure par minute : reviens dans quelques minutes pour voir les premières courbes.</EtatVide>;
    }
    const processeur = preparer(donnees, (point) => point.processeur);
    const memoireTotale = (donnees.memoireTotale ?? GO) / GO;
    const memoire = preparer(donnees, (point) => point.memoire, GO);
    const disqueTotal = (donnees.disqueTotal ?? GO) / GO;
    const disque = preparer(donnees, (point) => point.disque, GO);
    const recu = preparer(donnees, (point) => point.recu, KO);
    const envoye = preparer(donnees, (point) => point.envoye, KO);
    const grilleReseau = calculerGraduations(Math.max(1, ...[...recu, ...envoye].map((point) => point.valeur ?? 0)), 2);
    const plafondReseau = grilleReseau[grilleReseau.length - 1] ?? 1;
    const enGo = (valeur: number) => formaterOctets(valeur * GO);
    const enKo = (valeur: number) => formaterDebit(valeur * KO);
    return (
      <div className="grid gap-x-7 gap-y-6 xl:grid-cols-2">
        <Bloc titre="Processeur" aide={`en % des ${donnees.coeurs ?? "?"} cœurs`}>
          <GraphiqueLigne points={processeur} plafond={100} graduations={[0, 25, 50, 75, 100]} formaterGraduation={(v) => `${v} %`} formaterValeur={formaterPourcentage} mesure="Processeur" />
          <Resume points={processeur} formater={formaterPourcentage} />
        </Bloc>
        <Bloc titre="Mémoire utilisée" aide={`le haut du graphique = ${formaterOctets(memoireTotale * GO)}`}>
          <GraphiqueLigne points={memoire} plafond={memoireTotale} graduations={calculerGraduations(memoireTotale).filter((v) => v <= memoireTotale)} formaterGraduation={(v) => `${v} Go`} formaterValeur={enGo} mesure="Mémoire" />
          <Resume points={memoire} formater={enGo} />
        </Bloc>
        <Bloc titre="Réseau" aide="reçu en haut, envoyé en bas">
          <GraphiqueLigne points={recu} plafond={plafondReseau} graduations={grilleReseau} formaterGraduation={(v) => `${v} Ko/s`} formaterValeur={enKo} mesure="Reçu" hauteur={100} sansAxe />
          <GraphiqueLigne points={envoye} plafond={plafondReseau} graduations={grilleReseau} formaterGraduation={(v) => `${v} Ko/s`} formaterValeur={enKo} mesure="Envoyé" hauteur={118} />
          <Resume points={envoye} formater={enKo} sans />
        </Bloc>
        <Bloc titre="Espace disque utilisé" aide={`le haut du graphique = ${formaterOctets(disqueTotal * GO)}`}>
          <GraphiqueLigne points={disque} plafond={disqueTotal} graduations={calculerGraduations(disqueTotal).filter((v) => v <= disqueTotal)} formaterGraduation={(v) => `${v} Go`} formaterValeur={enGo} mesure="Disque" />
          <Resume points={disque} formater={enGo} />
        </Bloc>
      </div>
    );
  };

  return (
    <Carte titre="Historique" actions={<Onglets libelle="Période affichée" valeur={periode} options={PERIODES} onChange={setPeriode} />}>
      {contenu()}
    </Carte>
  );
}
