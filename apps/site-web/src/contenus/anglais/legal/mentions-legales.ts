import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import { editeur, hebergeur, prestataires, site } from "~/contenus/anglais/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienEmail = `[${site.emailContact}](mailto:${site.emailContact})`;

export const documentMentionsLegalesAnglais: DocumentLegal = {
  titre: "Legal notice",
  description:
    "Who publishes SOS Miam, who hosts it, and how to contact us or report illegal content: the full legal notice for the sosmiam.fr website.",
  miseAJour: "27 October 2026",
  introduction: [
    "Who's behind SOS Miam, who hosts the site and how to reach us. It's the most serious page on the site, but we've made sure it's still easy to digest.",
    `This legal notice applies to the **${site.adresse}** website and its subdomains.`,
  ],
  enBref: [
    {
      liste: [
        `**Who publishes SOS Miam**: ${editeur.nom}, ${editeur.statut}. To get in touch: ${lienEmail}.`,
        `**Who hosts it**: ${hebergeur.nom}, in France. ${prestataires.reseau.nom} delivers and protects the site.`,
        "**Everything is free**, nothing is sold and there's no advertising at present.",
        "**Think some content is illegal?** Report it by email – [here's how](#signalement).",
      ],
    },
  ],
  sections: [
    {
      id: "editeur",
      titre: "Publisher of the site",
      blocs: [
        `The ${site.adresse} website is published by:`,
        {
          liste: [
            `**Name**: ${editeur.nom}`,
            `**Status**: ${editeur.statut}`,
            `**Email address**: ${lienEmail}`,
          ],
        },
        `${site.nom} is not a business. It's a personal project, run with no commercial activity and no income.`,
        "As French Law No. 2004-575 of 21 June 2004 on confidence in the digital economy (LCEN) allows for people who publish a website in a non-professional capacity, the publisher's postal address and telephone number are not published. The publisher's personal identification details have been provided to the site's hosting provider (see below), which holds them.",
      ],
    },
    {
      id: "directeur-publication",
      titre: "Director of publication",
      blocs: [
        `The director of publication is **${editeur.nom}**, who can be contacted at ${lienEmail}.`,
      ],
    },
    {
      id: "hebergeur",
      titre: "Hosting provider",
      blocs: [
        "The site is hosted in France by:",
        {
          liste: [
            `**Name**: ${hebergeur.nom}`,
            `**Address**: ${hebergeur.adresse}`,
            `**Telephone**: ${hebergeur.telephone}`,
          ],
        },
      ],
    },
    {
      id: "prestataires",
      titre: "Other technical service providers",
      blocs: [
        "To run, the site also relies on:",
        {
          liste: [
            `**${prestataires.reseau.nom}** (${prestataires.reseau.adresse}): ${prestataires.reseau.role}.`,
            `**${prestataires.messagerie.nom}**: ${prestataires.messagerie.role}.`,
          ],
        },
        "What passes through these providers, and how your data is protected, is set out in the [privacy policy](/confidentialite).",
      ],
    },
    {
      id: "objet",
      titre: "What the site is for",
      blocs: [
        `${site.nom} wants to help you discover independent venues (restaurants, patisseries, bars, bowling alleys, event venues, things to do) that would love a few more faces, including those going through a really tough time. The launch is planned across France.`,
        `The project is still being developed. For now, the site introduces SOS Miam and lets you ask to be told when it launches, ask for your venue to be listed, manage its listing in the [pro area](https://pro.sosmiam.fr) or, if you're 18 or over, become an ambassador with an account on [${adresseEspaceAmbassadeur.replace("https://", "")}](${adresseEspaceAmbassadeur}).`,
        "**Everything is free**, for you and for venues alike: no subscription, no paid plan, no commission. Nothing is sold on the site, which is why there are no terms and conditions of sale. The rules for using the site are set out in the [Terms of Use](/cgu).",
        "In time, SOS Miam plans to fund itself through advertising, always labelled as such and with no effect whatsoever on how venues are ranked. There is no advertising at present.",
      ],
    },
    {
      id: "propriete-intellectuelle",
      titre: "Intellectual property",
      blocs: [
        "The texts, the logo, the mascot (the smiling lifebuoy), the illustrations and the graphic elements of the site are the property of the publisher and are protected by the French Intellectual Property Code ({fr:Code de la propriété intellectuelle}). The fonts remain the property of their authors (see “Credits” below).",
        "Unless the publisher has given written permission, you may not reproduce, modify or reuse these elements, in whole or in part, except where the law allows it, such as a short quotation that cites its source.",
        `You're of course free to share a link to the site without asking. For any other use (article, presentation, partnership…), contact us at ${lienEmail}.`,
        "The site shows no made-up venues: the venues that appear on it are real ones.",
      ],
    },
    {
      id: "credits",
      titre: "Credits",
      blocs: [
        `Design, texts, logo, mascot and illustrations: ${editeur.nom}, publisher of the site.`,
        "Fonts:",
        {
          liste: [
            "**Inter**, © 2016 The Inter Project Authors ([github.com/rsms/inter](https://github.com/rsms/inter)), for body text;",
            "**Bricolage Grotesque**, © 2022 The Bricolage Grotesque Project Authors ([github.com/ateliertriay/bricolage](https://github.com/ateliertriay/bricolage)), for headings.",
          ],
        },
        "These fonts are distributed under the [SIL Open Font License 1.1](https://openfontlicense.org). They're hosted with the site, on our server at our hosting provider, so no external font service (such as Google Fonts) is called when you visit the site.",
        "Base map: [OpenFreeMap](https://openfreemap.org), [OpenMapTiles](https://www.openmaptiles.org/), data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Our server requests it from OpenFreeMap itself, so your visit doesn't leave sosmiam.fr (see “[The map of venues](/confidentialite#carte-des-lieux)”).",
        "Venue pages: the text and details on some “Not verified” pages come from the tourist offices of Montpellier, Lyon, Lille and Marseille, and from [DATAtourisme](https://www.datatourisme.fr) (under the {fr:Licence Ouverte 2.0}, [the French Open Licence](https://www.etalab.gouv.fr/licence-ouverte-open-licence/)). The source is shown on each page concerned.",
      ],
    },
    {
      id: "signaler-contenu",
      titre: "Reporting illegal content",
      blocs: [
        `If you spot content on the site that you believe is illegal (hateful or defamatory remarks, invasion of privacy, intellectual property infringement…), report it to ${lienEmail}, giving:`,
        {
          liste: [
            "the exact address (URL) of the page concerned;",
            "a description of the content and, if possible, a screenshot;",
            "the reasons why you believe it is illegal;",
            "your surname, first name and email address, so that we can reply to you.",
          ],
        },
        "We examine every notice, and any illegal content is corrected or removed. Please note: reporting content as illegal when you know this is untrue, in order to have it removed, may be penalised by law.",
        "For the most serious content (glorification of terrorism, child sexual abuse, incitement to hatred or violence…), you can also alert the authorities directly on [Pharos](https://www.internet-signalement.gouv.fr), the official French reporting platform.",
        "At present, the site doesn't publish any content submitted by its visitors. When SOS Miam allows content to be posted (reviews, photos…), the rules for posting and moderation will be set out in the [Terms of Use](/cgu).",
      ],
    },
    {
      id: "donnees-cookies",
      titre: "Personal data and cookies",
      blocs: [
        "SOS Miam never sells or rents out your data. What is processed today, why, for how long and how to exercise your rights: it's all explained in the [privacy policy](/confidentialite).",
        `The site sets no tracking cookies and shows no advertising. Its visitor statistics are counted by our server, without cookies, and you can choose not to be counted on the [statistics](/statistiques) page. The only cookies set, all strictly necessary, are: a security cookie that our provider ${prestataires.reseau.nom} sets to protect the site, the cookie that remembers your choice not to be counted if you ask for it, the one that keeps you logged in (to “My account”, your ambassador area or your pro area), two 10-minute cookies for the duration of a login with Apple or Google, and a 2-minute one when you log in with the app. The full list, with their durations, is on the [cookies](/cookies) page.`,
      ],
    },
    {
      id: "evolution",
      titre: "Changes to this notice",
      blocs: [
        "SOS Miam is currently a personal project, with no commercial activity. If it becomes a professional activity (for example, as soon as paid advertising is introduced), this notice will be completed before that change with all the information required of professional publishers: legal structure, address, registration number…",
        "It will also be updated whenever there's a significant change, in particular when the mobile app is released. The date of the last update is shown at the top of this page.",
        "This legal notice is governed by French law.",
      ],
    },
  ],
  chapitres: [
    { id: "qui-edite", titre: "Who publishes and hosts SOS Miam", sections: ["editeur", "directeur-publication", "hebergeur", "prestataires"] },
    { id: "le-site", titre: "The site, and who owns it", sections: ["objet", "propriete-intellectuelle", "credits"] },
    { id: "signalement", titre: "Reporting illegal content", sections: ["signaler-contenu"] },
    { id: "tes-donnees", titre: "Your data and cookies", sections: ["donnees-cookies"] },
    { id: "a-l-avenir", titre: "Changes to this notice", sections: ["evolution"] },
  ],
};
