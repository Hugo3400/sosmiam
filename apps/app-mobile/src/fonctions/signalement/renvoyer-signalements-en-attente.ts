import { clientApiSignalements } from "~/services/client-api-signalements";
import { lireSignalementsAEnvoyer, remplacerSignalementsAEnvoyer } from "~/stockage/signalements-a-envoyer";

/** Au lancement : renvoie les signalements restés sur le téléphone faute de réseau ; ceux qui ne partent toujours pas attendent. */
export async function renvoyerSignalementsEnAttente(): Promise<void> {
  const enAttente = await lireSignalementsAEnvoyer();
  if (enAttente.length === 0) return;
  const restants = [];
  for (const signalement of enAttente) {
    const { date: _date, ...corps } = signalement;
    const r = await clientApiSignalements.demander("POST", "/signalements", { corps });
    // Refus définitif (mal formé : « signalement-invalide », ou « champ-invalide » d'un ancien serveur) : abandonné ; pas
    // de réseau, serveur occupé : il attend encore
    if (!r.ok && r.erreur !== "signalement-invalide" && r.erreur !== "champ-invalide") restants.push(signalement);
  }
  await remplacerSignalementsAEnvoyer(restants);
}
