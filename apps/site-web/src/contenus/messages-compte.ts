import { accorder } from "../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_MESSAGES_COMPTE_ANGLAIS } from "./anglais/messages-compte.ts";

export const TEXTES_MESSAGES_COMPTE = {
  occupe: "Il y a beaucoup de monde en ce moment : réessaie dans un instant.",
  panne: "Oups, ça n'a pas marché. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.",
  tropDEssais: (attente: string) => `Trop d'essais : réessaie dans ${attente}.`,
  attente: {
    quelquesMinutes: "quelques minutes",
    minutes: (nombre: number) => `${nombre} ${accorder(nombre, "fr", "minute", "minutes")}`,
    heures: (nombre: number) => `${nombre} ${accorder(nombre, "fr", "heure", "heures")}`,
    heuresEtMinutes: (heures: string, minutes: string) => `${heures} et ${minutes}`,
  },
  prenom: "Donne ton prénom ou un surnom (40 caractères au plus).",
  prenomRefuse: "Ce prénom ne passe pas chez nous : choisis un autre prénom ou surnom.",
  email: "Cette adresse e-mail ne semble pas valide.",
  motDePasse: "Ton mot de passe doit faire au moins 12 caractères (et 128 au plus).",
  motDePasseRefuse:
    "Ce mot de passe est trop facile à deviner (trop courant, une suite, une répétition, ton e-mail…), ou il n'a que des chiffres (il en faut alors 16) : choisis-en un autre. Une petite phrase marche très bien.",
  dateNaissance: "Indique ta date de naissance (jour, mois et année).",
  ville: "Indique ta ville (2 à 80 caractères).",
  quartier: "Le quartier fait 80 caractères au plus.",
  cgu: "Pour créer ton compte, coche la case qui accepte les conditions d'utilisation.",
  motDePasseConfirmer: "Indique ton mot de passe pour confirmer.",
  motDePasseIncorrect: "Ce n'est pas ton mot de passe.",
  jeton: "Colle le code reçu par mail : la suite de lettres et de chiffres après « jeton= ».",
};

export const TEXTES_MESSAGES_COMPTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MESSAGES_COMPTE>> = {
  fr: TEXTES_MESSAGES_COMPTE,
  en: TEXTES_MESSAGES_COMPTE_ANGLAIS,
};
