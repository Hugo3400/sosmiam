import { accorder } from "../../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_PROGRAMME_AMBASSADEUR } from "~/contenus/programme-ambassadeur";

export const TEXTES_PROGRAMME_AMBASSADEUR_ANGLAIS: Traduction<typeof TEXTES_PROGRAMME_AMBASSADEUR> = {
  meta: {
    titre: "Ambassador programme",
    description: "Share the little independent places near you, all over France: 18+, free and at your own pace. Become an SOS Miam ambassador.",
  },
  haut: {
    badge: "🎖️ Ambassador programme · 18+",
    titreDebut: "Become an ",
    titreMarque: "ambassador",
    titreFin: " for SOS Miam",
    chapo: "Know a little restaurant, bar or patisserie that deserves a fuller room? Help us get the word out. It's free, you go at your own pace, and it's all over France.",
    note: "18+. The SOS Miam team checks every sign-up by hand.",
  },
  boutons: { creer: "Create my account", connexion: "I already have an account" },
  gestes: {
    titre: "What's an ambassador?",
    chapo: "Someone who loves good little places and helps SOS Miam get them discovered. In practice, you can:",
    liste: [
      { titre: "Spot the gems", texte: "You find the little places worth a detour, and suggest them to us from your area." },
      { titre: "Keep pages up to date", texte: "New opening hours, a new dish, closed for the holidays? You help us keep the info right." },
      { titre: "Approve and create selections", texte: "Lists of tried-and-tested places, like “The best cafés in the neighbourhood”." },
      {
        titre: "Spread the word",
        texte: "To your friends, your family, on your socials: the media kit (images and texts ready to post) helps you do it well.",
      },
    ],
  },
  gains: {
    titre: "What's in it for you",
    chapo: "No money – it's an adventure for enthusiasts. But there's still plenty to be proud of:",
    liste: [
      { titre: "A badge for every level", texte: "Taster, Gem Hunter, Neighbourhood Ambassador, City Ambassador: each level has its own." },
      { titre: "“Spotted by you”", texte: "A place you suggested joins SOS Miam? Its page shows “Spotted by” and your first name. Very classy." },
      { titre: "Points", texte: "They help you climb the levels. The details are just below." },
    ],
    finDebut: "And if you become one of the ",
    finLien: "founders of your city",
    finSuite: ", there's even more.",
  },
  niveaux: {
    titre: "The 4 levels",
    chapo: "Everyone starts as a Taster. After that, your points take you up.",
    titreBareme: "What earns you points",
    bareme: {
      visite: "A paid visit to a Verified ✓ place (one with an SOS Miam account), confirmed in the app",
      visiteSos: "A visit during an SOS, when a place calls for help to fill its dining room",
      avisPhoto: "A review with a photo",
      proposerLieu: "A place you suggest that joins SOS Miam",
      corrigerFiche: "A correction to a place's page",
      premierSauveteur: "The very first rescue for a place that's just joined",
      rescousse: "A rescue: your helping hand for a Verified place (you get 3 a week)",
    },
    unitePoints: (points: number) => ` ${accorder(points, "en", "point", "points")}`,
    defis: "And every challenge you complete earns its own points.",
    noteApp:
      "The app isn't out yet, so most points will arrive with it. Until then, everyone starts as a Taster. The one exception: a place you suggest from your area that joins SOS Miam already earns you its 30 points.",
  },
  etapes: {
    titre: "How it works",
    chapo: "Three steps and you're off.",
    liste: [
      {
        titre: "Create your account",
        texte: "With your email and a password, 18+. Then click the link we email you, to confirm the address really is yours.",
      },
      { titre: "The team approves it", texte: "We read every sign-up ourselves, no bots. It can take a little while – your area tells you where things stand." },
      { titre: "Your area opens", texte: "Images and texts to post, places to suggest, missions and messages from the team, and your application to become a founder." },
    ],
  },
  fondateurs: {
    titre: "Your city's founders",
    chapo: (total: number) =>
      `In every city, ambassadors are getting things started with us: ${total} spots all over France, depending on the size of your city. Once your account is approved, you apply from your area for your city (or your département) while spots last.`,
    ruban: "FOUNDER",
    titreCadeaux: "If you're chosen, you get:",
    cadeaux: [
      "A numbered card, “Founder #3 in Lyon · #147 in France”: download and share it straight away, and a real card will be posted to you later.",
      "Your first name in the window, on a “Spotted by” sticker.",
      "Founder badges.",
      "Early access to the app, with a direct line to the team.",
    ],
    rencontre:
      "To get to know each other: a video call of about 30 minutes with your city's founders (your region's, if you're the founder for your département), and a one-to-one if needed.",
    titreVille: "What about your city?",
    texteVille: "Type the name of your town or your postcode: we'll tell you how many spots are left.",
    libelleVille: "Your city",
    boutonVille: "See the spots",
  },
  tableau: {
    legende: "Founding spots by the size of your city (INSEE population figures)",
    colonneVille: "Your city",
    colonnePlaces: "Spots",
    tailles: [
      { taille: "Over 500,000 people", villes: "Paris, Marseille, Lyon and Toulouse" },
      { taille: "200,000 to 500,000 people", villes: "Nice, Nantes, Montpellier, Strasbourg, Bordeaux, Lille and Rennes" },
      { taille: "100,000 to 200,000 people", villes: "31 cities, from Toulon to Nancy" },
      { taille: "50,000 to 100,000 people", villes: "93 cities, from Avignon to Bondy" },
      { taille: "Under 50,000 people", villes: "1 spot per département, shared by its towns, and 1 per overseas territory" },
    ],
    total: "In total, all over France",
  },
  certifie: {
    titre: "Certified Ambassador",
    chapo: "Already helping the places near you? A title of its own, on top of your level, to go further with them.",
    qui: "An ambassador who loves helping places, a business (restaurant, shop…) or an organisation (association, town hall, tourist office, school…). An organisation is represented by one person, with their own account, 18+: “Marie, for the association Les Gourmands du 11e”.",
    devenir: "You apply from your area once your account is approved, or the team invites you. The team makes the choice.",
    avantages: [
      "The “Certified Ambassador ✓” badge on your profile and on the pages of the places you've helped, with your first name (and your organisation, if you have one).",
      "Missions at partner venues, handed out by the team.",
      "A pro media kit to introduce SOS Miam to venues: a poster, a flyer, a 30-second pitch and a template email.",
      "Coming soon with the pro area: contact with venues through SOS Miam messages, without showing any address or number.",
    ],
    regle: "Never paid by a venue, like every ambassador. If a venue gives you something, you label it “Collaboration commerciale” (a paid or gifted partnership).",
    ruban: "CERTIFIED",
    titreQui: "Who's it for?",
    titreDevenir: "How do you become one?",
    titreAvantages: "What you get on top",
    titreRegle: "The golden rule: ",
  },
  questions: {
    titre: "Your questions",
    chapo: "You're probably wondering about one of these.",
    liste: {
      "question-paye": {
        question: "Is it paid?",
        reponse: [
          "No. It's an adventure for enthusiasts: an ambassador is paid neither by SOS Miam nor by the places they feature. And if a place gives you something, say so clearly in your post: “Collaboration commerciale” (a paid or gifted partnership).",
        ],
      },
      "question-temps": {
        question: "How much time does it take?",
        reponse: ["As much as you like. No set hours, no targets – you go at your own pace."],
      },
      "question-influenceur": {
        question: "Do I need to be an influencer?",
        reponse: ["Not at all! No need for thousands of followers. You just need to love good places and want to share them."],
      },
      "question-ou": {
        question: "Where does it happen?",
        reponse: ["All over France. Wherever you live, there's bound to be a gem worth sharing."],
      },
      "question-ville-fondateur": {
        question: "Which city do I apply for?",
        reponse: [
          "The city you live in. If your town has fewer than 50,000 people, you apply for your département (or your overseas territory). Then the team makes the choice.",
        ],
      },
      "question-ville-complete": {
        question: "What if my city's already full?",
        reponse: [
          "Applications there close on their own, and reopen as soon as a spot frees up. There's no waiting list, so have a look from your area every now and then.",
        ],
      },
      "question-demenagement": {
        question: "What if I move?",
        reponse: [
          "You keep your founder title as a keepsake, but your spot in your old city frees up for someone else. Your number is never given out again – it stays yours.",
        ],
      },
      "question-pas-fondateur": {
        question: "What if I'm not chosen as a founder?",
        reponse: ["No worries: you're still an ambassador, and you climb the levels like everyone else. And you can apply again whenever you like."],
      },
      "question-app": {
        question: "Is the app out yet?",
        reponse: ["Not yet – it's in the works. Most points will arrive with it. Until then, everyone starts as a Taster."],
      },
      "question-arreter": {
        question: "What if I want to stop?",
        reponse: ["Delete your account whenever you like, from “My account” in your area. No hard feelings!"],
      },
    },
  },
  appel: {
    titre: "Ready to make your neighbourhood shine?",
    chapo: "Create your account: the team approves it, then your area opens.",
    note: "18+ · free · no set hours, no targets",
  },
};
