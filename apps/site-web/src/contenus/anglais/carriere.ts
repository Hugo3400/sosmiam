import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_CANDIDATURE, TEXTES_CARRIERE, TEXTES_OFFRE_CARRIERE } from "~/contenus/carriere";

export const TEXTES_CARRIERE_ANGLAIS: Traduction<typeof TEXTES_CARRIERE> = {
  titreMeta: "Get involved: volunteers and freelancers",
  description:
    "Join SOS Miam: volunteering (moderation, social media) or freelance work (graphic design, video, development), remote, anywhere in France, 18+.",
  sujetMail: "I'd like to join SOS Miam",
  ecrisNous: "Drop us a line",
  types: {
    benevolat: { libelle: "Volunteering", aucuneOffre: "No volunteering roles right now" },
    freelance: { libelle: "Freelance or project work", aucuneOffre: "No freelance or project roles right now" },
  },
  domaines: {
    moderation: "Moderation",
    "reseaux-sociaux": "Social media",
    graphisme: "Graphic design and illustration",
    video: "Video and editing",
    developpement: "Development",
    autre: "Lending a hand",
  },
  enTete: {
    titre: "Get involved!",
    badge: "Join us",
    chapo:
      "SOS Miam helps you find the independent restaurants, bars and patisseries in your neighbourhood, and lends a hand to places with an SOS. Free for the Miamis and for the places, and made with lots of love (and a healthy appetite).",
    franchise: "We're a small team, not a company yet: we're looking for volunteers and freelancers.",
    pourToutes: "For every role",
    pourTous: ["Remote, anywhere in France", "18+", "No internships, apprenticeships or jobs for now"],
    voirOffres: "See the roles",
    espritTitre: "The SOS Miam spirit",
    esprit: [
      { titre: "Neighbourhood first", texte: "We champion independent places, the ones that give a street its flavour." },
      { titre: "The Brigade to the rescue", texte: "When a place sends out an SOS, the Miamis turn up at the table. Real help, never pity." },
      { titre: "Good humour essential", texte: "We're on first-name terms, we laugh a lot, and we look out for each other." },
    ],
  },
  liste: {
    titre: "Open roles",
    filtrer: "Filter the roles",
    toutes: "All",
    nombreOffres: (nombre: number) => (nombre === 1 ? " role" : " roles"),
    affichees: (nombre: number) => (nombre === 1 ? "1 role shown" : `${nombre} roles shown`),
  },
  carte: {
    publiee: (date: string) => ` · posted ${date}`,
    voirOffre: "See the role →",
  },
  etats: {
    vide: { titre: "No roles right now", texte: "Pop back soon, or drop us a line – we read every message, even the ones that aren't about a listed role." },
    filtreVide: "Have a look at the other roles, or drop us a line if you've got an idea in mind.",
    indisponible: { titre: "The roles are having a little nap", texte: "Our server isn't answering right now. Pop back in a moment, or drop us a line." },
    voirToutes: "See all roles",
  },
  formules: {
    titre: "Volunteer or freelancer?",
    chapo: "Two ways to join us, both remote, anywhere in France, 18+.",
    enEchange: "In return",
    benevolat: {
      titre: "Volunteering",
      texte:
        "Moderation, to keep the app welcoming alongside the Brigade, and social media (TikTok, Instagram, Discord). At your own pace, with no minimum hours.",
      recois: [
        "A “Brigade” badge in the app and a role on the Discord",
        "A volunteering certificate",
        "Your name in the SOS Miam credits",
      ],
    },
    freelance: {
      titre: "Freelance or project work",
      texte: "Graphic design and illustration, video and editing, development: one specific project, with a start and an end.",
      recois: ["Paid on a quote basis – no amount shown, you name your rate"],
    },
    pasDOffre: "No role for you, but an idea you're itching to try? ",
    ecrisNousA: (email: string) => `Drop us a line at ${email}`,
  },
};

