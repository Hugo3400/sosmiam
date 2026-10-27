// Un mail écrit à la main dans le logiciel de gestion (à un compte, au contact d'une demande de lieu…), envoyé tout de
// suite par la boîte bonjour@sosmiam.fr, aux couleurs de SOS Miam. La personne répond simplement au mail. Comme pour
// les autres envois, le journal ne garde que l'adresse, l'objet et le résultat (effacé après 90 jours), jamais le texte.
import { TEXTES_COURRIELS_COMPTES_PAR_LANGUE } from "../../../../../packages/commun/src/contenus/courriels-comptes.ts";
import { lireLangue } from "../../../../../packages/commun/src/fonctions/langue/lire-langue.ts";
import { LANGUE_PAR_DEFAUT } from "../../../../../packages/commun/src/regles/langues.ts";
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { habillerCourriel } from "../../fonctions/courriels/habiller-courriel.ts";
import type { MessageCourriel } from "./expedier-courriel.ts";
import { envoyerToutDeSuite } from "./file-courriels.ts";

export type DestinataireEcrit = { compteId: number } | { adresse: string };

/** Les paragraphes d'un texte tapé : séparés par une ligne vide ; un simple retour à la ligne reste dans son paragraphe. */
const couperParagraphes = (texte: string) =>
  texte.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((paragraphe) => paragraphe.trim()).filter(Boolean);

/** Envoie le mail ; « introuvable » si le compte n'existe plus, sinon le résultat de l'envoi (réglages, refus…). */
export async function envoyerCourrielEcrit(destinataire: DestinataireEcrit, objet: string, texte: string, enReponseA?: MessageCourriel["enReponseA"]) {
  const compte = "compteId" in destinataire ? await baseDeDonnees.compte.findUnique({ where: { id: destinataire.compteId }, select: { email: true, langue: true } }) : null;
  const adresse = "compteId" in destinataire ? compte?.email : destinataire.adresse;
  if (!adresse) return { ok: false as const, erreur: "introuvable" };
  const langue = lireLangue(compte?.langue) ?? LANGUE_PAR_DEFAUT;
  const pied = TEXTES_COURRIELS_COMPTES_PAR_LANGUE[langue].ecrit.pied;
  return envoyerToutDeSuite("ecrit", adresse, { objet, ...habillerCourriel({ paragraphes: couperParagraphes(texte), pied, langue }), ecritALaMain: true, enReponseA });
}
