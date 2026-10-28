import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_REGLAGES_BLOQUES_ANGLAIS } from "~/contenus/anglais/textes-reglages-bloques";

export const TEXTES_REGLAGES_BLOQUES = {
  debloque: (prenom: string) => `C'est fait, tu as débloqué ${prenom}. Tu reverras ses messages et ses commentaires, mais pas dans ta bande pour autant.`,
  confirmerTitre: (prenom: string) => `Débloquer ${prenom} ?`,
  confirmerTexte: "Tu reverras ses messages et ses commentaires. Débloquer ne remet personne dans ta bande.",
  annuler: "Annuler",
  debloquer: "Débloquer",
  debloquerLu: (prenom: string) => `Débloquer ${prenom}`,
  titre: "Personnes bloquées",
  sousTitre: "Tu ne vois plus leurs messages ni leurs commentaires. Et tu peux changer d'avis quand tu veux.",
  videTitre: "Que des bonnes ondes",
  videTexte:
    "Tu n'as bloqué personne. Si un jour quelqu'un t'embête, « Bloquer » t'attend sur son profil, ses messages et ses commentaires : tu le retrouveras ici.",
  nombre: (n: number) => `${n} personne${n > 1 ? "s" : ""} bloquée${n > 1 ? "s" : ""}`,
  note: "Débloquer quelqu'un ne le remet pas dans ta bande. Et pour l'instant, cette liste reste sur ton téléphone.",
} as const;

export const TEXTES_REGLAGES_BLOQUES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_REGLAGES_BLOQUES>> = { fr: TEXTES_REGLAGES_BLOQUES, en: TEXTES_REGLAGES_BLOQUES_ANGLAIS };
