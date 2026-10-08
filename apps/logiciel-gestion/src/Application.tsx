import { useEffect, useState } from "react";

import { BandeauMiseAJour } from "~/composants/mise-en-page/BandeauMiseAJour.tsx";
import { BandeauNouveautes } from "~/composants/mise-en-page/BandeauNouveautes.tsx";
import { BarreLaterale } from "~/composants/mise-en-page/BarreLaterale.tsx";
import type { Ecran } from "~/contenus/menu.ts";
import { EcranAmbassadeurs } from "~/ecrans/ambassadeurs/EcranAmbassadeurs.tsx";
import { EcranAnnonces } from "~/ecrans/annonces/EcranAnnonces.tsx";
import { EcranBigSos } from "~/ecrans/big-sos/EcranBigSos.tsx";
import { EcranComptes } from "~/ecrans/comptes/EcranComptes.tsx";
import { EcranNotifications } from "~/ecrans/notifications/EcranNotifications.tsx";
import { EcranAutorisation } from "~/ecrans/connexion/EcranAutorisation.tsx";
import { EcranDeverrouillage } from "~/ecrans/connexion/EcranDeverrouillage.tsx";
import { EcranPremierLancement } from "~/ecrans/connexion/EcranPremierLancement.tsx";
import { EcranDemandes } from "~/ecrans/demandes/EcranDemandes.tsx";
import { EcranLieux } from "~/ecrans/lieux/EcranLieux.tsx";
import { EcranMaintenance } from "~/ecrans/maintenance/EcranMaintenance.tsx";
import { EcranModeration } from "~/ecrans/moderation/EcranModeration.tsx";
import { EcranNewsletter } from "~/ecrans/newsletter/EcranNewsletter.tsx";
import { EcranPublications } from "~/ecrans/publications/EcranPublications.tsx";
import { EcranReglages } from "~/ecrans/reglages/EcranReglages.tsx";
import { EcranStatistiques } from "~/ecrans/statistiques/EcranStatistiques.tsx";
import { EcranTableauDeBord } from "~/ecrans/tableau-de-bord/EcranTableauDeBord.tsx";
import { RechercheGlobale } from "~/composants/mise-en-page/RechercheGlobale.tsx";
import { calculerPastilles } from "~/fonctions/alertes/calculer-pastilles.ts";
import { utiliserAlertes } from "~/hooks/utiliser-alertes.ts";
import { utiliserAlertesServeur } from "~/hooks/utiliser-alertes-serveur.ts";
import { utiliserInactivite } from "~/hooks/utiliser-inactivite.ts";
import { utiliserMiseAJour } from "~/hooks/utiliser-mise-a-jour.ts";
import { utiliserResumeSemaine } from "~/hooks/utiliser-resume-semaine.ts";
import { configurerClient, surSessionPerdue } from "~/services/client-gestion.ts";
import { definirCleCoffre, fermerSession } from "~/services/session.ts";
import { oublierSessionLocale } from "~/stockage/session-locale.ts";
import { lireCoffre, oublierCoffre, type CoffreCle } from "~/stockage/coffre-local.ts";
import { ecrireMinutesVerrou, lireMinutesVerrou } from "~/stockage/reglages-poste.ts";

type Phase = "premier-lancement" | "autorisation" | "deverrouillage" | "connecte";

