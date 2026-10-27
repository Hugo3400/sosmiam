import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_RECHERCHE_COMMUNE_ANGLAIS } from "~/contenus/anglais/recherche-commune";
import { ecrireNomAvecArticle } from "~/fonctions/fondateurs/ecrire-nom-avec-article";
import type { ZoneFondateurs } from "~/types/compte";

export const TEXTES_RECHERCHE_COMMUNE = {
  messages: {
    "commune-inconnue": "On ne trouve pas cette commune : cherche-la par son nom.",
    panne: "Le compteur des places fait une pause : réessaie dans un instant.",
    "trop-court": "Écris au moins 2 lettres du nom de ta commune.",
    introuvable: (recherche: string) => `On ne trouve pas « ${recherche} » : vérifie l'orthographe, ou essaie avec ton code postal.`,
  },
  chercher: "Chercher",
  rechercher: (libelle: string) => `Chercher ${libelle.toLowerCase()}`,
  plusieurs: "Plusieurs communes correspondent : choisis la tienne.",
  exemple: "Lyon, Bron, 69003…",
  suggestions: "Communes proposées",
  aucune: "Aucune commune trouvée.",
  proposees: (nombre: number) => `${nombre} commune${nombre > 1 ? "s" : ""} proposée${nombre > 1 ? "s" : ""}.`,
  places: {
    debut: (zone: ZoneFondateurs) => (zone.type === "departement" ? `Ta commune compte avec ${ecrireNomAvecArticle(zone.nomAvecDe, zone.nom)}` : zone.nom),
    unePlace: (debut: string, libre: boolean) => `${debut}\u00a0: 1\u00a0place, ${libre ? "encore libre" : "déjà prise"}`,
    toutesPrises: (debut: string, places: number) => `${debut}\u00a0: les ${places}\u00a0places sont prises`,
    libres: (debut: string, libres: number, places: number) => `${debut}\u00a0: ${libres > 1 ? `${libres}\u00a0places libres` : "1\u00a0place libre"} sur ${places}`,
  },
};

export const TEXTES_RECHERCHE_COMMUNE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_RECHERCHE_COMMUNE>> = {
  fr: TEXTES_RECHERCHE_COMMUNE,
  en: TEXTES_RECHERCHE_COMMUNE_ANGLAIS,
};
