// Page /accessibilite : ce que l'app et le site font déjà pour l'accessibilité, ce qui est en cours et ce qui est prévu.
// C'est l'« URL des informations d'accessibilité » de la fiche App Store. Aucun audit n'a été fait : n'annoncer aucun
// niveau de conformité (RGAA, WCAG), aucune date, et rien comme acquis qui n'a pas été testé.
// Sources : le code de apps/app-mobile (useReducedMotion, allowFontScaling, accessibilityLabel, vidéos en muet) ;
// pour le site, LienEvitement, root.tsx (lang), styles/app.css (animations) et les deux formulaires.
import { site } from "~/contenus/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const documentAccessibilite: DocumentLegal = {
  titre: "SOS Miam et l'accessibilité",
  description:
    "Ce que l'app et le site SOS Miam font déjà pour l'accessibilité, ce qui est en cours, ce qui est prévu, et comment nous signaler un problème.",
  miseAJour: "8 octobre 2026",
  introduction: [
    "On veut que tout le monde puisse partir à la rescousse d'une table, quelle que soit sa façon d'utiliser un téléphone ou un ordinateur. Cette page dit franchement où on en est : ce qui marche déjà, ce qui est en cours et ce qui est prévu.",
    `En bref : l'app suit déjà ton téléphone quand tu lui demandes de **réduire les animations** ou de **grossir le texte**, et **VoiceOver et TalkBack sont en cours**. Quelque chose te bloque ? Écris-nous à ${lienContact}.`,
  ],
  sections: [
    {
      id: "app",
      titre: "Dans l'app",
      blocs: [
        "Ce qui marche déjà :",
        {
          liste: [
            "**Réduire les animations** : l'app suit ce réglage de ton téléphone. Les cœurs et la bouée qui s'envolent, le cadre du SOS qui clignote, les photos qui glissent toutes seules et la mascotte se calment.",
            "**La taille du texte** : le texte suit la taille de police choisie dans les réglages de ton téléphone. On n'a pas encore vérifié que chaque écran tient avec une très grande police.",
            "**Les vidéos** du fil sont pour l'instant sans son : il n'y a rien à sous-titrer.",
          ],
        },
        "Ce qui est en cours :",
        {
          liste: [
            "**VoiceOver (iPhone) et TalkBack (Android)** : beaucoup de boutons et d'éléments ont déjà un nom lu à voix haute, mais personne n'a encore testé l'app de bout en bout avec ces outils. Certains écrans peuvent donc encore te bloquer : dis-le-nous, ça nous aide à savoir par où commencer.",
          ],
        },
      ],
    },
    {
      id: "prevu",
      titre: "Ce qui est prévu",
      blocs: [
        "Pas de date pour l'instant : on préfère te dire quand c'est fait plutôt que de promettre. Au programme :",
        {
          liste: [
            "VoiceOver et TalkBack sur tous les écrans ;",
            "une mise en page qui tient avec une très grande police ;",
            "plus de contraste pour le texte posé sur les vidéos ;",
            "un mode sombre ;",
            "des sous-titres dès que des vidéos auront de la parole.",
          ],
        },
        "Cette page sera mise à jour à chaque avancée.",
      ],
    },
    {
      id: "site",
      titre: "Sur le site",
      blocs: [
        {
          liste: [
            "Un lien **« Aller au contenu »** apparaît en haut de chaque page quand tu navigues au clavier : pas besoin de traverser le menu à chaque fois.",
            "Les pages sont déclarées en français : les lecteurs d'écran les lisent avec la bonne prononciation.",
            "Si ton appareil demande de **réduire les animations**, le site coupe les siennes.",
            "Les formulaires (« Préviens-moi » et « J'inscris mon lieu ») ont des intitulés visibles. Leurs erreurs sont écrites sous le champ concerné et lues par les lecteurs d'écran, la liste des villes se parcourt au clavier (flèches, Entrée, Échap), et le choix coché reste visible en mode de contraste élevé.",
          ],
        },
        "On a vérifié ces formulaires au clavier et avec des outils de test automatiques, mais pas encore avec un lecteur d'écran de bout en bout, et pas encore sur tout le site.",
      ],
    },
    {
      id: "audit",
      titre: "Pas encore d'audit",
      blocs: [
        "Ni l'app ni le site n'ont encore eu d'audit d'accessibilité. On n'annonce donc aucun niveau de conformité aux référentiels (le RGAA en France, les WCAG à l'international) : on préfère te dire ce qui marche vraiment, et ce qui ne marche pas encore.",
      ],
    },
    {
      id: "contact",
      titre: "Nous signaler un problème",
      blocs: [
        `Un bouton muet, un texte trop petit, un écran impossible à utiliser ? Écris-nous à ${lienContact} : on regarde et on te répond.`,
        "Si tu peux, dis-nous sur quel écran ou quelle page, avec quel appareil et quel outil (VoiceOver, TalkBack, zoom, contraste élevé…) : ça nous aide à corriger plus vite.",
      ],
    },
  ],
};
