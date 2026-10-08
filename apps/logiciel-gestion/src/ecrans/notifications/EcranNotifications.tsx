import { RotateCw, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { annulerNotification, listerNotifications, type NotificationPush } from "~/services/notifications.ts";
import { CarteReglagesPush } from "./CarteReglagesPush.tsx";
import { FormulaireNotification } from "./FormulaireNotification.tsx";

const STATUTS: Record<NotificationPush["statut"], { libelle: string; ton: "jaune" | "vert" | "neutre" | "encre" }> = {
  programmee: { libelle: "Programmée", ton: "encre" },
  envoi: { libelle: "En cours d'envoi", ton: "jaune" },
  envoyee: { libelle: "Envoyée", ton: "vert" },
  annulee: { libelle: "Annulée", ton: "neutre" },
};

/** Les notifications de l'app : écrire, viser, programmer, et voir ce qu'elles sont devenues. */
export function EcranNotifications() {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(listerNotifications, []);
  const [message, setMessage] = useState<string | null>(null);
  // Une notification en route : on suit son envoi toutes les 10 secondes
  const enRoute = donnees?.notifications.some((n) => n.statut === "envoi" || (n.statut === "programmee" && new Date(n.programmeeLe).getTime() < Date.now() + 60_000));
  useEffect(() => {
    if (!enRoute) return;
    const minuteur = setInterval(recharger, 10_000);
    return () => clearInterval(minuteur);
  }, [enRoute, recharger]);

  return (
    <>
      <EnTeteEcran
        titre="Notifications"
        sousTitre="Envoyées directement à Apple et Google, sans intermédiaire. Anti-spam : au plus 1 par jour et 4 par semaine par téléphone (hors celles que la personne a demandées)."
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>}
      />
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{message}</p>}
      {donnees && (
        <div className="grid gap-5">
          <CarteReglagesPush etat={donnees.etat} />
          <FormulaireNotification onEnvoyee={(bilan) => { setMessage(bilan); recharger(); }} />
          <Carte titre="Envoyées et programmées" sansMarge>
            {donnees.notifications.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gris">Aucune notification pour l'instant.</p>
            ) : (
              <ul>
                {donnees.notifications.map((n) => (
                  <li key={n.id} className="grid gap-1 border-b border-ligne/70 px-5 py-3 text-sm last:border-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{n.titre}</span>
                      <Badge ton={STATUTS[n.statut].ton}>{STATUTS[n.statut].libelle}</Badge>
                      <span className="text-gris">{n.description}{n.lien ? ` · ouvre ${n.lien}` : ""}</span>
                      <span className="ml-auto text-gris">{formaterDate(n.envoyeeLe ?? n.programmeeLe, true)}</span>
                      {n.statut === "programmee" && (
                        <Bouton petit variante="discret" icone={X} onClick={() => window.confirm("Annuler cette notification ?") && void annulerNotification(n.id).then(recharger, recharger)}>
                          Annuler
                        </Bouton>
                      )}
                    </div>
                    <p className="text-gris">{n.texte}</p>
                    {n.statut === "envoyee" && (
                      <p className="chiffres text-[13px]">
                        {n.envoyees} reçue(s) sur {n.total}
                        {n.ignorees > 0 && ` · ${n.ignorees} laissée(s) de côté (anti-spam)`}
                        {n.echecs > 0 && ` · ${n.echecs} échec(s)`}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Carte>
        </div>
      )}
    </>
  );
}
