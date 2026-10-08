import { useEffect, useState } from "react";

import { BarreLaterale } from "~/composants/mise-en-page/BarreLaterale.tsx";
import type { Ecran } from "~/contenus/menu.ts";
import { EcranBientot } from "~/ecrans/big-sos/EcranBientot.tsx";
import { EcranAutorisation } from "~/ecrans/connexion/EcranAutorisation.tsx";
import { EcranDeverrouillage } from "~/ecrans/connexion/EcranDeverrouillage.tsx";
import { EcranPremierLancement } from "~/ecrans/connexion/EcranPremierLancement.tsx";
import { EcranLieux } from "~/ecrans/lieux/EcranLieux.tsx";
import { EcranMaintenance } from "~/ecrans/maintenance/EcranMaintenance.tsx";
import { EcranModeration } from "~/ecrans/moderation/EcranModeration.tsx";
import { EcranNewsletter } from "~/ecrans/newsletter/EcranNewsletter.tsx";
import { EcranPublications } from "~/ecrans/publications/EcranPublications.tsx";
import { EcranReglages } from "~/ecrans/reglages/EcranReglages.tsx";
import { EcranStatistiques } from "~/ecrans/statistiques/EcranStatistiques.tsx";
import { EcranTableauDeBord } from "~/ecrans/tableau-de-bord/EcranTableauDeBord.tsx";
import { utiliserAlertesModeration } from "~/hooks/utiliser-alertes-moderation.ts";
import { utiliserInactivite } from "~/hooks/utiliser-inactivite.ts";
import { configurerClient, surSessionPerdue } from "~/services/client-gestion.ts";
import { fermerSession } from "~/services/session.ts";
import { lireCoffre, oublierCoffre, type CoffreCle } from "~/stockage/coffre-local.ts";

type Phase = "premier-lancement" | "autorisation" | "deverrouillage" | "connecte";
/** Sans souris ni clavier pendant ce temps, la clé est oubliée : il faut retaper le mot de passe. */
const MINUTES_AVANT_VERROU = 20;

/** Le logiciel : connexion d'abord (clé du PC + code à 6 chiffres), puis le menu et l'écran choisi. */
export function Application() {
  const [coffre, setCoffre] = useState<CoffreCle | null>(() => lireCoffre());
  const [phase, setPhase] = useState<Phase>(() => (lireCoffre() ? "deverrouillage" : "premier-lancement"));
  const [cleEnMemoire, setCleEnMemoire] = useState(false);
  const [poste, setPoste] = useState("Ce PC");
  const [ecran, setEcran] = useState<Ecran>("tableau-de-bord");
  const connecte = phase === "connecte";
  const moderation = utiliserAlertesModeration(connecte);

  // Session fermée par le serveur (inactivité, redémarrage) : la clé reste ouverte, seul le code est redemandé
  useEffect(() => {
    surSessionPerdue(() => {
      setCleEnMemoire(true);
      setPhase("deverrouillage");
    });
    return () => surSessionPerdue(null);
  }, []);

  function verrouiller(fermer: boolean) {
    if (fermer) void fermerSession().catch(() => {});
    configurerClient(null, null);
    setCleEnMemoire(false);
    setPhase("deverrouillage");
  }
  utiliserInactivite(MINUTES_AVANT_VERROU, () => verrouiller(false), connecte);

  if (phase === "premier-lancement" || !coffre) {
    return (
      <EcranPremierLancement
        onCree={(nouveau, cleSecrete) => {
          configurerClient(cleSecrete, nouveau.idPoste);
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
          configurerClient(null, null);
          setCoffre(null);
          setPhase("premier-lancement");
        }}
      />
    );
  }

  return (
    <div className="flex h-full">
      <BarreLaterale ecran={ecran} onChoisir={setEcran} poste={poste} moderation={moderation} onVerrouiller={() => verrouiller(true)} />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] px-8 py-7">
          {ecran === "tableau-de-bord" && <EcranTableauDeBord allerA={setEcran} />}
          {ecran === "statistiques" && <EcranStatistiques />}
          {ecran === "newsletter" && <EcranNewsletter />}
          {ecran === "lieux" && <EcranLieux />}
          {ecran === "publications" && <EcranPublications />}
          {ecran === "moderation" && <EcranModeration />}
          {(ecran === "big-sos" || ecran === "notifications" || ecran === "utilisateurs") && <EcranBientot ecran={ecran} />}
          {ecran === "maintenance" && <EcranMaintenance />}
          {ecran === "reglages" && (
            <EcranReglages
              coffre={coffre}
              onCoffreChange={setCoffre}
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
