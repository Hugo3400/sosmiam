// Informations reprises par toutes les pages légales : les changer ici les change partout.
// Éditeur : Hugo, particulier, à titre non professionnel tant que rien n'est vendu (pas encore d'entreprise).
// LCEN : un éditeur non professionnel peut ne pas publier son adresse ni son téléphone ; l'hébergeur détient son identité.
// Tout est gratuit (financement par la pub, voir docs/decisions.md) : dès que de la pub rémunérée est mise en place, il faudra une structure
// (micro-entreprise ou société) et des mentions complètes (adresse, SIRET…).
// Sources de l'hébergeur : registre RIPE (AS207992), à confirmer avec une facture FEELB.

export const site = {
  nom: "SOS Miam",
  adresse: "sosmiam.fr",
  emailContact: "bonjour@sosmiam.fr",
};

export const editeur = {
  nom: "Hugo Rostagno Laurens",
  // Pas d'adresse ni de téléphone publiés : éditeur non professionnel (voir plus haut), identité connue de l'hébergeur
  statut: "particulier, à titre non professionnel",
};

export const hebergeur = {
  nom: "FEELB SARL",
  adresse: "4 quai Jean Moulin, 69001 Lyon, France",
  telephone: "+33 6 67 81 16 81",
};

/** Prestataires qui voient passer des données (à citer dans la politique de confidentialité). */
export const prestataires = {
  reseau: {
    nom: "Cloudflare, Inc.",
    adresse: "101 Townsend Street, San Francisco, CA 94107, États-Unis",
    role: "réseau de diffusion et protection du site (le trafic passe par ses serveurs)",
  },
  messagerie: {
    nom: "FEELB SARL",
    role: "hébergement de la boîte mail bonjour@sosmiam.fr",
  },
};
