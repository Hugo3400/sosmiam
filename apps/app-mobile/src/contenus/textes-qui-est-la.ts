export const TEXTES_QUI_EST_LA = {
  titre: "Qui est là ?",
  intro: (ville: string) =>
    `Les Miamis de ${ville} qui ont choisi d'apparaître ici. Fais coucou : si c'est réciproque, vous pouvez vous ajouter à vos bandes. Sinon, rien de plus : pas de notification, pas de pression.`,
  montrer: "Me montrer ici",
  visible: "Les Miamis de ta ville te voient ici (pseudo et avatar).",
  invisible: "Tu es invisible ici, et tu ne peux pas faire coucou.",
  mutuelTitre: (pseudo: string) => `@${pseudo} et toi, vous vous êtes fait coucou !`,
  mutuelEnvies: (envies: string[]) =>
    envies.length === 0 ? "De quoi papoter : un coucou, c'est déjà un début." : `Vous avez ${envies.length > 1 ? `${envies.length} envies` : "une envie"} en commun : ${envies.join(", ")}.`,
  ajouter: "Ajouter à ma bande",
  demandeEnvoyee: "Demande envoyée",
  plusTard: "Plus tard",
  coucou: "Coucou",
  coucouEnvoye: "Coucou envoyé",
  pote: "Pote",
  aFaitCoucou: "T'a fait coucou",
  dansTaBande: "Dans ta bande",
  ambassadeur: "Du programme Ambassadeurs",
  nouveau: "Vient d'arriver en ville",
  rescousses: (n: number) => (n > 1 ? `${n} rescousses` : `${n} rescousse`),
  organise: (titre: string) => `organise ${titre}`,
  enCommun: (envies: string[]) => (envies.length === 1 ? `${envies[0]} en commun` : `${envies.length} envies en commun`),
  vide: "Personne pour l'instant. Reviens à l'heure du déjeuner, c'est là que ça bouge !",
  invisiblePourCoucou: "Montre-toi d'abord ici pour faire coucou : c'est donnant-donnant.",
  coucouParti: (prenom: string) => `👋 Coucou envoyé à ${prenom}.`,
  demandePartie: (prenom: string) => `🤝 Demande envoyée à ${prenom} pour rejoindre ta bande.`,
} as const;

export const REFUS_LIMITATION_QUI_EST_LA = {
  coucou: "Ton compte est limité : les coucous attendront la fin de la limitation.",
  apparaitre: "Ton compte est limité : apparaître dans « Qui est là ? » attendra la fin de la limitation.",
} as const;
