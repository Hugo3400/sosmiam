import { useEffect, useState } from "react";

import { BandeauMiseAJour } from "~/composants/mise-en-page/BandeauMiseAJour.tsx";
import { BandeauNouveautes } from "~/composants/mise-en-page/BandeauNouveautes.tsx";
import { BandeauPosteDePassage } from "~/composants/mise-en-page/BandeauPosteDePassage.tsx";
import { FiletDeSecurite } from "~/composants/interface/FiletDeSecurite.tsx";
import { BarreLaterale } from "~/composants/mise-en-page/BarreLaterale.tsx";
import type { Ecran } from "~/contenus/menu.ts";
import { EcranAmbassadeurs } from "~/ecrans/ambassadeurs/EcranAmbassadeurs.tsx";
import { EcranDefis } from "~/ecrans/defis/EcranDefis.tsx";
import { EcranPresse } from "~/ecrans/presse/EcranPresse.tsx";
import { EcranEvenements } from "~/ecrans/evenements/EcranEvenements.tsx";
import { EcranReservations } from "~/ecrans/reservations/EcranReservations.tsx";
import { EcranAvis } from "~/ecrans/avis/EcranAvis.tsx";
import { EcranPopUps } from "~/ecrans/pop-ups/EcranPopUps.tsx";
import { EcranCommunaute } from "~/ecrans/communaute/EcranCommunaute.tsx";
import { EcranCarriere } from "~/ecrans/carriere/EcranCarriere.tsx";
import { EcranChasseAuxBugs } from "~/ecrans/securite/EcranChasseAuxBugs.tsx";
import { EcranVersionsApp } from "~/ecrans/versions-app/EcranVersionsApp.tsx";
import { EcranPostes } from "~/ecrans/postes/EcranPostes.tsx";
import { EcranActus } from "~/ecrans/actus/EcranActus.tsx";
import { EcranAnnonces } from "~/ecrans/annonces/EcranAnnonces.tsx";
import { EcranBigSos } from "~/ecrans/big-sos/EcranBigSos.tsx";
import { EcranCalendrier } from "~/ecrans/calendrier/EcranCalendrier.tsx";
import { EcranVilles } from "~/ecrans/villes/EcranVilles.tsx";
import { EcranBoite } from "~/ecrans/boite/EcranBoite.tsx";
import { EcranComptes } from "~/ecrans/comptes/EcranComptes.tsx";
import { EcranNotifications } from "~/ecrans/notifications/EcranNotifications.tsx";
import { EcranAutorisation } from "~/ecrans/connexion/EcranAutorisation.tsx";
import { EcranDeverrouillage } from "~/ecrans/connexion/EcranDeverrouillage.tsx";
import { EcranPremierLancement } from "~/ecrans/connexion/EcranPremierLancement.tsx";
import { EcranDemandes } from "~/ecrans/demandes/EcranDemandes.tsx";
import { EcranLieux } from "~/ecrans/lieux/EcranLieux.tsx";
import { EcranMaintenance } from "~/ecrans/maintenance/EcranMaintenance.tsx";
import { EcranMiamSafe } from "~/ecrans/miam-safe/EcranMiamSafe.tsx";
import { EcranModeration } from "~/ecrans/moderation/EcranModeration.tsx";
import { EcranNewsletter } from "~/ecrans/newsletter/EcranNewsletter.tsx";
import { EcranPublications } from "~/ecrans/publications/EcranPublications.tsx";
import { EcranReglages } from "~/ecrans/reglages/EcranReglages.tsx";
import { EcranStatistiques } from "~/ecrans/statistiques/EcranStatistiques.tsx";
import { EcranTableauDeBord } from "~/ecrans/tableau-de-bord/EcranTableauDeBord.tsx";
import { ModaleRaccourcis } from "~/composants/mise-en-page/ModaleRaccourcis.tsx";
import { RechercheGlobale } from "~/composants/mise-en-page/RechercheGlobale.tsx";
import { calculerPastilles } from "~/fonctions/alertes/calculer-pastilles.ts";
import { utiliserAlertes } from "~/hooks/utiliser-alertes.ts";
import { utiliserFond } from "~/hooks/utiliser-fond.ts";
import { utiliserRaccourcis } from "~/hooks/utiliser-raccourcis.ts";
import { utiliserTheme } from "~/hooks/utiliser-theme.ts";
import { utiliserAlertesServeur } from "~/hooks/utiliser-alertes-serveur.ts";
import { utiliserInactivite } from "~/hooks/utiliser-inactivite.ts";
import { utiliserMiseAJour } from "~/hooks/utiliser-mise-a-jour.ts";
import { utiliserResumeSemaine } from "~/hooks/utiliser-resume-semaine.ts";
import { configurerClient, definirSession, surPosteRefuse, surSessionPerdue } from "~/services/client-gestion.ts";
import { couperPoste } from "~/services/postes.ts";
import { definirCleCoffre, fermerSession } from "~/services/session.ts";
import { oublierSessionLocale } from "~/stockage/session-locale.ts";
import { estPassageFini, lireCoffre, oublierCoffre, type CoffreCle } from "~/stockage/coffre-local.ts";
import { oublierDeverrouillageRetenu } from "~/stockage/deverrouillage-retenu.ts";
import { deverrouillageRetenuValable } from "~/services/deverrouillage.ts";
import { ecrireMinutesVerrou, lireMinutesVerrou } from "~/stockage/reglages-poste.ts";

