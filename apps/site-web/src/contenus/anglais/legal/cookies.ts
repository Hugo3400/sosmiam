import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import { editeur, prestataires, site } from "~/contenus/anglais/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;
const cloudflareNomComplet = prestataires.reseau.nom;
const cloudflare = "Cloudflare";
const hoteAmbassadeur = adresseEspaceAmbassadeur.replace("https://", "");

export const documentCookiesAnglais: DocumentLegal = {
  titre: "Cookies and other trackers",
  description:
    "Cookies on SOS Miam: no ads and no tracking, statistics without cookies, and the exact list of the few strictly necessary cookies (security, login, your choices), with how long they last. How the banner will work once ads arrive, and how to manage your cookies.",
  miseAJour: "28 October 2026",
  introduction: [
    "At SOS Miam, the only cookies we like are the ones from the patisserie round the corner. **Our site doesn't set any tracking cookies in your browser.** No ads, no tracking, and visitor statistics counted by our server, without cookies.",
    `This page explains what a cookie is, what really happens today when you visit ${site.adresse} (including the ambassador and pro areas, and the version of the site being prepared), with the exact list of cookies, and how things will work the day ads arrive: nothing optional without your consent.`,
  ],
  enBref: [
    {
      liste: [
        "**No tracking cookies**, no ads, no tracking and no content from other sites in our pages.",
        `**A few strictly necessary cookies**: a security cookie from ${cloudflare}, the one that keeps you logged in if you log in, two 10-minute cookies during a login with Apple or Google, a 2-minute one when you log in with the app, the one that remembers your choice not to be counted in the statistics if you ask for it, and the one that remembers the language you choose. They're all in [the list](#liste-des-cookies).`,
        "**Nothing to accept today**: the law exempts these cookies from consent, so there's [nothing to accept or reject](#mes-choix). On your first visit, a small banner tells you so, with a single “OK, got it” button. The choice banner is ready, but it only appears if there's a real choice to make.",
        "**The day ads or videos arrive**, nothing optional will be set without your consent: “Accept all”, “Reject all” or “Choose”, three buttons of the same size, and your choice kept for 6 months.",
      ],
    },
  ],
  sections: [
    {
      id: "definition",
      titre: "What is a cookie?",
      blocs: [
        "A cookie is a small file that a website stores in your browser (on your computer, tablet or phone) when you visit it. It allows that site, or another company, to recognise your browser from one page to the next or on your next visit.",
        "Other techniques do the same job: the browser's local storage (“localStorage”), invisible pixels placed in a page or an email, phones' advertising identifiers or your device's fingerprint (“fingerprinting”). These are called **trackers**. The law treats them all as cookies, and on this page, when we say “cookies”, we mean all trackers.",
        "Some cookies are essential, for example to protect a site against attacks. Others are used to measure audiences, show targeted advertising or make content from other sites work (videos, maps, social media buttons).",
        "**What the law says.** Article 82 of the French Data Protection Act ({fr:loi Informatique et Libertés}, Law No. 78-17 of 6 January 1978), which transposes the European Directive 2002/58/EC, known as the “ePrivacy” Directive, prohibits storing or reading a tracker on your device without your prior consent. There are only two exceptions: the tracker's sole purpose is to enable or facilitate communication by electronic means (for example, delivering the page to you), or it is strictly necessary for the online service you have expressly requested. The CNIL (the French data protection authority) sets out these rules in detail in its guidelines and its recommendation of September 2020.",
      ],
    },
    {
      id: "aujourd-hui",
      titre: "Today: no tracking cookies",
      blocs: [
        `**${site.nom} doesn't set any tracking cookies.** In practice:`,
        {
          liste: [
            "visitor statistics counted by our server, **with no cookie or script** in your page: we only keep totals, never your IP address (details in the [privacy policy](/confidentialite#statistiques));",
            "one cookie of our own, only if you ask for it: **sosmiam-sans-statistiques**, set when you choose not to be counted on the [Your visits and our statistics](/statistiques) page. It remembers your choice for 13 months and does nothing else, so the law exempts it from consent;",
            "another, only if you choose a language (at the bottom of every page, or in the banner that offers you the page in another language): **sosmiam-langue**, which remembers “fr” or “en” for **1 year**, for sosmiam.fr and its ambassador and pro areas. It contains nothing else and is only used to show you the site in the language you chose, so the law exempts it from consent;",
            `another, only if you log in to “[My account](/mon-compte)”, your [ambassador area](${adresseEspaceAmbassadeur}) or your [pro area](https://pro.sosmiam.fr): **__Host-sosmiam-session**, which keeps you logged in from one page to the next. It only contains a randomly generated key and is only sent to the site where you logged in (${site.adresse}, ${hoteAmbassadeur} or pro.sosmiam.fr, each with its own, or the version of the site being prepared), never to any other. It lasts **90 days at most** and is deleted when you log out. It's strictly necessary for staying logged in, so the law exempts it from consent, and it's used for nothing else;`,
            "another, only when you select “Log in with the app” (login by QR code): **__Host-sosmiam-connexion-qr**, which keeps the secret code of the displayed QR code for **2 minutes at most**, to check that it really is your app approving the login. Encrypted, unreadable by the page's scripts and deleted as soon as it's been used, it's strictly necessary for the login you've asked for, so the law exempts it from consent;",
            "up to three more, only when you select “Continue with Apple” or “Continue with Google”: **__Host-sosmiam-connexion-externe**, which holds a randomly generated code for **10 minutes at most** to check that Apple's or Google's response really matches your request (it has to be readable when Apple or Google sends you back to us, hence its “SameSite=None” setting), and, if you create your account, confirm its deletion, or link or unlink Apple or Google, **__Host-sosmiam-inscription-externe**, which keeps Apple's or Google's attestation until you've finished (**10 minutes at most**). If your account has no password, linking Apple or Google also requires the attestation from your current login method: **__Host-sosmiam-confirmation-externe** keeps it in the same way (**10 minutes at most**). All of them are encrypted, unreadable by the page's scripts, deleted as soon as they've been used, and strictly necessary for the login you've asked for, so the law exempts them from consent;",
            "no advertising;",
            "no content from other sites embedded in our pages: no videos, no maps, no social media buttons;",
            "fonts hosted with the site, on our server at our hosting provider: to display the site, your browser doesn't call Google Fonts or any other font service;",
            "nothing is stored in your browser's local storage (“localStorage”). The only exception, strictly necessary for browsing: in session storage (“sessionStorage”), the site keeps the position you were at on each page so it can take you back there when you go back, and sometimes the site's version number after an update. No identifiers, nothing leaves your browser, and it's all deleted when you close the tab.",
          ],
        },
        `That's why our cookie banner doesn't ask you anything: there's nothing to accept. On your first visit, it just lets you know, with an “OK, got it” button that's remembered for 6 months (see **sosmiam-consentement** in [the list](#liste-des-cookies)). The choice banner is ready for the day an optional cookie arrives (see [Your choice, and how it will be respected](#ton-choix)). Until then, it stays hidden, so you're not asked to choose for nothing. The security cookies of ${cloudflare}, our provider, are explained a little further down.`,
        "Like almost every website, our server records each visit in a technical log (IP address, page requested, date and time…), kept for 15 days at most for security and troubleshooting. This isn't a cookie: nothing is stored on your device. It's all explained in the [privacy policy](/confidentialite).",
      ],
    },
    {
      id: "liste-des-cookies",
      titre: "The full list",
      blocs: [
        "Here's everything that may be stored in your browser when you use the site, as recorded on 14 October 2026 and updated on 28 October 2026. Everything is **strictly necessary**, and set **on our own addresses** (sosmiam.fr and its subdomains): no cookies from any other site.",
        {
          tableau: {
            legende: "The cookies and browser storage used by SOS Miam: name, purpose, duration and who sets them.",
            colonnes: ["Name", "What it's for", "Duration", "Who sets it, and when"],
            lignes: [
              ["cf_clearance", "Security: remembers that your browser has passed the anti-bot check, so you're not asked again on every page.", "1 year", `${cloudflare}, our security provider, from your first page, on ${site.adresse} and its subdomains.`],
              ["__cf_bm", "Security: helps tell human visitors apart from bots.", "About 30 minutes", `${cloudflare}, only in some cases (not recorded so far).`],
              ["__Host-sosmiam-session", "Keeps you logged in, from one page to the next.", "90 days at most, deleted when you log out", "SOS Miam, only if you log in (“My account”, ambassador area or pro area), one per site."],
              ["__Host-sosmiam-connexion-externe", "Checks that Apple's or Google's response really matches your request. Encrypted.", "10 minutes at most", "SOS Miam, when you select “Continue with Apple” or “Continue with Google”."],
              ["__Host-sosmiam-inscription-externe", "Keeps Apple's or Google's attestation while you finish signing up, confirm a deletion, or link or unlink Apple or Google. Encrypted.", "10 minutes at most", "SOS Miam, only in those cases."],
              ["__Host-sosmiam-confirmation-externe", "Keeps the attestation from your current login method (Apple or Google) when you link the other one to an account without a password. Encrypted.", "10 minutes at most", "SOS Miam, only in that case."],
              ["__Host-sosmiam-connexion-qr", "Checks that it really is your app approving “Log in with the app” (the secret code of the displayed QR code). Encrypted.", "2 minutes at most, deleted as soon as it's been used", "SOS Miam, when you select “Log in with the app” (login by QR code)."],
              ["sosmiam-sans-statistiques", "Remembers your choice not to be counted in the visitor statistics.", "13 months", "SOS Miam, only if you ask for it on the [Statistics](/statistiques) page."],
              ["sosmiam-langue", "Remembers the language you chose for the site (“fr” or “en”). No identifiers.", "1 year", "SOS Miam, only when you choose a language (at the bottom of the page, or in the banner that offers you the other language), for sosmiam.fr and its ambassador and pro areas."],
              ["sosmiam-consentement", "Remembers your choices about optional cookies: what you accept or reject, the date of your choice and the version of the partner list. Today, it only remembers that you've seen the information banner. No identifiers.", "6 months", "SOS Miam, when you select “OK, got it” in the information banner, and later when you make a choice in the banner or in “Cookie settings”, for sosmiam.fr and its ambassador and pro areas."],
              ["react-router-scroll-positions (session storage)", "Takes you back to where you were on a page when you go back.", "Until you close the tab", "The site, in your browser: nothing is sent to our server."],
              ["react-router-manifest-version (session storage)", "After a site update, reloads the page just once, without going round in circles.", "Until you close the tab", "The site, in your browser, only after an update."],
            ],
          },
        },
        "Cookies whose names begin with “__Host-” are only sent to the exact site that set them, and only over an encrypted connection. None of these cookies can be read by the page's scripts, except session storage and sosmiam-consentement (the page needs to read your choice to know what it's allowed to load), and neither of those contains any identifier or personal data.",
      ],
    },
    {
      id: "cloudflare",
      titre: `${cloudflare}'s security cookies`,
      blocs: [
        `All traffic to ${site.adresse} passes through ${cloudflareNomComplet}, our provider, which delivers the site and protects it against attacks and malicious bots. To do this, ${cloudflare} sets security cookies in your browser, on the ${site.adresse} domain:`,
        {
          liste: [
            `**cf_clearance**: set by ${cloudflare} from your first page, after an automatic and invisible check of your browser, it remembers that you're not a bot; duration recorded: 1 year.`,
            `**__cf_bm**: set by ${cloudflare} in some cases, it helps tell human visitors apart from bots (“bot management”); duration: about 30 minutes. We haven't recorded it on our pages so far.`,
          ],
        },
        `These cookies are **strictly necessary** for the site's security, so the law exempts them from your consent. They're only used to protect the site, not for advertising or audience measurement, and we don't use them to track you. The publisher of ${site.nom} chose this provider, and therefore remains responsible for these cookies, even when it's ${cloudflare} that sets them.`,
        `To do this, ${cloudflare} also adds two small scripts to our pages, served from our own address: one checks that your browser isn't a bot, the other protects our email address from bots that harvest addresses. These aren't cookies, and they're not used for advertising.`,
        "You can still block or delete these cookies from your browser (see below). The site's protection might then ask you for an extra check, or even stop you accessing the site while it's active.",
        `${cloudflare} is an American company, so data may be processed in the United States. This transfer is governed by the EU–US Data Privacy Framework, under which ${cloudflare} is certified, and by standard contractual clauses. The data processed and these safeguards are set out in our [privacy policy](/confidentialite#cloudflare). You can also read [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/).`,
      ],
    },
    {
      id: "mes-choix",
      titre: "Cookie settings: nothing to accept or reject for now",
      blocs: [
        "Looking for the “Reject all” button? Good news: **there's nothing to reject**. All the cookies in [the list](#liste-des-cookies) are strictly necessary: for the site's security, for the login you ask for, to respect your choice not to be counted in the statistics, or for your choice of language. The law exempts them from your consent, and none of them is used for ads or to track you.",
        "That's also why the banner offers neither “Accept all” nor “Reject all”: we're not going to ask you to accept something we don't do. The choice banner and its form are ready, and they'll only appear with the first optional cookie.",
        "What you can still do:",
        {
          liste: [
            "stop being counted in our statistics (anonymous, without cookies): one click on the [Your visits and our statistics](/statistiques) page;",
            "log out: the login cookie is deleted straight away;",
            "delete or block cookies from your browser (see just below): you'll then need to log in again, and the site's protection may ask you for another check.",
          ],
        },
        "The day optional cookies arrive (ads, videos…), the same “Cookie settings” link, at the bottom of every page of sosmiam.fr and its ambassador and pro areas, will reopen your choices, which you can change at any time. Without JavaScript, it brings you here, where a form will let you choose in the same way (see [Your choice, and how it will be respected](#ton-choix)).",
      ],
    },
    {
      id: "navigateur",
      titre: "Managing cookies in your browser",
      blocs: [
        "Whatever the site, your browser lets you decide. In its settings, often under a section called “Privacy”, “Privacy and security” or “Cookies”, you can usually:",
        {
          liste: [
            "see the cookies stored and delete them, site by site or all at once;",
            "block “third-party” cookies, meaning those set by sites other than the one you're visiting;",
            "block all cookies (be aware that some sites then work less well);",
            "use private browsing: cookies are deleted when you close the private windows.",
          ],
        },
        "On phones and tablets, these options are in the browser's settings, or sometimes in the device's settings. Your browser's help pages explain step by step where to find them.",
        "These settings only apply to the browser and device you make them on, so remember to set them again if you switch.",
        "To find out more, the CNIL publishes practical advice on [cnil.fr](https://www.cnil.fr).",
      ],
    },
    {
      id: "plus-tard",
      titre: "When ads or videos arrive",
      blocs: [
        "SOS Miam is free, for you and for venues alike. To fund it, we're planning **advertising, always labelled as such and with no effect whatsoever on how venues are ranked**. There isn't any yet.",
        "Later on, some tools may need cookies:",
        {
          liste: [
            "advertising;",
            "videos embedded from other platforms, for example those from creators who support a place with a BIG SOS.",
          ],
        },
        "**None of this is in place today.** Before any of these tools starts, we'll update this page (and the date at the top), as well as the [privacy policy](/confidentialite).",
        "This page will then list each cookie, with:",
        {
          liste: [
            "its name;",
            "what it's for;",
            "how long it stays in your browser;",
            "who sets it: SOS Miam or a partner, identified by name.",
          ],
        },
        "When the mobile app is released, it will have its own information too, published before it launches.",
      ],
    },
    {
      id: "ton-choix",
      titre: "Your choice, and how it will be respected",
      blocs: [
        "Those cookies will be **optional**: none will be set or read without your consent. The banner that will ask for your consent is already built. As long as the site has no optional cookies, it stays hidden and only the information banner appears. Here's how it will work:",
        {
          liste: [
            "it will appear at the bottom of the screen on your first visit, before any optional cookie is set, without stopping you from reading the page;",
            "**three buttons of the same size**: “Accept all”, “Reject all” and “Choose”. Rejecting will be as easy and as visible as accepting, in one click;",
            "“Choose” will open the details, purpose by purpose (videos and content from other sites, advertising, and audience measurement if a tool ever needs it), with the name of each partner and its cookies. Everything there will start unticked;",
            "closing the banner with the cross will count as rejecting. Scrolling the page or carrying on with your visit won't count as consent: without an answer, nothing optional will be set;",
            "a video, map or post from another site will be replaced by a thumbnail until you've said yes, with a button to show it anyway, just this once;",
            "your choice will be kept for **6 months**, then we'll ask you again; sooner, too, if the list of partners changes (a new partner, a new purpose);",
            "it will apply to sosmiam.fr and its ambassador and pro areas: one choice, not three banners;",
            "you'll be able to change it at any time with the “Cookie settings” link at the bottom of every page, even without JavaScript. Withdrawing your consent will be as easy as giving it: we'll then delete the cookies for that purpose that we can reach (those set on our addresses) and reload the page. Those that a partner sets on its own site can be deleted from your browser (see [Managing cookies in your browser](#navigateur)).",
          ],
        },
        "To remember your choice, a small cookie, **sosmiam-consentement**, will be stored in your browser for 6 months: what you accept or reject, the date and the version of the partner list, nothing else. It's only used to respect your decision, and the law exempts it from consent. It's already in [the list](#liste-des-cookies).",
      ],
    },
    {
      id: "contact",
      titre: "Any questions?",
      blocs: [
        `The data controller, including for cookies and other trackers, is the publisher of the site: ${editeur.nom}, ${editeur.statut} (see the [legal notice](/mentions-legales)).`,
        `A question about cookies? Contact us at ${lienContact}.`,
        "For anything to do with your personal data and your rights (access, erasure, objection…), read the [privacy policy](/confidentialite). You can also lodge a complaint with the CNIL at [cnil.fr/fr/plaintes](https://www.cnil.fr/fr/plaintes).",
      ],
    },
  ],
  chapitres: [
    { id: "c-est-quoi", titre: "What is a cookie?", sections: ["definition"] },
    { id: "chez-sos-miam", titre: "What we set today", sections: ["aujourd-hui", "liste-des-cookies", "cloudflare"] },
    { id: "gerer", titre: "Your choices", sections: ["mes-choix", "navigateur"] },
    { id: "demain", titre: "Later on: ads and videos", sections: ["plus-tard", "ton-choix"] },
    { id: "une-question", titre: "Any questions?", sections: ["contact"] },
  ],
};
