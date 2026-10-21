import { RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { LIBELLES_ACTIONS } from "~/contenus/serveurs-dev.ts";
import { expliquerErreurServeur } from "~/fonctions/maintenance/expliquer-erreur-serveur.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { agirSurServeur, lireServeurs, type ActionServeur, type ServeurSuivi } from "~/services/serveurs.ts";
import { CarteServeurDev } from "./CarteServeurDev.tsx";
import { ModaleEteindreServeur } from "./ModaleEteindreServeur.tsx";
import { TableauServeursProduction } from "./TableauServeursProduction.tsx";

const RELECTURES_MAX = 20;
const DELAI_RELECTURE = 2500;

export function EcranServeurs() {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireServeurs, []);
  const [enCours, setEnCours] = useState<{ id: string; action: ActionServeur } | null>(null);
  const [aEteindre, setAEteindre] = useState<ServeurSuivi | null>(null);
  const [message, setMessage] = useState<{ reussi: boolean; texte: string } | null>(null);
  const relectures = useRef(0);

  const enMouvement = Boolean(donnees && (donnees.actionEnCours || donnees.serveurs.some((serveur) => serveur.etat === "en-transition")));
  useEffect(() => {
    if (!enMouvement || enCours || relectures.current >= RELECTURES_MAX) return;
    const minuteur = setTimeout(() => {
      relectures.current += 1;
      recharger();
    }, DELAI_RELECTURE);
    return () => clearTimeout(minuteur);
  }, [donnees, enMouvement, enCours, recharger]);

  async function agir(serveur: ServeurSuivi, action: ActionServeur) {
    setAEteindre(null);
    setEnCours({ id: serveur.id, action });
    setMessage(null);
    try {
      await agirSurServeur(serveur.id, action);
      const suite = serveur.id !== "app-dev" ? "" : action === "eteindre" ? " Metro n'est plus joignable par le tunnel." : " Le tunnel peut mettre quelques secondes à répondre.";
      setMessage({ reussi: true, texte: `${serveur.nom} : ${LIBELLES_ACTIONS[action].fait} ✅${suite}` });
    } catch (probleme) {
      setMessage({ reussi: false, texte: expliquerErreurServeur(probleme instanceof ErreurApi ? probleme : new ErreurApi("erreur-inattendue", 0)) });
    } finally {
      setEnCours(null);
      relectures.current = 0;
      recharger();
    }
  }

  function demander(serveur: ServeurSuivi, action: ActionServeur) {
    if (action === "eteindre") setAEteindre(serveur);
    else void agir(serveur, action);
  }

  const occupe = enCours !== null || Boolean(donnees?.actionEnCours);
  const actionDe = (id: string) => (enCours?.id === id ? enCours.action : donnees?.actionEnCours?.id === id ? donnees.actionEnCours.action : null);
  return (
    <>
      <EnTeteEcran
        titre="Serveurs de dev"
        sousTitre="Allume et éteins les serveurs de développement du VPS d'un clic, sans terminal. La production, elle, se regarde sans se toucher."
        actions={
          <Bouton
            icone={RotateCw}
            chargement={chargement && !!donnees}
            onClick={() => {
              relectures.current = 0;
              recharger();
            }}
          >
            Actualiser
          </Bouton>
        }
      />
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && (
        <div className="grid gap-5">
          {!donnees.pm2Repond && (
            <p role="alert" className="rounded-carte border-2 border-encre bg-jaune-clair px-5 py-3 text-sm font-semibold">
              ⚠️ pm2 ne répond pas : impossible de savoir si les serveurs tournent. Réessaie dans un moment.
            </p>
          )}
          {message && (
            <p role="status" className={`rounded-carte px-5 py-3 text-sm font-semibold ${message.reussi ? "bg-vert-clair text-vert" : "bg-rose-alerte text-rouge-texte"}`}>
              {message.texte}
            </p>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {donnees.serveurs.filter((serveur) => serveur.pilotable).map((serveur) => (
              <CarteServeurDev key={serveur.id} serveur={serveur} actionEnCours={actionDe(serveur.id)} occupe={occupe} onAction={(action) => demander(serveur, action)} />
            ))}
          </div>
          <TableauServeursProduction serveurs={donnees.serveurs.filter((serveur) => !serveur.pilotable)} />
        </div>
      )}
      <ModaleEteindreServeur serveur={aEteindre} onConfirmer={() => aEteindre && void agir(aEteindre, "eteindre")} onFermer={() => setAEteindre(null)} />
    </>
  );
}