export const TEXTES_OFFRE_CARRIERE_ANGLAIS: Traduction<typeof TEXTES_OFFRE_CARRIERE> = {
  offre: "Role",
  resumeParDefaut: (type: string, lieu: string) => `${type} at SOS Miam, ${lieu}.`,
  introuvableMeta: "Role not found — SOS Miam",
  accueil: "Home",
  onRecrute: "Get involved",
  toutesLesOffres: "All roles",
  reperes: {
    formule: "Type",
    domaine: "Area",
    ou: "Where",
    age: "Age",
    desDixHuitAns: "18+",
    remuneration: "Pay",
    surDevis: "On a quote basis – you name your rate",
    publieeLe: "Posted",
  },
  jeCandidate: "Apply",
  enQuelquesMots: "The role in a nutshell",
  listes: { missions: "What you'll do", profil: "About you", enEchange: "In return" },
  candidaterChapo: "No need for a perfectly polished cover letter – just tell us who you are and what draws you in.",
  merci: {
    titre: "Thanks, it's on its way!",
    arrivee: (titre: string) => `Your application for “${titre}” has arrived safely.`,
    conservation: "It's kept for 6 months, then deleted. In the meantime, the Brigade sends you a big wave.",
    voirAutres: "See the other roles",
    retourAccueil: "Back to the home page",
  },
  absente: {
    introuvable: {
      titre: "This role has set sail",
      texte: "It may already be filled, or it never existed. If you were in the middle of applying, nothing was sent – have a look at the other roles.",
    },
    indisponible: {
      titre: "The roles are having a little nap",
      texte: "Our server isn't answering right now. Pop back in a moment, or drop us a line.",
    },
    voirOffres: "See the roles",
  },
};

export const TEXTES_CANDIDATURE_ANGLAIS: Traduction<typeof TEXTES_CANDIDATURE> = {
  champs: {
    nom: {
      libelle: "Your first name and surname",
      erreur: "Tell us your name (2 to 80 characters).",
    },
    email: {
      libelle: "Your email",
      exemple: "you@email.fr",
      erreur: "That email address doesn't look right.",
    },
    message: {
      libelle: "Your message",
      aide: "Who you are, what draws you in, what you'd like to do with us (at least 20 characters).",
      erreur: "Write us a message of 20 to 3,000 characters.",
    },
    lien: {
      libelle: "A link to your work",
      aide: "Portfolio, Behance, GitHub, video channel, Instagram account…",
      exemple: "https://myportfolio.fr",
      erreur: "Give an address that starts with https:// (300 characters max).",
    },
    cv: {
      libelle: "Your CV",
      aide: "PDF only, 5 MB max.",
      erreurFormat: "Your CV needs to be a PDF file.",
      erreurPoids: "Your CV is over 5 MB. Make it lighter (export the PDF at “reduced size”) and try again.",
      aRemettre: "For security, your browser forgot the file you chose. Add your CV again.",
    },
    majeur: {
      libelle: "I'm 18 or over",
      erreur: "You need to be 18 or over to apply – tick the box if that's you.",
    },
  },
  facultatif: " (optional)",
  compteur: (longueur: number, maximum: number) => `${longueur} / ${maximum} characters`,
  retirerFichier: "Remove the file",
  piege: "Don't fill in this field",
  conservation: "Your application is kept for 6 months, then deleted. Only the SOS Miam team reads it. ",
  enSavoirPlus: "Find out more",
  envoi: "Sending…",
  envoyer: "Send my application",
  messages: {
    unChamp: "One field needs fixing.",
    plusieursChamps: (nombre: number) => `${nombre} fields need fixing.`,
    champInconnu: "Something's not right – check the form.",
    tropDEnvois: "Easy does it! Too many attempts in a row. Try again in a moment, or email us at bonjour@sosmiam.fr.",
    erreur: "Oops, your application didn't go through. Try again in a moment, or email us at bonjour@sosmiam.fr.",
    tropLourd: "That's too heavy to send: your CV needs to be 5 MB max. Add it again, made lighter.",
    merci: "We read every application – really. If it's a match, we'll write to the address you gave us.",
  },
};
