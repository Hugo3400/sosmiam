import { LIMITES_CARTE } from "../../../../packages/commun/src/regles/carte-du-lieu.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_EDITEUR_CARTE_ANGLAIS } from "./anglais/editeur-carte.ts";
import { ERREURS_CARTE } from "./carte-du-lieu.ts";

export const EXEMPLE_NOM_PLAT = "Cacio e pepe";

export const TEXTES_EDITEUR_CARTE = {
  meta: {
    titre: (nom: string) => `Ma carte · ${nom}`,
    titreParDefaut: "Ma carte",
    description: "La carte de ton lieu sur SOS Miam.",
  },
  page: "Ma carte",
  chapoGerant: "Tes plats, tes boissons, tes formules et leurs prix : en ligne dès que tu enregistres.",
  chapoEquipe: "La carte du lieu, telle que les gourmands la voient. Seul le gérant la modifie.",
  illisible: "Oups, ta carte ne s'est pas affichée. Recharge la page dans un instant.",
  aide: "Ajoute, range, supprime : rien ne part tant que tu n'appuies pas sur « Enregistrer ma carte ».",
  alcool: "Un plat qui contient de l'alcool est montré avec le message sanitaire sur ta fiche, et caché dans l'app aux personnes qui la visitent sans compte (on ne connaît pas leur âge).",
  apercu: {
    titre: "Aperçu : comme sur ta fiche",
    texte: "Ta carte enregistrée, telle que les gourmands la voient.",
    videGerant: "Rien pour l'instant : enregistre ta carte pour la voir ici.",
    videEquipe: "Pas encore de carte : le gérant la remplit ici.",
  },
  messages: {
    reserveAuGerant: "Seul le gérant modifie la carte.",
    rienChange: "Ce bouton n'a rien changé.",
    effacee: "Ta carte est effacée : plus rien ne s'affiche sur ta fiche.",
    enLigne: "C'est en ligne : ta carte est à jour sur ta fiche !",
    enregistree: "Ta carte est enregistrée : elle s'affichera dès que ta fiche sera publiée.",
    compteLimite: (explication: string) => `${explication} Ton brouillon est toujours là.`,
    envoi: {
      "trop-de-demandes": "Tu as beaucoup enregistré cette dernière heure : réessaie dans un moment. Ton brouillon est toujours là.",
      "reserve-au-gerant": "Seul le gérant modifie la carte.",
      "carte-invalide": "Ta carte ne passe pas : vérifie les noms et les prix.",
    },
    panne: "Oups, ta carte n'a pas été enregistrée. Réessaie dans un instant : ton brouillon est toujours là.",
  },
  gestes: {
    maxSections: `Une carte a ${LIMITES_CARTE.sections} sections au plus.`,
    sectionAjoutee: "Nouvelle section ajoutée, avec un premier plat à remplir.",
    maxPlatsSection: `Une section a ${LIMITES_CARTE.elementsParSection} plats au plus.`,
    maxPlats: `Une carte a ${LIMITES_CARTE.elements} plats au plus.`,
    platAjoute: "Nouveau plat ajouté.",
    sectionRetiree: "Section retirée.",
    sectionMontee: "Section montée.",
    sectionDescendue: "Section descendue.",
    platRetire: "Plat retiré.",
    platMonte: "Plat monté.",
    platDescendu: "Plat descendu.",
  },
  erreurs: ERREURS_CARTE,
  editeur: {
    enregistrer: "Enregistrer ma carte",
    enregistrement: "Enregistrement…",
    compteur: (sections: number, plats: number) => `${sections} / ${LIMITES_CARTE.sections} sections · ${plats} / ${LIMITES_CARTE.elements} plats`,
    vide: "Ta carte est vide. Commence par une section (« Les plats », « À boire »…), puis ajoute tes plats.",
    ajouterSection: "Ajouter une section",
    maxSections: `Ta carte a déjà ${LIMITES_CARTE.sections} sections : c'est le maximum.`,
  },
  section: {
    titre: (numero: number) => `Section ${numero}`,
    plats: (plats: number) => `${plats} / ${LIMITES_CARTE.elementsParSection} plats`,
    libelleTitre: "Titre de la section",
    exempleTitre: "Les plats, À boire, Les desserts…",
    monter: "Monter la section",
    descendre: "Descendre la section",
    supprimer: "Supprimer la section",
    precision: (numero: number, titre: string) => `la section ${numero}${titre ? `, ${titre}` : ""}`,
    vide: "Pas encore de plat ici : la section reste cachée sur ta fiche tant qu'elle est vide.",
    pleine: `Section pleine (${LIMITES_CARTE.elementsParSection} plats) : ajoute une autre section.`,
    cartePleine: `Ta carte est pleine (${LIMITES_CARTE.elements} plats).`,
    ajouterPlat: "Ajouter un plat",
    dans: (precision: string) => `dans ${precision}`,
  },
  plat: {
    titre: (numero: number) => `Plat ${numero}`,
    precision: (numero: number, nom: string) => `le plat ${numero}${nom ? `, ${nom}` : ""}`,
    nom: "Nom",
    prix: "Prix (€)",
    exemplePrix: "12,50",
    unite: "Unité",
    exempleUnite: "le verre, par personne…",
    description: "Description",
    alcool: "Contient de l'alcool",
    monter: "Monter",
    descendre: "Descendre",
    supprimer: "Supprimer",
  },
};

export const TEXTES_EDITEUR_CARTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_EDITEUR_CARTE>> = {
  fr: TEXTES_EDITEUR_CARTE,
  en: TEXTES_EDITEUR_CARTE_ANGLAIS,
};
