import { editeur as editeurFrancais, prestataires as prestatairesFrancais } from "~/contenus/legal/informations-legales";

export { hebergeur, site } from "~/contenus/legal/informations-legales";

export const editeur = {
  ...editeurFrancais,
  statut: "private individual, acting in a non-professional capacity",
};

export const prestataires = {
  reseau: {
    ...prestatairesFrancais.reseau,
    adresse: "101 Townsend Street, San Francisco, CA 94107, United States",
    role: "content delivery network and protection for the site (traffic passes through its servers)",
  },
  messagerie: {
    ...prestatairesFrancais.messagerie,
    role: "hosting of the bonjour@sosmiam.fr mailbox",
  },
};
