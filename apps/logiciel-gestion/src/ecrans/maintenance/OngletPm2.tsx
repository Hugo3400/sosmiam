import { useEffect, useRef, useState } from "react";

import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { LIBELLES_ACTIONS } from "~/contenus/serveurs-dev.ts";
import { expliquerErreurServeur } from "~/fonctions/maintenance/expliquer-erreur-serveur.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { relancerProcessus } from "~/services/maintenance.ts";
import { agirSurServeur, lireServeurs, type ActionServeur, type ServeurSuivi } from "~/services/serveurs.ts";
import { CarteServeurDev } from "./CarteServeurDev.tsx";
import { ModaleEteindreServeur } from "./ModaleEteindreServeur.tsx";
import { TableauServeursProduction } from "./TableauServeursProduction.tsx";

const RELECTURES_MAX = 20;
const DELAI_RELECTURE = 2500;

export function OngletPm2({ tour }: { tour: number }) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireServeurs, [tour]);
  const [enCours, setEnCours] = useState<{ id: string; action: ActionServeur } | null>(null);
  const [aEteindre, setAEteindre] = useState<ServeurSuivi | null>(null);
  const [relance, setRelance] = useState<string | null>(null);
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

  async function relancer(processus: string) {
    if (!window.confirm(`Relancer ${processus} ? Il sera indisponible quelques secondes.`)) return;
    setRelance(processus);
    setMessage(null);
    try {
      await relancerProcessus(processus);
      setMessage({ reussi: true, texte: `${processus} relancé ✅` });
      setTimeout(recharger, 2000);
    } catch (probleme) {
      setMessage({ reussi: false, texte: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    } finally {
      setRelance(null);
    }
  }

  if (!donnees && chargement) return <Chargement />;
  if (!donnees) return <MessageErreur erreur={erreur} reessayer={recharger} />;
  const occupe = enCours !== null || Boolean(donnees.actionEnCours);
  const actionDe = (id: string) => (enCours?.id === id ? enCours.action : donnees.actionEnCours?.id === id ? donnees.actionEnCours.action : null);
  return (
    <div className="grid gap-5">
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees.pm2Repond && (
        <p role="alert" className="rounded-carte border-2 border-encre bg-jaune-clair px-5 py-3 text-sm font-semibold">
          ⚠️ pm2 ne répond pas : impossible de savoir si les programmes tournent. Réessaie dans un moment.
        </p>
      )}
      {message && (
        <p role="status" className={`rounded-carte px-5 py-3 text-sm font-semibold ${message.reussi ? "bg-vert-clair text-vert" : "bg-rose-alerte text-rouge-texte"}`}>
          {message.texte}
        </p>
      )}
      <TableauServeursProduction serveurs={donnees.serveurs.filter((serveur) => !serveur.pilotable)} relance={relance} onRelancer={(processus) => void relancer(processus)} />
      <div className="grid gap-2">
        <h2 className="text-lg font-extrabold">Serveurs de dev</h2>
        <p className="text-[13px] text-gris">Allume et éteins les serveurs de développement du VPS d'un clic, sans terminal.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {donnees.serveurs.filter((serveur) => serveur.pilotable).map((serveur) => (
          <CarteServeurDev key={serveur.id} serveur={serveur} actionEnCours={actionDe(serveur.id)} occupe={occupe} onAction={(action) => demander(serveur, action)} />
        ))}
      </div>
      <ModaleEteindreServeur serveur={aEteindre} onConfirmer={() => aEteindre && void agir(aEteindre, "eteindre")} onFermer={() => setAEteindre(null)} />
    </div>
  );
}