/** Le logiciel : connexion d'abord (clé du PC + code à 6 chiffres), puis le menu et l'écran choisi. */
export function Application() {
  const [coffre, setCoffre] = useState<CoffreCle | null>(() => lireCoffre());
  const [phase, setPhase] = useState<Phase>(() => (lireCoffre() ? "deverrouillage" : "premier-lancement"));
  const [cleEnMemoire, setCleEnMemoire] = useState(false);
  const [poste, setPoste] = useState("Ce PC");
  const [ecran, setEcran] = useState<Ecran>("tableau-de-bord");
  // Recherche partout (Ctrl+K), et l'élément à ouvrir dans l'écran choisi (un objet neuf à chaque fois)
  const [recherche, setRecherche] = useState(false);
  const [cible, setCible] = useState<{ ecran: Ecran; id: number } | null>(null);
  const allerA = (vers: Ecran, id: number | null = null) => {
    setEcran(vers);
    setCible(id === null ? null : { ecran: vers, id });
  };
  const ouvrirDans = (vers: Ecran) => (cible?.ecran === vers ? cible : null);
  // Sans souris ni clavier pendant ce temps (réglable), la clé est oubliée : il faut retaper le mot de passe
  const [minutesVerrou, setMinutesVerrou] = useState(lireMinutesVerrou);
  const connecte = phase === "connecte";
  const { alertes, actualiser: actualiserAlertes } = utiliserAlertes(connecte);
  const alertesServeur = utiliserAlertesServeur(connecte);
  const miseAJour = utiliserMiseAJour(connecte);
  utiliserResumeSemaine(connecte);

  // Ctrl+K partout : la recherche (sauf dans l'éditeur visuel, où Ctrl+K ajoute un lien)
  useEffect(() => {
    if (!connecte) return;
    const touche = (evenement: KeyboardEvent) => {
      if ((evenement.ctrlKey || evenement.metaKey) && evenement.key.toLowerCase() === "k" && !evenement.defaultPrevented) {
        evenement.preventDefault();
        setRecherche(true);
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [connecte]);

  // Session fermée par le serveur (inactivité, redémarrage) : la clé reste ouverte, seul le code est redemandé
  useEffect(() => {
    surSessionPerdue(() => {
      setCleEnMemoire(true);
      setPhase("deverrouillage");
    });
    return () => surSessionPerdue(null);
  }, []);

  /** Oublie la clé (mot de passe redemandé) ; `fermer` ferme aussi la session (code redemandé). */
  function verrouiller(fermer: boolean) {
    if (fermer) void fermerSession().catch(() => {});
    configurerClient(null, null);
    void definirCleCoffre(null);
    setCleEnMemoire(false);
    setPhase("deverrouillage");
  }
  utiliserInactivite(minutesVerrou ?? 0, () => verrouiller(false), connecte && minutesVerrou !== null);

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
  if (phase === "autorisation") return <EcranAutorisation coffre={coffre} onContinuer={() => setPhase("deverrouillage")} />;
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
        onRevoirAutorisation={() => setPhase("autorisation")}
        onOublierPoste={() => {
          oublierCoffre();
          oublierSessionLocale();
          configurerClient(null, null);
          setCoffre(null);
          setPhase("premier-lancement");
        }}
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
      <main className="min-w-0 flex-1 overflow-y-auto">
        <BandeauNouveautes />
        {miseAJour && <BandeauMiseAJour miseAJour={miseAJour} />}
        <div className="mx-auto max-w-[1280px] px-8 py-7">
          {ecran === "tableau-de-bord" && <EcranTableauDeBord allerA={(vers) => allerA(vers)} problemesServeur={alertesServeur.problemes} reverifierServeur={alertesServeur.verifier} />}
          {ecran === "statistiques" && <EcranStatistiques />}
          {ecran === "newsletter" && <EcranNewsletter />}
          {ecran === "lieux" && <EcranLieux ouvrir={ouvrirDans("lieux")} allerA={allerA} />}
          {ecran === "demandes" && <EcranDemandes />}
          {ecran === "annonces" && <EcranAnnonces />}
          {ecran === "ambassadeurs" && <EcranAmbassadeurs onDecision={actualiserAlertes} cible={ouvrirDans("ambassadeurs")} />}
          {ecran === "publications" && <EcranPublications ouvrir={ouvrirDans("publications")} />}
          {ecran === "moderation" && <EcranModeration />}
          {ecran === "utilisateurs" && <EcranComptes ouvrir={ouvrirDans("utilisateurs")} />}
          {ecran === "big-sos" && <EcranBigSos ouvrir={ouvrirDans("big-sos")} />}
          {ecran === "notifications" && <EcranNotifications />}
          {ecran === "maintenance" && <EcranMaintenance surEtat={alertesServeur.prendreEtat} />}
          {ecran === "reglages" && (
            <EcranReglages
              coffre={coffre}
              onCoffreChange={setCoffre}
              minutesVerrou={minutesVerrou}
              onMinutesVerrou={(minutes) => {
                ecrireMinutesVerrou(minutes);
                setMinutesVerrou(minutes);
              }}
              onOublierPoste={() => {
                verrouiller(true);
                oublierCoffre();
                setCoffre(null);
                setPhase("premier-lancement");
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
