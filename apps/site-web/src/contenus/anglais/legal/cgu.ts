import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import { sectionAmbassadeursCguAnglais } from "~/contenus/anglais/legal/cgu-ambassadeurs";
import { sectionActusCguAnglais } from "~/contenus/anglais/legal/cgu-actus";
import { sectionBoiteAIdeesCguAnglais, sectionCommunauteCguAnglais, sectionQuiEstLaCguAnglais } from "~/contenus/anglais/legal/cgu-communaute";
import { sectionModerationCguAnglais } from "~/contenus/anglais/legal/cgu-moderation";
import { sectionProCguAnglais } from "~/contenus/anglais/legal/cgu-pro";
import {
  sectionBloquerCguAnglais, sectionCommentairesCguAnglais, sectionMessagerieCguAnglais, sectionPhotoProfilCguAnglais, sectionPotesCguAnglais,
  sectionPseudosCguAnglais,
} from "~/contenus/anglais/legal/cgu-social";
import { editeur, site } from "~/contenus/anglais/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const documentCguAnglais: DocumentLegal | null = {
  titre: "Terms of Use",
  description:
    "The rules of the SOS Miam site and app: both free, accounts 18+, your crew and messaging, the Miamis and their open meetups, what you can post, how we moderate and how to reach us.",
  miseAJour: "28 October 2026",
  introduction: [
    "Welcome to SOS Miam! These Terms of Use are the ground rules for the site and the app: what you can do there, what we do on our side and how we sort things out if a problem comes up. We have written them as simply as possible.",
  ],
  enBref: [
    {
      liste: [
        "Everything is **free** and there is **nothing to buy**.",
        "To visit the site, **you do not need an account**: only the **Ambassador area** and the **Pro area** require one. In the app, you can have a look around without an account (feed, Explore, venue pages, suitable for all ages); for everything else, you need a **free account**, for over-18s.",
        "In every case, accounts are **18+**.",
        "What you post **remains yours**, and we never sell your data.",
        "In messaging as everywhere else, **we treat each other kindly**: no harassment, no shocking content, and you can always report or block.",
        "Among **the Miamis**, the organiser of a meetup accepts each new arrival, your gender (optional) is declared honestly, and a restricted audience is there to help people feel at ease, **never to exclude**.",
      ],
    },
  ],
  sections: [
    {
      id: "objet",
      titre: "What these Terms are for",
      blocs: [
        `These terms of use (hereinafter “the Terms”) govern access to and use of the ${site.nom} website, available at ${site.adresse} and on its subdomains (hereinafter “the site”), and of the ${site.nom} mobile application for iPhone and Android (hereinafter “the app”).`,
        `The site and the app are published by ${editeur.nom}, ${editeur.statut} (hereinafter “the publisher”). In these Terms, “SOS Miam”, “we” and “us” refer to the publisher; “you” refers to any person who uses the site or the app, or who writes to us. Information about the publisher and the hosting provider is in the [legal notice](/mentions-legales).`,
        `The site lets you discover the SOS Miam project, write to us and, if you are 18 or over, become an ambassador with an account on ${adresseEspaceAmbassadeur.replace("https://", "")} (see “The Ambassador programme”). The app helps you discover independent venues near you, confirm your visits, leave reviews, save your favourite places, get together with your friends (your crew, messaging, get-togethers and lists) and meet other Miamis (open meetups, “Who's around?” and the suggestion box). Nothing is sold there: there is no payment, no subscription, no in-app purchase and no general terms of sale.`,
      ],
    },
    {
      id: "acceptation",
      titre: "Accepting the Terms",
      blocs: [
        "By using the site, you accept these Terms, in the version online at the time of your visit. For the app, as for the Ambassador area, you accept them by creating your account. You can reread them at any time on this page, and save or print them.",
        "If you do not agree with them, you are free not to use SOS Miam, and to delete your account at any time.",
        "If you download the app from the App Store or Google Play, their own terms also apply, to the download and to the app's licence.",
      ],
    },
    {
      id: "acces",
      titre: "Free access, as often as possible",
      blocs: [
        "The site and the app are **free**. The site is open to everyone, without registration, except for the Ambassador area and the Pro area (18+); in the app, you can look around without an account, and everything else requires a free account (see below). Only your equipment and your internet connection (home broadband, mobile plan) remain at your own expense.",
        "We do our best to keep SOS Miam available 24 hours a day, 7 days a week, but we cannot guarantee it. The site or the app may be interrupted or slowed down, in particular:",
        {
          liste: [
            "for maintenance or an update;",
            "in the event of an outage or incident at the hosting provider or the network provider;",
            "in the event of a cyberattack or force majeure.",
          ],
        },
        "We strive to limit these interruptions and to keep them as short as possible. We may also change the content and the features, for example to add new features.",
      ],
    },
    {
      id: "contenu",
      titre: "What you find on SOS Miam",
      blocs: [
        "**SOS Miam** is **free for you and for venues alike**. It helps you discover independent restaurants, patisseries, bars, bowling alleys and things to do that would love a few more faces, including those going through a really tough time (places with a BIG SOS), all over France.",
        "The app is still in development: the features described are those planned today, they may change before the launch, and no release date is guaranteed.",
        "The venues shown in the demo versions of the app are **made-up examples** to illustrate the idea (the site, for its part, only shows real venues). They do not refer to real establishments: any resemblance to an existing venue would be a coincidence. The videos and photos that illustrate them come from royalty-free image libraries, and the app labels them “for illustration” ({fr:d'illustration}).",
        "Information about real venues (opening hours, prices, menus, SOS…) most often comes from the venues themselves, which are responsible for it. The order in which we show them to you depends in particular on what you have told us you are into, and places with a BIG SOS are in the spotlight for 7 days. **No venue can pay to be placed higher.**",
        "There is **no advertising** today, either on the site or in the app. When it arrives to fund SOS Miam, it will **always be identified as such** and will have **no effect on how venues are ranked**. These Terms will be updated before it arrives.",
        `We take care to keep the information accurate and up to date. If you spot an error, write to us at ${lienContact}: we will correct it as soon as possible.`,
      ],
    },
    {
      id: "age",
      titre: "18 and over",
      blocs: [
        "To create an SOS Miam account (in the app, in the Ambassador area or in the Pro area), you must be **of legal age**: **18** in France, the only country where SOS Miam is open for now. The site, for its part, can be visited without an account, at any age.",
        "Without an account, the app remains suitable for all ages: you can look at the feed, Explore, venue pages and their menus, and creators' pages, but bars and anything to do with alcohol do not appear. Everything else (rescues, Likes, following, commenting, visits, bookings, reviews, Community, challenges, Miam Safe…) requires an account.",
        "Your date of birth must be accurate: it is used to check that you are 18. Lying about your age is prohibited. If we learn that an account was created by lying about age, we delete it along with its data.",
        "All the details, for you and for parents, are on the [Age and SOS Miam](/age) page.",
      ],
    },
    {
      id: "compte",
      titre: "Your account",
      blocs: [
        "In the app, you can create your account with Apple, Google or an email address. It is free and personal: **one account per person**, and you keep your login details to yourself.",
        `You are responsible for what is done from your account. If you think someone else is using it, let us know quickly at ${lienContact}.`,
        "You can **delete your account at any time**, from the app, at [sosmiam.fr/mon-compte](/mon-compte) or by writing to us. We then genuinely erase your data, except what the law requires us to keep. Your messages remain with the friends you sent them to, signed “Deleted account” ({fr:Compte supprimé}), until the conversation is deleted; your ideas remain in the suggestion box, without your name; and your username remains reserved for 30 days (see “Your username”).",
        "If you do not comply with these Terms, we may, depending on the seriousness: hide or remove content (a post, comment, message, list…), prevent you from posting for a time, suspend your account or delete it. In every case, we tell you why (see “Notices and moderation”).",
      ],
    },
    {
      id: "rescousses",
      titre: "Rescues, visits and badges",
      blocs: [
        "Each week, you have **3 rescues**, which top up on Monday. You confirm your visits in the app, for example by scanning a **QR code**. Only **Verified ✓** venues (those with an SOS Miam account) can confirm a visit: at a venue that is not verified, no visit, no points and no rescue are counted. A visit gifted by the venue does not earn any points.",
        "Your visits earn you points, levels (Taster, Gem Hunter…) and badges. They have **no monetary value**: they cannot be bought, sold or exchanged. Not to be confused with the site's Ambassador programme, which is reserved for over-18s (see “The Ambassador programme”, just below).",
        "Cheating spoils the game for everyone, and above all for the venues: points earned by cheating (fake scans, multiple accounts…) may be withdrawn.",
      ],
    },
    sectionAmbassadeursCguAnglais,
    sectionProCguAnglais,
    sectionPotesCguAnglais,
    sectionMessagerieCguAnglais,
    sectionCommentairesCguAnglais,
    sectionPseudosCguAnglais,
    sectionPhotoProfilCguAnglais,
    sectionBloquerCguAnglais,
    sectionCommunauteCguAnglais,
    sectionQuiEstLaCguAnglais,
    sectionBoiteAIdeesCguAnglais,
    sectionActusCguAnglais,
    {
      id: "publications",
      titre: "What you post in the app",
      blocs: [
        "In the app, you can post content: reviews, photos, videos, comments, lists, open meetups, ideas and, if you represent a venue, its listing, its SOS alerts or the story of its BIG SOS (hereinafter “your posts”). What you send in messaging (messages, photos, voice notes) is only shown to the people in the conversation.",
        "**Your posts remain yours.** So that we can show them, you authorise us, free of charge and on a non-exclusive basis, to host them, to adapt them to the app's format (cropping, compression…) and to display them in the app and on the site, for as long as they are online. You remain free to publish them elsewhere.",
        "If you delete a post, or your account, we stop showing it. For any other use, for example on our social media accounts (TikTok, Instagram…), **we ask for your consent first**.",
        "By posting, you guarantee:",
        {
          liste: [
            "that you have the right to do so: it is your own creation, or you have the consent of its author (music included);",
            "that the people who can be recognised in your photos and videos have agreed (and their parents, in the case of a minor);",
            "that what you describe is true: a review describes a real visit;",
            "that you clearly disclose any commercial partnership, with the label {fr:Publicité} (advertisement) or {fr:Collaboration commerciale} (a paid or gifted partnership), as the law requires;",
            "that your post complies with the community rules, just below.",
          ],
        },
        "You are responsible for what you post.",
      ],
    },
    {
      id: "regles-communaute",
      titre: "The community rules",
      blocs: [
        "SOS Miam is a place for inspiring each other to head out and for helping each other. We treat each other kindly here, and for shocking content and abusive behaviour, it is **zero tolerance**. In everything you share in the app (posts, reviews, comments, lists, profile, username, private messages, groups, get-togethers and meetups, tags and ideas), it is prohibited to post or do the following:",
        {
          liste: [
            "**false information**: a made-up or closed venue, a fake SOS, misleading prices or opening hours, a review without a visit, paid for or written to harm a competitor;",
            "**hidden advertising** or spam;",
            "**scams**: asking for money or bank details, fake competitions, dubious links;",
            "**hate or harassment**: insults, mockery, discrimination, threats;",
            "**violence**, nudity or sexual content;",
            "anything that **puts people in danger**: drugs, alcohol offered to minors, dangerous challenges, weapons;",
            "anything that infringes **privacy**: filming or showing someone without their consent, publishing their personal information;",
            "**other people's content** (video, photo, music, text) without their consent;",
            "**cheating**, or deliberately reporting posts that follow the rules, for example to harm a competitor;",
            "passing yourself off as someone else, or as a venue you do not represent;",
            "and more generally, anything illegal.",
          ],
        },
        "Places with a BIG SOS are going through a really tough time and had the courage to say so: we talk about them with respect, never to make fun of them.",
      ],
    },
    sectionModerationCguAnglais,
    {
      id: "propriete-intellectuelle",
      titre: "Intellectual property",
      blocs: [
        "The logo, the mascot (the lifebuoy), the texts, the illustrations, the layout and the code of the site and the app are protected by copyright. Unless otherwise stated, they belong to the publisher; some elements, such as fonts or illustration videos, are used under their authors' licence. Posts belong to their authors (see “What you post in the app”).",
        "You have the right:",
        {
          liste: [
            "to use the site and the app for your personal use, and to print pages of the site or keep a copy of them;",
            "to share links to the site and the app, on social media or elsewhere (it is even encouraged);",
            "to quote short extracts, stating that they come from SOS Miam.",
          ],
        },
        "Apart from these cases and the exceptions provided for by law (Article L122-5 of the {fr:Code de la propriété intellectuelle}, the French Intellectual Property Code), it is prohibited, without our written consent, to reproduce, modify, distribute or exploit all or part of the site or the app.",
        `In particular, it is prohibited to use the logo or the mascot for commercial purposes, or to use the SOS Miam name in a way that would suggest a connection with us that does not exist. The only exception: approved ambassadors may use the media kit, under the conditions set out in “The Ambassador programme”. For any other request, write to us at ${lienContact}.`,
      ],
    },
    {
      id: "bon-usage",
      titre: "Proper use of the site and the app",
      blocs: [
        "You undertake to use SOS Miam fairly and in accordance with the law. In particular, it is prohibited:",
        {
          liste: [
            "to attempt to gain unauthorised access to the server, to other people's accounts or to non-public parts of the site or the app;",
            "to disrupt their operation, for example by overloading them with requests or by introducing a virus;",
            "to extract their content in an automated and large-scale way, other than the indexing of the site by search engines;",
            "to modify or decompile the app, except where the law allows it;",
            "to use our contact address to send unwanted (spam), abusive or unlawful messages.",
          ],
        },
        "If you discover a security flaw, please report it to us on the [Bug hunt](/securite) page rather than exploiting it.",
      ],
    },
    {
      id: "contributions",
      titre: "What you send us by email or through the site",
      blocs: [
        `To sign up for the newsletter, use the “Keep me posted” form at the bottom of the home page, or write to us at ${lienContact}. To list your venue, use the [List my venue](/inscrire-mon-lieu) form (or write to us). To become an ambassador, create your account on [${adresseEspaceAmbassadeur.replace("https://", "")}](${adresseEspaceAmbassadeur}), if you are 18 or over: it is from your area that you suggest venues and apply to be a founder. For a simple question, write to us at the same address.`,
        "When you send us information, you guarantee:",
        {
          liste: [
            "that it is accurate and up to date;",
            "if you are listing a venue, that you are responsible for it or have the consent of the people responsible for it;",
            "that you have the right to pass on to us what you send (texts, photos…) and that it does not infringe anyone else's rights or privacy;",
            "that your message contains nothing unlawful, abusive or discriminatory.",
          ],
        },
        "We read everything carefully, but we remain free to follow it up or not. In particular:",
        {
          liste: [
            "a request to list a venue, or a venue suggested by an ambassador, does not oblige us to publish that venue, either now or at the launch;",
            "an ambassador sign-up may not be approved, and a founder application may be unsuccessful (there are only a few spots per city or per département);",
            "a request may be declined, in particular if it does not match the spirit of SOS Miam (independent venues) or if the information is inaccurate.",
          ],
        },
        "Sending a request or an application is free and creates no commitment for you or for us.",
        "You retain your rights to what you send us. We use it only for the purpose for which you sent it to us: letting you know about the launch near you if you signed up for the newsletter, considering your request or your application and replying to you. We do not publish your messages. The only exception: if we accept a venue, what you told us about it is used to create its page, which is public (and, if it was suggested from the Ambassador area, the page may show your first name: “Spotted by …”).",
        "To unsubscribe from the newsletter, a simple email is enough. What we do with your data is set out in the [privacy policy](/confidentialite).",
      ],
    },
    {
      id: "liens",
      titre: "Links to other sites",
      blocs: [
        `The site and the app may contain links to other sites. We do not control their content, which is the responsibility of their publishers, and their own terms apply. If a link leads to unlawful content, report it to us at ${lienContact}: we will remove it promptly.`,
        "You may freely create a link to the site, without asking for permission, provided that you do not display the site inside another site (in a frame) in a way that would hide its address, that you do not suggest a partnership that does not exist and that you do not place the link on an unlawful site.",
      ],
    },
    {
      id: "responsabilite",
      titre: "Liability",
      blocs: [
        "**On our side**, we are liable, under the conditions provided for by law, for damage caused by a failure to meet our obligations or by a fault on our part.",
        "For posts by users and venues, and for what is exchanged in messaging, we are a **hosting service provider** within the meaning of the law: we do not check everything before it goes online (and we do not read private messages, unless they are reported to us), but we act quickly as soon as unlawful content is reported to us.",
        "However, we cannot be held liable for damage resulting from:",
        {
          liste: [
            "use of the site or the app contrary to these Terms or to the law;",
            "an interruption that does not result from a failure or a fault on our part (an outage at a service provider, a cyberattack, force majeure…);",
            "what happens at a venue (welcome, food, prices, safety), which is the venue's responsibility;",
            "what happens during a get-together with friends or an open meetup, organised among yourselves in the app;",
            "the content of external sites to which the site or the app links;",
            "your own equipment or your internet connection (a virus on your device, a faulty network…).",
          ],
        },
        "**Miam Safe** (“Alert a friend”, the silent alert to the staff) is a helping hand for alerting someone, **not an emergency service**: a notification may arrive late, go unseen, or not be sent if your friend's phone is not connected (the app tells you so). In case of danger, first call **17** or **112** (or **114** by text message).",
        "These limits never apply in the event of a failure or a fault on our part, and do not deprive you of any of the rights that the law gives you.",
        "**On your side**, you are responsible for how you use SOS Miam, for what you post, for what you write or send in messaging (one-to-one, in a group or in a get-together or meetup) and for what you send us. Everyone is responsible for their own messages: the admin of a group or the organiser of a get-together or meetup is not responsible for what the others write.",
      ],
    },
    {
      id: "donnees-cookies",
      titre: "Personal data and cookies",
      blocs: [
        "We only collect what is useful for running and protecting SOS Miam, replying to you, considering your requests, keeping your ambassador account going if you have one and, if you asked for it, letting you know about the launch. We never sell your data, and we do not rent it out either.",
        "In the app, your date of birth, your surname and your gender (if you give it) are encrypted, as are the text of your messages, your photos and your voice notes; and your dietary requirements (vegetarian, gluten-free, allergies…) stay on your phone: they are never sent to our server.",
        "The [privacy policy](/confidentialite) explains which data, why, for how long and how to exercise your rights, for the site as well as for the app (your account, your crew, your messages, the Miamis and Miam Safe).",
        "On the site, there are no **tracking cookies** today: no advertising, and visitor statistics counted by our server, without cookies (you can opt out of being counted on the [Visitor statistics](/statistiques) page). The only cookies set are strictly necessary: a security cookie from our provider Cloudflare, the cookie that remembers your opt-out from the statistics if you ask for it, the one that keeps you logged in (to “My account”, your Ambassador area or your Pro area) and, for the duration of a login with Apple or Google, two 10-minute cookies. If this changes, nothing optional will be set without your consent. The details are on the [cookies page](/cookies).",
      ],
    },
    {
      id: "modifications",
      titre: "Changes to the Terms",
      blocs: [
        "These Terms may change, for example when advertising arrives: they will be updated **before** these new features start.",
        "The date of the last update is shown at the top of this page. Any significant change is announced on the site and in the app before it applies. If it changes what we do with what you have sent us or posted, we also let you know by email, in the app or in your Ambassador area.",
        "The version that applies is the one online when you use SOS Miam. If a new version does not suit you, you can stop using SOS Miam at any time, delete your account and ask us to erase what you have sent us.",
      ],
    },
    {
      id: "droit-applicable",
      titre: "Governing law and disputes",
      blocs: [
        "These Terms are governed by **French law**. If you live in another country, this choice does not deprive you of the protection of the mandatory rules of your country of residence.",
        `In the event of a disagreement, the simplest thing is to write to us at ${lienContact}: we will look for an amicable solution together. Most problems are settled far better through a conversation than before a judge.`,
        "This step is **optional**: it does not prevent you from turning to a {fr:conciliateur de justice} (a free, court-appointed conciliator) or from bringing the dispute before the competent French courts, in accordance with the ordinary rules of jurisdiction. No particular court is imposed on you.",
        "If any clause of these Terms were held to be invalid, the others would remain in force.",
      ],
    },
    {
      id: "contact",
      titre: "Contact us",
      blocs: [
        `A question about these Terms, content to report, an idea? Write to us at ${lienContact}. We read every message.`,
      ],
    },
  ],
  chapitres: [
    { id: "le-cadre", titre: "The framework", sections: ["objet", "acceptation", "acces"] },
    { id: "sos-miam-et-ton-compte", titre: "SOS Miam and your account", sections: ["contenu", "age", "compte", "rescousses"] },
    { id: "ambassadeurs-et-pros", titre: "Ambassadors and pros", sections: ["ambassadeurs", "pro"] },
    { id: "ta-bande-et-tes-messages", titre: "Your crew and messaging", sections: ["potes", "messagerie", "commentaires", "pseudos", "photo-profil", "bloquer"] },
    { id: "les-miamis", titre: "The Miamis", sections: ["communaute", "qui-est-la", "boite-a-idees", "actus"] },
    { id: "publier", titre: "Posting, and getting along", sections: ["publications", "regles-communaute", "moderation"] },
    { id: "bon-usage-et-responsabilites", titre: "Proper use and liability", sections: ["propriete-intellectuelle", "bon-usage", "contributions", "liens", "responsabilite"] },
    { id: "tes-donnees", titre: "Your data and cookies", sections: ["donnees-cookies"] },
    { id: "changements-et-litiges", titre: "Changes and disputes", sections: ["modifications", "droit-applicable"] },
    { id: "nous-ecrire", titre: "Contact us", sections: ["contact"] },
  ],
};
