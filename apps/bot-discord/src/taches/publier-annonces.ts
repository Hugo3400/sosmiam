// Toutes les 30 secondes, le bot demande à l'API s'il y a des annonces à publier (écrites dans le logiciel de gestion),
// les poste dans le salon choisi avec /config annonces, puis dit à l'API ce qu'il en a fait.
import { MessageFlags, type Client } from "discord.js";
import { creerMessageAnnonce, type Annonce } from "../messages/creer-message-annonce.ts";
import { apiConfiguree, appelerApi } from "../services/api.ts";
import { lireReglages } from "../stockage/reglages-serveurs.ts";

async function publier(client: Client<true>, annonce: Annonce): Promise<{ lien: string } | { erreur: string }> {
  // Le premier serveur qui a un salon d'annonces (SOS Miam n'a qu'un serveur)
  const serveur = client.guilds.cache.find((s) => lireReglages(s.id).salonAnnonces);
  const idSalon = serveur ? lireReglages(serveur.id).salonAnnonces : undefined;
  if (!serveur || !idSalon) return { erreur: "Aucun salon d'annonces : choisis-le avec /config annonces." };
  const salon = await serveur.channels.fetch(idSalon).catch(() => null);
  if (!salon?.isSendable()) return { erreur: "Le salon d'annonces a disparu, ou le bot ne peut pas y écrire." };
  const message = await salon.send({ components: [creerMessageAnnonce(annonce)], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } });
  return { lien: message.url };
}

export function demarrerPublicationAnnonces(client: Client<true>): void {
  if (!apiConfiguree()) {
    console.log("Annonces du logiciel de gestion désactivées (SECRET_BOT absent du .env).");
    return;
  }
  let enCours = false;
  setInterval(async () => {
    if (enCours) return;
    enCours = true;
    try {
      for (const annonce of await appelerApi<Annonce[]>("GET", "/annonces")) {
        const resultat = await publier(client, annonce).catch((erreur: unknown) => ({ erreur: String((erreur as Error).message ?? erreur) }));
        await appelerApi("POST", `/annonces/${annonce.id}`, resultat);
      }
    } catch (erreur) {
      console.error("Annonces : API injoignable :", (erreur as Error).message);
    } finally {
      enCours = false;
    }
  }, 30_000);
}
