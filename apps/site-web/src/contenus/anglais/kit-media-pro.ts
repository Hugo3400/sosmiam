import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_KIT_MEDIA_PRO } from "~/contenus/kit-media-pro";

export const TEXTES_KIT_MEDIA_PRO_ANGLAIS: Traduction<typeof TEXTES_KIT_MEDIA_PRO> = {
  meta: { titre: "Your pro media kit — SOS Miam" },
  page: {
    retour: "My area",
    titre: "Your pro media kit",
    introDebut: "Everything you need to introduce SOS Miam to local venues as a Certified Ambassador: a poster, a flyer, a few words to say at the counter and a template email. Take a look at ",
    lienRegles: "the rules",
    introFin: " before you head out, and enjoy your rounds!",
    commentTEnServir: "How to use it",
    toutDUnCoup: "The whole pro kit in one go: the poster, the flyer, the texts and the rules, in a single file.",
    toutTelecharger: (poids: string | null | undefined) => `Download everything${poids ? ` (ZIP, ${poids})` : " (ZIP)"}`,
    titreFichiers: "The poster, the flyer and the Miam Safe sheet",
    texteFichiers: "As PDFs to print, as PNGs to show on screen. They're in French, for the venues.",
    titreCarteDeVisite: "Your business card",
    texteCarteDeVisite: "With your first name and your city, and a QR code to “List my venue”: leave it at the counter.",
    ouvrirCarteDeVisite: "Open my business card",
    titreTextes: "What to say",
    texteTextes: "Copy it, adapt it in your own words, and off you go. Anything in square brackets needs replacing.",
    titreRegles: "The pro kit rules",
    texteRegles: "You speak in your own name, as a Certified Ambassador: a few rules to keep things fair for the venues, and for you.",
  },
  cartes: {
    affiche: {
      titre: "The A4 poster",
      texte: "“Ton lieu sur SOS Miam, c'est gratuit” (Your venue on SOS Miam – it's free), with a QR code to “List my venue”. For the counter, the window, or to leave with the venue.",
    },
    flyer: {
      titre: "The double-sided A6 flyer",
      texte: "On the front, what SOS Miam brings a venue; on the back, how to sign up – free, with no subscription.",
    },
    miamSafe: {
      titre: "The Miam Safe sheet",
      texte: "For a venue already on SOS Miam: the commitments of the Miam Safe charter, and where its manager signs it. Coming soon to the app.",
    },
  },
  visuels: {
    "affiche-a4": {
      titre: "A4 poster “Ton lieu sur SOS Miam, c'est gratuit”",
      description: "Yellow poster, in French: the logo, the mascot, the title “Ton lieu sur SOS Miam, c'est gratuit” (Your venue on SOS Miam – it's free), four benefits for a venue and a big QR code to “List my venue”.",
    },
    "flyer-a6-recto": {
      titre: "A6 flyer, front",
      description: "Cream front, in French: “Ton lieu mérite plus de monde” (Your venue deserves a fuller room) and what SOS Miam brings a venue (a listing, verified reviews, tonight's SOS, statistics, free).",
    },
    "flyer-a6-verso": {
      titre: "A6 flyer, back",
      description: "Yellow back, in French: “Inscris ton lieu en 3 étapes” (List your venue in 3 steps), free and with no subscription, with the QR code to “List my venue”.",
    },
    "flyer-a6": {
      titre: "Double-sided A6 flyer",
      description: "The flyer in A6 format: page 1 is the front, page 2 the back. For a printer or A6 paper.",
    },
    "flyer-a6-planche-a4": {
      titre: "A6 flyer, sheet of 4 on A4",
      description: "Four flyers on one A4 sheet, with cutting lines: page 1 the fronts, page 2 the backs. Print at home double-sided, then cut into four.",
    },
    "affiche-miam-safe-a4": {
      titre: "A4 “Miam Safe” sheet",
      description: "Cream sheet, in French: “Miam Safe”, coming soon to the app, the charter's four commitments for a venue's staff, and a QR code to the pro area to sign it.",
    },
  },
  toutLeKit: "The whole pro media kit",
  fichiers: {
    telecharger: (fichier: string) => `Download ${fichier}`,
    pngRecto: "the PNG of the front",
    pngVerso: "the PNG of the back",
    png: "the PNG",
    planche: "the PDF, 4 per A4 sheet",
    pdf: "the PDF to print",
  },
  objet: "Subject: ",
  objetDuMail: "the subject line of the template email",
  conseils: "Our tips",
  motComptoir: {
    titre: "Your 30-second pitch, at the counter",
    texte: `Hi! I'm [your first name], an SOS Miam ambassador. I'll only take 30 seconds, not one more, promise.
SOS Miam helps local people discover independent places like yours. You can have your own page there, verified reviews left only by real customers, and send out an SOS on evenings when your dining room is quiet.
And it's free: no subscription, no commission.
I'll leave you this flyer – the QR code takes you to the sign-up page, and it only takes a few minutes. Have a good service!`,
    conseils: [
      "Drop by at a quiet moment: never in the middle of a rush.",
      "Ask to speak to the person who runs the place first, and smile: you're there to help, not to sell something.",
      "If you're speaking French, feel free to use “vous” if that's more natural with the person in front of you.",
      "A “no, thanks”? Say thank you, leave the flyer if they'd like it, and head off with a smile: the door stays open.",
      "A question you can't answer? Just say so and give them bonjour@sosmiam.fr.",
    ],
  },
  mailType: {
    titre: "The template email",
    objet: "Your venue on SOS Miam – it's free",
    texte: (lien: string, email: string) => `Hello [the person's first name, or the venue's name],

My name's [your first name] and I'm a Certified SOS Miam Ambassador [if you're from an organisation: for [your organisation's name]]. I really like [the venue's name], and I think more people should know about it.

SOS Miam helps people discover independent restaurants, patisseries, bars and things to do. For your venue, that means:
- a listing with your photos, your opening hours and your signature dish;
- verified reviews: only customers who've actually paid at your place can leave a rating;
- tonight's SOS: when you've got free tables, local people who've turned on alerts get notified;
- your statistics: views, rescues, confirmed visits.

It's all free: no subscription, no commission, no commitment. SOS Miam is funded by advertising, always labelled and with no effect on rankings.

To list your venue: ${lien}
The team reads every request, creates the listing and replies by email.

Any questions? Reply to me, or write to the team: ${email}

Have a lovely day,
[your first name]
Certified SOS Miam Ambassador`,
    conseils: [
      "Replace everything in square brackets, and say in one sentence what you love about the place: that's what makes people want to read on.",
      "Only write to the address the venue displays itself (its website, its window, its socials), and only once: no endless follow-ups.",
    ],
  },
  regles: {
    peux: [
      "Print the poster and the flyers as often as you like, and leave them with venues that are happy to have them.",
      "Say the counter pitch and send the template email, in your own words if you prefer.",
      "Say you're a Certified SOS Miam Ambassador, and for which organisation if you represent one.",
    ],
    peuxPas: [
      "Get paid by a venue, in any way at all. If a venue gives you something (a meal, a drink…) and you talk about it, clearly label it “Collaboration commerciale” (a paid or gifted partnership).",
      "Promise anything on behalf of SOS Miam: customers, a place in the rankings, a date, a feature.",
      "Ask a venue for anything in return for signing up: it's free and it stays free.",
      "Push: a venue that says no has every right to say no.",
      "Talk about a venue going through a tough time to stir up pity – we talk about it with dignity.",
      "Change the poster, the flyer, the logo or the mascot, or use them for anything other than introducing SOS Miam.",
      "Present Miam Safe as protection or a safety guarantee: it's a helping hand to alert the venue's staff, nothing more.",
    ],
  },
  usage: [
    "Print the poster (affiche-a4.pdf) and a few flyers (flyer-a6-planche-a4.pdf: 4 flyers per A4 sheet, double-sided, to cut along the lines).",
    "Drop into a venue at a quiet moment, say the counter pitch and leave a flyer, or the poster if the venue wants to put it up.",
    "No time to drop by? Send the template email.",
    "Is the venue already on SOS Miam? Show them the Miam Safe sheet (affiche-miam-safe-a4.pdf): the manager signs the charter in their pro area.",
    "For a printer: flyer-a6.pdf (A6, front on page 1, back on page 2). The PNGs are for sharing the poster and the flyer on screen.",
  ],
  carteDeVisite: {
    meta: "My business card — SOS Miam",
    retour: "My pro media kit",
    titre: "My business card",
    intro: "To leave at the counter when you introduce SOS Miam to a venue: your first name, your city and a QR code to “List my venue”. The card is in French, for the venues.",
    format: "85 × 55 mm, double-sided: choose “Save as PDF”, then send the file to an online printer.",
    compte: "Your first name and city come from your account: change them in “My account” if needed.",
    imprimer: "Print my card",
  },
};
