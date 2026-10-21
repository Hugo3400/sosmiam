import { hebergeur, prestataires, site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienEmail = `[${site.emailContact}](mailto:${site.emailContact})`;

export const sectionChasseAuxBugs: SectionLegale = {
  id: "chasse-aux-bugs",
  titre: "Ton signalement de faille (page « Chasse aux bugs »)",
  blocs: [
    "Sur la page [Chasse aux bugs](/securite), tu peux nous signaler une faille de sécurité avec un formulaire. Ton signalement arrive dans notre logiciel de gestion, et nulle part ailleurs.",
    {
      liste: [
        "**Ce qu'on garde** : ton nom ou ton pseudo, ton e-mail, l'endroit de la faille (le site, les espaces, l'API ou l'app), le titre et la description de ton signalement, le lien que tu donnes si tu en donnes un, tes captures d'écran si tu en joins, et le nom à afficher au tableau d'honneur si tu le demandes. On garde aussi la date d'envoi et où en est ton signalement. Ton signalement est gardé **chiffré** dans notre base. Tes captures sont vérifiées et nettoyées de leurs métadonnées (comme le lieu de prise de vue ou le modèle de l'appareil), puis rangées **chiffrées** sur notre serveur, à part. Pour l'âge, tu coches simplement « J'ai 18 ans ou plus » : on ne te demande pas ta date de naissance.",
        "**Pourquoi** : corriger la faille, te répondre, et te remercier : le badge « Chasseur de bugs » sur le compte SOS Miam qui a la même adresse e-mail (si elle y est confirmée), ton nom au tableau d'honneur si tu le veux, une attestation et, pour certaines failles, une prime.",
        "**Base légale** : notre intérêt légitime à protéger SOS Miam et ses utilisateurs (article 6.1.f du RGPD) : sans ces informations, on ne pourrait ni comprendre la faille, ni la corriger, ni te répondre.",
        `**Qui le voit** : seulement l'éditeur de SOS Miam, dans notre logiciel de gestion (protégé par un mot de passe et un code à 6 chiffres) ; tes captures ne s'ouvrent que là. Comme tout le site, ton signalement passe par nos prestataires techniques habituels, qui travaillent pour notre compte : ${prestataires.reseau.nom} au passage (voir « Cloudflare, qui protège le site ») et ${hebergeur.nom}, qui loue notre serveur, situé en France. Aucune revente, aucun partage. Seul le nom que tu choisis pour le tableau d'honneur est public, avec un mois.`,
        `**Combien de temps** : ton signalement est effacé automatiquement **2 ans après sa clôture** (faille corrigée, ou signalement non retenu), captures comprises. Une copie peut encore dormir dans nos sauvegardes chiffrées, **30 jours au plus**, puis elle disparaît aussi. Ton nom reste au tableau d'honneur tant que tu le veux : un simple mail à ${lienEmail} suffit pour le retirer. Le badge, lui, reste sur ton compte, comme tes autres badges.`,
        "**Ton adresse IP** : comme pour les autres formulaires, elle sert seulement à limiter le nombre d'envois, et n'est jamais enregistrée avec ton signalement.",
        `**Tes droits** : tu peux consulter ton signalement, le corriger ou le faire effacer, retirer ton nom du tableau d'honneur, ou t'opposer à ce traitement, d'un simple mail à ${lienEmail} (voir « [Tes droits](#droits) »).`,
        "**Obligatoire ?** Ton nom ou ton pseudo, ton e-mail, l'endroit, le titre, la description et les deux cases (« J'ai 18 ans ou plus » et « J'ai lu les règles ») : sans eux, on ne peut ni comprendre la faille ni te répondre. Le lien, les captures et le tableau d'honneur sont facultatifs.",
      ],
    },
    "Si tu tombes par hasard sur les données de quelqu'un d'autre pendant ta recherche, ne les garde pas et ne les mets pas dans ton signalement : dis-nous seulement ce que tu as vu, on s'occupe du reste.",
  ],
};
