import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import { site } from "~/contenus/legal/informations-legales";
import { ADRESSE_GERER_COOKIES, type TEXTES_PAGES_LEGALES } from "~/contenus/legal/liens-legaux";
import { liensPublics, RESEAUX_SOCIAUX } from "~/contenus/liens-publics";
import type { GroupePiedDePage, LienPiedDePage, TEXTES_PIED_DE_PAGE } from "~/contenus/liens-pied-de-page";
import { ecrireCheminLangue } from "~/fonctions/langue/ecrire-chemin-langue";
import { listerPagesLegales } from "~/fonctions/legal/lister-pages-legales";

type TextesPied = Traduction<typeof TEXTES_PIED_DE_PAGE>;
type TextesLegaux = Traduction<typeof TEXTES_PAGES_LEGALES>;

export function construireGroupesPiedDePage(textes: TextesPied, legaux: TextesLegaux, langue: Langue): GroupePiedDePage[] {
  const L = textes.liens;
  const ici = (texte: string, adresse: string, siteDuLien: LienPiedDePage["site"] = "principal"): LienPiedDePage => ({
    texte,
    adresse: ecrireCheminLangue(adresse, langue),
    site: siteDuLien,
  });
  const reseaux = liensPublics
    .filter((lien) => RESEAUX_SOCIAUX.includes(lien.reseau))
    .map((lien) => ({ texte: textes.reseaux[lien.reseau as keyof TextesPied["reseaux"]] ?? lien.nom, adresse: lien.adresse, site: "externe" as const }));
  return [
    {
      titre: textes.groupes.site,
      liens: [
        ici(L.accueil, "/"),
        ici(L.faq, "/faq"),
        ici(L.actus, "/actus"),
        ici(L.inscrireLieu, "/inscrire-mon-lieu"),
        ici(L.carriere, "/carriere"),
        ici(L.securite, "/securite"),
        ici(L.apercus, "/preview"),
        ici(L.espacePro, "/bienvenue", "pro"),
        ici(L.monCompte, "/mon-compte"),
        { texte: L.contact, adresse: `mailto:${site.emailContact}`, site: "externe" },
      ],
    },
    {
      titre: textes.groupes.ambassadeurs,
      liens: [ici(L.programme, "/programme", "ambassadeur"), ici(L.devenirAmbassadeur, "/inscription", "ambassadeur"), ici(L.seConnecter, "/connexion", "ambassadeur")],
    },
    { titre: textes.groupes.suivre, liens: [...reseaux, ici(L.tousNosLiens, "/liens")] },
    {
      titre: textes.groupes.legal,
      liens: [
        ...listerPagesLegales(legaux, langue).map((page) => ({ texte: page.texte, adresse: page.href, site: "principal" as const })),
        { texte: legaux.gererCookies, adresse: ecrireCheminLangue(ADRESSE_GERER_COOKIES, langue), site: "principal", reglagesCookies: true },
      ],
    },
  ];
}
