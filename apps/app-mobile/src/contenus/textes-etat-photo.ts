import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ETAT_PHOTO_ANGLAIS } from "~/contenus/anglais/textes-etat-photo";

export const TEXTES_ETAT_PHOTO = {
  envoiEnCours: "📤 Ta photo part sur SOS Miam…",
  retraitEnCours: "🧽 Ta photo s'en va de SOS Miam…",
  compteLimite:
    "🔒 Ton compte est limité pour l'instant : ta nouvelle photo ne peut pas être montrée aux autres. Tu retrouves ton avatar d'avant, et tu pourras réessayer à la fin de la limitation.",
  fichier: "😕 Cette photo n'a pas voulu partir (format ou taille). Réessaie avec une autre, ça devrait passer.",
  envoiRate: "😕 Ta photo n'a pas pu partir. Réessaie dans un petit moment.",
  retraitRate: "😕 Ta photo n'a pas pu être retirée. Réessaie dans un petit moment.",
  suiteEnvoi: "ta photo partira toute seule",
  suiteRetrait: "ta photo sera retirée toute seule",
  reseauEnvoi: (suite: string) => `📶 Pas de réseau pour l'instant : ${suite} dès qu'il revient. En attendant, elle reste sur ton téléphone.`,
  reseauRetrait: (suite: string) => `📶 Pas de réseau pour l'instant : ${suite} dès qu'il revient.`,
  dans: (attente: string) => ` dans ${attente}`,
  plusTard: " un peu plus tard",
  quota: (dans: string) => `⏳ Tu as changé de photo 20 fois aujourd'hui : on souffle un peu ! Ta nouvelle photo partira toute seule${dans}.`,
  stockage: (suite: string, dans: string) => `🗄️ Notre serveur est plein à craquer (on s'en occupe !) : ${suite}${dans}.`,
  pause: (suite: string) => `🛠️ Notre serveur reprend son souffle : ${suite} un peu plus tard. Rien n'est perdu.`,
} as const;

export const TEXTES_ETAT_PHOTO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ETAT_PHOTO>> = { fr: TEXTES_ETAT_PHOTO, en: TEXTES_ETAT_PHOTO_ANGLAIS };
