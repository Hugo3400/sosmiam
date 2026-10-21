import { hebergeur, prestataires, site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienEmail = `[${site.emailContact}](mailto:${site.emailContact})`;

export const sectionCandidatures: SectionLegale = {
  id: "candidatures",
  titre: "Ta candidature (page « On recrute »)",
  blocs: [
    "Sur la page [On recrute](/carriere), tu peux candidater à une offre de bénévolat ou de freelance avec un formulaire. Ta candidature arrive dans notre logiciel de gestion, et nulle part ailleurs.",
    {
      liste: [
        "**Ce qu'on garde** : l'offre choisie, ton nom, ton e-mail, ton message, le lien vers ton travail si tu en donnes un, ton CV en PDF si tu en joins un, la date d'envoi et où en est ta candidature (nouvelle, lue, retenue ou non). Ton nom, ton e-mail, ton message et ton lien sont **chiffrés** dans notre base, et ton CV est rangé **chiffré** sur notre serveur, à part. Pour limiter les envois à quelques-uns par jour, on garde aussi une empreinte de ton e-mail : un code tiré de ton adresse, qui ne permet pas de la retrouver. Pour l'âge, tu coches simplement « J'ai 18 ans ou plus » : on ne te demande pas ta date de naissance.",
        "**Pourquoi** : étudier ta candidature, et t'écrire si on avance ensemble.",
        "**Base légale** : les mesures précontractuelles prises à ta demande (article 6.1.b du RGPD) : tu nous proposes de rejoindre SOS Miam, comme bénévole ou en freelance, et ces informations sont nécessaires pour étudier ta proposition.",
        "**Qui la voit** : seulement l'éditeur de SOS Miam, dans notre logiciel de gestion (protégé par un mot de passe et un code à 6 chiffres). Ton CV ne s'ouvre que là, et personne d'autre ne lit ta candidature.",
        `**Aucun tiers** : ta candidature n'est confiée à aucun autre service : pas de plateforme de recrutement, pas d'outil de tri automatique, aucun partage, aucune revente. Comme tout le site, elle passe seulement par nos prestataires techniques habituels, qui travaillent pour notre compte : ${prestataires.reseau.nom} au passage (voir « Cloudflare, qui protège le site ») et ${hebergeur.nom}, qui loue notre serveur, situé en France.`,
        "**Combien de temps** : **6 mois après son envoi**, ta candidature est effacée automatiquement, CV compris, quelle que soit la réponse. Une copie peut encore dormir dans nos sauvegardes chiffrées, **30 jours au plus**, puis elle disparaît aussi.",
        "**Ton adresse IP** : comme pour les autres formulaires, elle sert seulement à limiter le nombre d'envois, et n'est jamais enregistrée avec ta candidature.",
        `**Tes droits** : tu peux consulter ta candidature, la corriger, la retirer ou la faire effacer avant la fin des 6 mois, d'un simple mail à ${lienEmail} (voir « [Tes droits](#droits) »).`,
        "**Obligatoire ?** Ton nom, ton e-mail, ton message et la case « J'ai 18 ans ou plus » : sans eux, on ne peut ni étudier ta candidature ni te répondre. Le lien et le CV sont facultatifs.",
      ],
    },
    "Pas besoin de mettre dans ton CV ta photo, ta date de naissance, ta situation de famille ou ton numéro de sécurité sociale : on n'en a pas l'usage.",
  ],
};
