import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_KIT_MEDIA } from "~/contenus/kit-media";

export const TEXTES_KIT_MEDIA_ANGLAIS: Traduction<typeof TEXTES_KIT_MEDIA> = {
  meta: { titre: "Your media kit — SOS Miam" },
  visuels: {
    "story-je-suis-ambassadeur": {
      titre: "“I'm an ambassador” story",
      description: "Yellow story, in French: the crest with the “Ambassadeur” ribbon and the title “Je suis ambassadeur SOS Miam” (I'm an SOS Miam ambassador).",
    },
    "post-je-suis-ambassadeur": {
      titre: "“I'm an ambassador” post",
      description: "Yellow post, in French: the crest with the “Ambassadeur” ribbon and the title “Je suis ambassadeur SOS Miam” (I'm an SOS Miam ambassador).",
    },
    "story-sauve-une-table": {
      titre: "“Rescue a table” story",
      description: "Cream story, in French: the hungry mascot and the title “Sauve une table, régale-toi.” (Rescue a table, treat yourself.)",
    },
    "post-sauve-une-table": {
      titre: "“Rescue a table” post",
      description: "Cream post, in French: the hungry mascot and the title “Sauve une table, régale-toi.” (Rescue a table, treat yourself.)",
    },
    "story-tu-as-un-lieu": {
      titre: "“Run a venue?” story",
      description: "Black story, in French: the restaurant, patisserie, bar and things-to-do icons, and the title “Tu as un lieu ? C'est gratuit.” (Run a venue? It's free.)",
    },
    "post-tu-as-un-lieu": {
      titre: "“Run a venue?” post",
      description: "Black post, in French: the restaurant, patisserie, bar and things-to-do icons, and the title “Tu as un lieu ? C'est gratuit.” (Run a venue? It's free.)",
    },
    "story-miam-safe": {
      titre: "“Miam Safe” story",
      description: "Black story, in French: “Bientôt dans l'app” (coming soon to the app), the Captain winking, “Miam Safe” and the phrase “Le Capitaine est là ?” (Is the Captain here?).",
    },
    "post-miam-safe": {
      titre: "“Miam Safe” post",
      description: "Black post, in French: “Bientôt dans l'app” (coming soon to the app), the Captain winking, “Miam Safe” and the phrase “Le Capitaine est là ?” (Is the Captain here?).",
    },
    "logo-fond-clair": {
      titre: "Logo for light backgrounds",
      description: "The SOS Miam logo: “SOS” in black with the lifebuoy as the O, and “Miam” in tomato red.",
    },
    "logo-fond-sombre": { titre: "Logo for dark backgrounds", description: "The SOS Miam logo with “SOS” in cream, for a dark background." },
    "bouee-seule": { titre: "The lifebuoy on its own", description: "The smiling lifebuoy on its own, for really small formats." },
    "mascotte-miam": { titre: "“Yum” mascot", description: "The mascot: the hungry lifebuoy, mouth wide open, on its pale yellow disc." },
    "mascotte-clin": { titre: "“Wink” mascot", description: "The mascot winking and sticking its tongue out, on its pale yellow disc." },
    "mascotte-surprise": { titre: "“Surprised” mascot", description: "The surprised mascot, with round eyes and an O-shaped mouth, on its pale yellow disc." },
    "badge-curieux": { titre: "Taster badge (level 1)", description: "Round cream badge with two big eyes, level 1." },
    "badge-denicheur": { titre: "Gem Hunter badge (level 2)", description: "Round pale yellow badge with a magnifying glass over a heart, level 2." },
    "badge-ambassadeur-de-quartier": {
      titre: "Neighbourhood Ambassador badge (level 3)",
      description: "Round yellow badge with a shop and its striped awning, level 3.",
    },
    "badge-ambassadeur-de-ville": {
      titre: "City Ambassador badge (level 4)",
      description: "Round black badge with yellow buildings and a star, level 4.",
    },
    "ecusson-ambassadeur": { titre: "Ambassador crest", description: "Black and yellow crest: crossed cutlery, the lifebuoy and a red “AMBASSADEUR” ribbon." },
  },
  toutLeKit: "The whole media kit",
  dossiers: {
    visuels: { titre: "Visuals to post", texte: "Stories (1080 × 1920) and posts (1080 × 1350) in French, ready to share as they are." },
    logos: { titre: "The logos", texte: "Transparent background. Leave a margin around the logo at least as wide as the lifebuoy." },
    mascotte: { titre: "The mascot", texte: "The smiling lifebuoy, in three moods. Transparent background." },
    badges: { titre: "The badges", texte: "The programme's four levels and the Ambassador crest. Transparent background." },
  },
  etapes: [
    "Pick an image.",
    "Copy a text.",
    "Post it and tag us (@sos.miam on TikTok, @official.sosmiam on Instagram).",
  ],
  couleurs: [
    { nom: "SOS Yellow", usage: "The colour of SOS Miam: the lifebuoy, backgrounds, buttons." },
    { nom: "Tomato", usage: "“Miam” and the little touches that catch the eye." },
    { nom: "Ink", usage: "Text and outlines." },
    { nom: "Pale yellow", usage: "Soft backgrounds." },
    { nom: "Cream", usage: "Page backgrounds." },
    { nom: "White", usage: "Cards, and text on dark backgrounds." },
  ],
  usagesPolices: ["For headings, in extra bold (800).", "For body text."],
  textes: [
    {
      titre: "I'm an ambassador",
      texte: (lien: string) => `I'm an SOS Miam ambassador! 🎉
I hunt down the independent restaurants, patisseries, bars and things to do that deserve a fuller room, so you can discover them.
SOS Miam is coming soon, all over France: ${lien}
#SOSMiam`,
    },
    {
      titre: "Rescue a table",
      texte: (lien: string) => `A dining room that's too quiet on a Tuesday night, a gem that's just opened: these places would love a few more faces. And you're hungry. 😋
Rescue a table, treat yourself: that's SOS Miam, coming soon all over France.
${lien}
#SOSMiam`,
    },
    {
      titre: "Run a venue?",
      texte: (lien: string) => `Do you run an independent restaurant, patisserie, bar or activity venue? 🍽️
List it on SOS Miam: it's free, with no subscription and no commission.
${lien}
#SOSMiam`,
    },
    {
      titre: "Miam Safe",
      texte: (lien: string) => `Coming soon to the SOS Miam app: Miam Safe. 🛟
Not comfortable somewhere? A helping hand to alert the staff, discreetly. In places that have signed the charter, one phrase at the counter is all it takes, in French: “Le Capitaine est là ?”
${lien}
#SOSMiam`,
    },
    {
      titre: "Your gem",
      texte: (lien: string) => `Your very own gem – the restaurant, bar or patisserie too few people know about: which one is it? Tell me in the comments! 👀
I'm an SOS Miam ambassador: we help people discover independent places, coming soon all over France.
${lien}
#SOSMiam`,
    },
    {
      titre: "Become an ambassador",
      texte: (lien: string) => `Got an eye for great places too? Become an SOS Miam ambassador, 18+: an adventure for enthusiasts, at your own pace. ✨
${lien}
#SOSMiam`,
    },
  ],
  regles: {
    peux: [
      "Share the kit's visuals and texts to talk about SOS Miam, on your socials or with the people around you.",
      "Write your own texts, in your own words.",
      "Say you're an SOS Miam ambassador.",
      "Put the logo on a light background, or its cream version on a dark background, with a margin around it at least as wide as the lifebuoy.",
      "Use the lifebuoy on its own when the logo would be less than 120 px wide.",
      "Talk about a place that gave you something (a meal, a drink…), clearly labelling it “Collaboration commerciale” (a paid or gifted partnership).",
    ],
    peuxPas: [
      "Distort, recolour or redraw the logo, the mascot or the badges.",
      "Pass yourself off as SOS Miam: you speak in your own name, as an ambassador.",
      "Promise anything on behalf of SOS Miam (a discount, a table, a launch date…).",
      "Get paid by a place you feature.",
      "Talk about a place going through a tough time to stir up pity – we talk about it with dignity.",
      "Use someone's photo or video without their permission.",
      "Use the kit for anything other than talking about SOS Miam (selling it, using it for another brand…).",
    ],
  },
  page: {
    retour: "My area",
    titre: "Your media kit",
    introDebut: "Visuals ready to post, texts to copy, our logos and our mascot: everything you need to talk about SOS Miam. Take a look at ",
    lienRegles: "the rules",
    introFin: " before you post, and off you go!",
    commentCaMarche: "How does it work?",
    toutDUnCoup: "The whole kit in one go: images, logos, mascot, badges, texts and rules, in a single file.",
    toutTelecharger: (poids: string | null | undefined) => `Download everything${poids ? ` (ZIP, ${poids})` : " (ZIP)"}`,
    titreTextes: "Texts ready to post",
    texteTextes: "Copy, paste, post: the link and #SOSMiam are already in there. You can also tweak them your way.",
    couleurs: "The colours",
    polices: "The fonts",
    textePolices: "Free – install them if you make your own visuals.",
    regles: "The kit rules",
    texteRegles: "The kit is for talking about SOS Miam, in your own name, as an ambassador. A few rules to keep it fair and friendly for everyone.",
  },
  carte: {
    telecharger: (format: string) => `Download the ${format}`,
    netPartout: "sharp at any size",
  },
  copier: {
    bouton: "Copy",
    copie: "Copied!",
    rate: "Copying didn't work – select the text by hand.",
    leTexte: (titre: string) => `the text “${titre}”`,
    leCode: (nom: string) => `the code for the colour ${nom}`,
  },
  polices: {
    exemple: "Rescue a table, treat yourself.",
    telecharger: "Get it on Google Fonts",
  },
  colonnesRegles: { peux: "You can", peuxPas: "You can't" },
};
