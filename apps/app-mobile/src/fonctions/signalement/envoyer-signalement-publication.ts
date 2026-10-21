import type { Signalement } from "@sos-miam/commun/types/signalement";

import { clientApiSignalements } from "~/services/client-api-signalements";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { lireSignalementsAEnvoyer, remplacerSignalementsAEnvoyer } from "~/stockage/signalements-a-envoyer";
import { ajouterSignalementLocal } from "~/stockage/signalements-locaux";

/**
 * Envoie un signalement de publication à la modération (POST /signalements, avec la session si on est connecté : le
 * serveur ne garde pas qui signale, il vérifie seulement s'il peut masquer tout de suite). Sans réseau, il attend sur le téléphone et repart au prochain lancement. Mode démo : il reste sur le téléphone.
 * Rend faux seulement si le serveur l'a refusé pour de bon (mal formé).
 */
export async function envoyerSignalementPublication(signalement: Signalement): Promise<boolean> {
  if (DEMO_VISITES_ACTIVE) {
    await ajouterSignalementLocal(signalement).catch(() => {});
    return true;
  }
  const { date: _date, ...corps } = signalement;
  const r = await clientApiSignalements.demander("POST", "/signalements", { corps });
  if (r.ok) return true;
  // Refus définitif (mal formé) : l'API dit « signalement-invalide », un ancien serveur « champ-invalide »
  if (r.erreur === "signalement-invalide" || r.erreur === "champ-invalide") return false;
  await remplacerSignalementsAEnvoyer([...(await lireSignalementsAEnvoyer()), signalement]);
  return true;
}
