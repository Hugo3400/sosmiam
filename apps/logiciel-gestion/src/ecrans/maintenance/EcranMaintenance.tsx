import { Activity, Database, Globe, RotateCw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { ONGLETS_MAINTENANCE, type OngletMaintenance } from "~/contenus/onglets-maintenance.ts";
import { trouverProblemes } from "~/fonctions/maintenance/trouver-problemes.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireEtatServeur, type EtatServeur } from "~/services/maintenance.ts";
import { CarteMenageManuel } from "./CarteMenageManuel.tsx";
import { CarteSauvegardes } from "./CarteSauvegardes.tsx";
import { CarteTestSauvegarde } from "./CarteTestSauvegarde.tsx";
import { JournalGestion } from "./JournalGestion.tsx";
import { OngletAlertes } from "./OngletAlertes.tsx";
import { OngletBase } from "./OngletBase.tsx";
import { OngletCourbes } from "./OngletCourbes.tsx";
import { OngletJournaux } from "./OngletJournaux.tsx";
import { OngletMachines } from "./OngletMachines.tsx";
import { OngletPm2 } from "./OngletPm2.tsx";
import { OngletSysteme } from "./OngletSysteme.tsx";

function Etat({ icone, titre, bon, children }: { icone: ReactNode; titre: string; bon: boolean; children: ReactNode }) {
  return (
    <div className="grid content-start gap-1 rounded-carte border border-ligne bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-gris">{icone} {titre}</p>
      <p className="flex items-center gap-2 font-titre text-xl font-extrabold">
        <span className={`size-2.5 rounded-full ${bon ? "bg-vert" : "bg-tomate"}`} aria-hidden />
        {bon ? "En forme" : "Problème"}
      </p>
      <div className="text-[13px] text-gris">{children}</div>
    </div>
  );
}

export function EcranMaintenance({ surEtat }: { surEtat: (etat: EtatServeur) => void }) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireEtatServeur, []);
  const [onglet, setOnglet] = useState<OngletMaintenance>("machines");
  const [tour, setTour] = useState(0);
  useEffect(() => {
    if (donnees) surEtat(donnees);
  }, [donnees, surEtat]);
  useEffect(() => {
    const minuteur = setInterval(recharger, 60_000);
    return () => clearInterval(minuteur);
  }, [recharger]);

  const problemes = donnees ? trouverProblemes(donnees) : [];
  const actualiser = () => {
    recharger();
    setTour((avant) => avant + 1);
  };
  return (
    <>
      <EnTeteEcran
        titre="Maintenance"
        sousTitre="L'état du serveur de SOS Miam, ses programmes, ses journaux, et tout ce qui a été fait depuis ce logiciel."
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={actualiser}>Actualiser</Bouton>}
      />
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && (
        <div className="grid gap-5">
          {problemes.length > 0 && (
            <ul role="alert" className="grid gap-1 rounded-carte border-2 border-encre bg-jaune-clair px-5 py-3 text-sm font-semibold">
              {problemes.map((probleme) => <li key={probleme}>⚠️ {probleme}</li>)}
            </ul>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <Etat icone={<Activity className="size-4" aria-hidden />} titre="API" bon>
              Lancée {formaterDateRelative(donnees.api.depuis)} · {formaterOctets(donnees.api.memoire)} · Node {donnees.api.node}
            </Etat>
            <Etat icone={<Database className="size-4" aria-hidden />} titre="Base de données" bon={donnees.base.enLigne}>
              {donnees.base.enLigne ? `Répond en ${donnees.base.delai} ms · ${formaterOctets(donnees.base.octets)}` : "Ne répond pas"}
            </Etat>
            <Etat icone={<Globe className="size-4" aria-hidden />} titre="Site" bon={donnees.site.enLigne}>
              {donnees.site.enLigne ? `Répond en ${donnees.site.delai} ms` : `Ne répond pas${donnees.site.statut ? ` (erreur ${donnees.site.statut})` : ""}`}
            </Etat>
          </div>
          <Onglets
            libelle="Parties de la maintenance"
            valeur={onglet}
            options={ONGLETS_MAINTENANCE.map((option) => (option.valeur === "alertes" ? { ...option, compteur: problemes.length } : option))}
            onChange={setOnglet}
          />
          {onglet === "machines" && <OngletMachines tour={tour} allerA={setOnglet} />}
          {onglet === "courbes" && <OngletCourbes tour={tour} />}
          {onglet === "systeme" && <OngletSysteme tour={tour} />}
          {onglet === "pm2" && <OngletPm2 tour={tour} />}
          {onglet === "journaux" && <OngletJournaux tour={tour} />}
          {onglet === "sauvegardes" && (
            <div className="grid gap-5">
              <CarteSauvegardes apresSauvegarde={recharger} />
              <CarteTestSauvegarde />
              <CarteMenageManuel />
            </div>
          )}
          {onglet === "base" && <OngletBase base={donnees.base} />}
          {onglet === "alertes" && <OngletAlertes problemes={problemes} />}
          {onglet === "historique" && <JournalGestion />}
        </div>
      )}
    </>
  );
}