type Phase = "premier-lancement" | "autorisation" | "deverrouillage" | "connecte";

/** Le logiciel : connexion d'abord (clé du PC + code à 6 chiffres), puis le menu et l'écran choisi. */
export function Application() {
  const [coffre, setCoffre] = useState<CoffreCle | null>(() => lireCoffre());
  const [phase, setPhase] = useState<Phase>(() => (lireCoffre() ? "deverrouillage" : "premier-lancement"));
  const [cleEnMemoire, setCleEnMemoire] = useState(false);
  const [posteCoupe, setPosteCoupe] = useState(false);
  const [poste, setPoste] = useState("Ce PC");
  const [ecran, setEcran] = useState<Ecran>("tableau-de-bord");
  // Recherche partout (Ctrl+K), et l'élément à ouvrir dans l'écran choisi (un objet neuf à chaque fois)
  const [recherche, setRecherche] = useState(false);
  const [aideClavier, setAideClavier] = useState(false);
  const { theme, changerTheme } = utiliserTheme();
  const [cible, setCible] = useState<{ ecran: Ecran; id: number } | null>(null);
  const allerA = (vers: Ecran, id: number | null = null) => {
    setEcran(vers);
    setCible(id === null ? null : { ecran: vers, id });
  };
  const ouvrirDans = (vers: Ecran) => (cible?.ecran === vers ? cible : null);
  // Sans souris ni clavier pendant ce temps (réglable), la clé est oubliée : il faut retaper le mot de passe
  const [minutesVerrou, setMinutesVerrou] = useState(lireMinutesVerrou);
  const connecte = phase === "connecte";
  const fond = utiliserFond(coffre, connecte);
  const { alertes, actualiser: actualiserAlertes } = utiliserAlertes(connecte, fond.jeton, fond.jetonRefuse);
  const alertesServeur = utiliserAlertesServeur(connecte);
  const miseAJour = utiliserMiseAJour(connecte);
  utiliserResumeSemaine(connecte);

  // Raccourcis clavier (F1 pour la liste) ; Ctrl+K reste aux liens dans l'éditeur visuel
  utiliserRaccourcis(connecte, {
    rechercher: () => setRecherche(true),
    aller: (vers) => allerA(vers),
    verrouiller: () => verrouiller(true),
    aide: () => setAideClavier(true),
  });

  // Session fermée par le serveur (inactivité, redémarrage) : la clé reste ouverte, seul le code est redemandé
  useEffect(() => {
    surSessionPerdue(() => {
      setCleEnMemoire(true);
      setPhase("deverrouillage");
    });
    surPosteRefuse(() => {
      setPosteCoupe(true);
      setCleEnMemoire(true);
      setPhase("autorisation");
    });
    return () => {
      surSessionPerdue(null);
      surPosteRefuse(null);
    };
  }, []);

  function oublierCePc() {
    fond.oublier();
    oublierCoffre();
    oublierSessionLocale();
    oublierDeverrouillageRetenu();
    definirSession(null);
    configurerClient(null, null);
    void definirCleCoffre(null);
    setCoffre(null);
    setPosteCoupe(false);
    setPhase("premier-lancement");
  }

  async function partirDeCePc() {
    if (coffre) await couperPoste(coffre.idPoste).catch(() => {});
    oublierCePc();
  }

  /** Oublie la clé (mot de passe redemandé) ; `fermer` ferme aussi la session (code redemandé). */
  function verrouiller(fermer: boolean) {
    if (fermer) {
      oublierDeverrouillageRetenu();
      void fermerSession().catch(() => {});
    }
    configurerClient(null, null);
    void definirCleCoffre(null);
    setCleEnMemoire(false);
    setPhase("deverrouillage");
  }
  utiliserInactivite(minutesVerrou ?? 0, () => verrouiller(false), connecte && minutesVerrou !== null && !deverrouillageRetenuValable());

  if (phase === "premier-lancement" || !coffre) {
    return (
      <EcranPremierLancement
        onCree={(nouveau, cleSecrete, cleCoffre) => {
          configurerClient(cleSecrete, nouveau.idPoste);
          void definirCleCoffre(cleCoffre);
          setCoffre(nouveau);
          setCleEnMemoire(true);
          setPhase("autorisation");
        }}
      />
    );
  }
  if (phase === "autorisation") {
    return (
      <EcranAutorisation
        coffre={coffre}
        coupe={posteCoupe}
        onConnecte={(nom, misAJour) => {
          setCoffre(misAJour);
          setPoste(nom);
          setPosteCoupe(false);
          setCleEnMemoire(true);
          setPhase("connecte");
        }}
        onContinuer={() => setPhase("deverrouillage")}
        onOublierPoste={oublierCePc}
      />
    );
  }
  if (phase === "deverrouillage") {
    return (
      <EcranDeverrouillage
        key={String(cleEnMemoire)}
        coffre={coffre}
        cleEnMemoire={cleEnMemoire}
        onConnecte={(nom) => {
          if (nom) setPoste(nom);
          setCleEnMemoire(true);
          setPhase("connecte");
        }}
        onRevoirAutorisation={() => {
          setPosteCoupe(estPassageFini(coffre));
          setPhase("autorisation");
        }}
        onOublierPoste={oublierCePc}
      />
    );
  }

  return (
    <div className="flex h-full">
      <BarreLaterale
        ecran={ecran}
        onChoisir={(vers) => allerA(vers)}
        onRechercher={() => setRecherche(true)}
        poste={poste}
        pastilles={calculerPastilles(alertes, alertesServeur.problemes.length)}
        onVerrouiller={() => verrouiller(true)}
      />
      <RechercheGlobale ouverte={recherche} onFermer={() => setRecherche(false)} onAller={allerA} />
      <ModaleRaccourcis ouverte={aideClavier} onFermer={() => setAideClavier(false)} />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <BandeauPosteDePassage coffre={coffre} onPartir={partirDeCePc} />
        <BandeauNouveautes />
        {miseAJour && <BandeauMiseAJour miseAJour={miseAJour} />}
        <div className="mx-auto max-w-[1280px] px-8 py-7">
          <FiletDeSecurite key={ecran} retour={ecran === "tableau-de-bord" ? undefined : () => allerA("tableau-de-bord")}>
            {ecran === "tableau-de-bord" && <EcranTableauDeBord allerA={(vers) => allerA(vers)} problemesServeur={alertesServeur.problemes} reverifierServeur={alertesServeur.verifier} />}
            {ecran === "statistiques" && <EcranStatistiques />}
            {ecran === "calendrier" && <EcranCalendrier allerA={allerA} />}
            {ecran === "newsletter" && <EcranNewsletter />}
            {ecran === "lieux" && <EcranLieux ouvrir={ouvrirDans("lieux")} allerA={allerA} />}
            {ecran === "villes" && <EcranVilles allerA={allerA} />}
            {ecran === "boite" && <EcranBoite allerA={allerA} onLu={actualiserAlertes} />}
            {ecran === "demandes" && <EcranDemandes onDecision={actualiserAlertes} />}
            {ecran === "annonces" && <EcranAnnonces />}
            {ecran === "defis" && <EcranDefis />}
            {ecran === "presse" && <EcranPresse />}
            {ecran === "evenements" && <EcranEvenements />}
            {ecran === "reservations" && <EcranReservations ouvrirLieu={(id) => allerA("lieux", id)} />}
            {ecran === "ambassadeurs" && <EcranAmbassadeurs onDecision={actualiserAlertes} cible={ouvrirDans("ambassadeurs")} />}
            {ecran === "publications" && <EcranPublications ouvrir={ouvrirDans("publications")} />}
            {ecran === "moderation" && <EcranModeration />}
            {ecran === "avis" && <EcranAvis ouvrirCompte={(id) => allerA("utilisateurs", id)} onDecision={actualiserAlertes} />}
            {ecran === "miam-safe" && <EcranMiamSafe onDecision={actualiserAlertes} />}
            {ecran === "utilisateurs" && <EcranComptes ouvrir={ouvrirDans("utilisateurs")} surveillance={alertes?.surveillance} limitations={alertes?.limitations} onDecision={actualiserAlertes} />}
            {ecran === "big-sos" && <EcranBigSos ouvrir={ouvrirDans("big-sos")} />}
            {ecran === "notifications" && <EcranNotifications />}
            {ecran === "pop-ups" && <EcranPopUps />}
            {ecran === "communaute" && <EcranCommunaute />}
            {ecran === "carriere" && <EcranCarriere onDecision={actualiserAlertes} />}
            {ecran === "chasse-aux-bugs" && <EcranChasseAuxBugs onDecision={actualiserAlertes} />}
            {ecran === "versions-app" && <EcranVersionsApp />}
            {ecran === "postes" && <EcranPostes />}
            {ecran === "actus" && <EcranActus onDecision={actualiserAlertes} />}
            {ecran === "maintenance" && <EcranMaintenance surEtat={alertesServeur.prendreEtat} />}
            {ecran === "reglages" && (
              <EcranReglages
                theme={theme}
                onTheme={changerTheme}
                onRaccourcis={() => setAideClavier(true)}
                coffre={coffre}
                onCoffreChange={setCoffre}
                fond={fond}
                minutesVerrou={minutesVerrou}
                onMinutesVerrou={(minutes) => {
                  ecrireMinutesVerrou(minutes);
                  setMinutesVerrou(minutes);
                }}
                onOublierPoste={() => {
                  fond.oublier();
                  verrouiller(true);
                  oublierCoffre();
                  setCoffre(null);
                  setPhase("premier-lancement");
                }}
              />
            )}
          </FiletDeSecurite>
        </div>
      </main>
    </div>
  );
}
