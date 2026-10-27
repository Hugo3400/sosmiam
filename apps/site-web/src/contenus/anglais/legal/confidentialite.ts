import { sectionAppAnglais, sectionAppComptesAnglais } from "~/contenus/anglais/legal/confidentialite-app";
import { sectionActusAnglais } from "~/contenus/anglais/legal/confidentialite-actus";
import { sectionBoiteAIdeesAnglais, sectionCommunauteAnglais, sectionSortiesMiamisAnglais } from "~/contenus/anglais/legal/confidentialite-communaute";
import { sectionDonneesAppAnglais } from "~/contenus/anglais/legal/confidentialite-donnees-app";
import { sectionMessagerieAnglais } from "~/contenus/anglais/legal/confidentialite-messagerie";
import { sectionMiamSafeAnglais, sectionPrevenirUnPoteAnglais } from "~/contenus/anglais/legal/confidentialite-miam-safe";
import { sectionSignalementsSociauxAnglais } from "~/contenus/anglais/legal/confidentialite-signalements-sociaux";
import { sectionPotesAnglais } from "~/contenus/anglais/legal/confidentialite-social";
import { sectionCandidaturesAnglais } from "~/contenus/anglais/legal/confidentialite-candidatures";
import { sectionCarteDesLieuxAnglais } from "~/contenus/anglais/legal/confidentialite-carte-des-lieux";
import { sectionSignalerImageAnglais } from "~/contenus/anglais/legal/confidentialite-signaler-image";
import { sectionChasseAuxBugsAnglais } from "~/contenus/anglais/legal/confidentialite-securite";
import { sectionCompteAmbassadeurAnglais } from "~/contenus/anglais/legal/confidentialite-compte-ambassadeur";
import { sectionCompteProAnglais } from "~/contenus/anglais/legal/confidentialite-compte-pro";
import { sectionConnexionAppleGoogleAnglais } from "~/contenus/anglais/legal/confidentialite-connexion-externe";
import { sectionConnexionQrAnglais } from "~/contenus/anglais/legal/confidentialite-connexion-qr";
import { editeur, hebergeur, prestataires, site } from "~/contenus/anglais/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienEmail = `[${site.emailContact}](mailto:${site.emailContact})`;
const lienPolitiqueCloudflare = "[privacy policy](https://www.cloudflare.com/privacypolicy/)";

export const documentConfidentialiteAnglais: DocumentLegal = {
  titre: "Privacy policy",
  description:
    "What SOS Miam does with your data: server logs, cookie-free visitor statistics, Cloudflare, emails, newsletter, applications, security flaw reports, ambassador and pro accounts, the mobile app, your crew, your messages, the Miamis and Miam Safe. No tracking cookies, zero reselling, and your rights spelled out.",
  miseAJour: "27 October 2026",
  introduction: [
    "Your data is like the secret recipe of a neighbourhood restaurant: we look after it and we never sell it to anyone. Here, we explain without jargon what SOS Miam collects today (spoiler: not much), why, for how long, and how you stay in control of it.",
    `This policy applies to the ${site.adresse} site and its subdomains, to the SOS Miam app (iPhone and Android), and to the emails you send to ${lienEmail}. It is written in accordance with the General Data Protection Regulation (GDPR, Regulation (EU) 2016/679) and the French Data Protection Act ({fr:loi Informatique et Libertés}, Law No. 78-17 of 6 January 1978).`,
    "A single SOS Miam account, for people aged 18 or over, works in the app (including for your crew, your messages, the Miamis and Miam Safe), in the ambassador area and in the pro area (to manage a venue's listing). There are no ads for now. This page describes what happens **today**, and it will be updated **before** each new feature.",
  ],
  enBref: [
    {
      liste: [
        "**No tracking cookies, no tracking, no ads.** The only possible exceptions, all strictly necessary: Cloudflare's security cookies, the cookie that keeps you logged in (to “My account”, your ambassador area or your pro area), two 10-minute cookies during a login with Apple or Google, a 2-minute cookie during a login with a QR code, the one that remembers that you've refused to be counted in the statistics, if you ask for it, and, on the site, where you were on the page, kept in your browser for the length of your visit (details below).",
        "**Server logs** keep a technical record of your visits (IP address, page requested…) for **15 days at most**, for security, then delete themselves automatically.",
        "**Visitor statistics, without cookies**: our server counts page views and visitors, without ever keeping your IP address or anything that would allow you to be recognised. You can refuse to be counted in one click, on the [Your visits and our statistics](/statistiques) page.",
        "**Cloudflare**, an American company, protects the site: all traffic passes through its servers, and data may be processed outside the European Union, notably in the United States, with the safeguards provided for by the GDPR.",
        "**The map of venues**: its base map comes from OpenFreeMap (OpenStreetMap data), but it always goes through our server: OpenFreeMap never sees your visit. Your location is never sent; only, if you tap “Near me”, a rounded location used to find your municipality, as with the 📍 button.",
        "**The newsletter**: we let you know when we launch near you, then keep sending you news until you unsubscribe (one click on “Unsubscribe” ({fr:Me désinscrire}) at the bottom of each newsletter, or a simple email, even just “STOP”). When you create an account, in the app or in the ambassador area, you choose when you sign up (a box ticked in advance, which you can untick): in the app, you're subscribed straight away; as an ambassador, once your application has been approved. If you untick it, we remember your “no”, so that we never subscribe you by mistake.",
        "**The “Keep me posted” form** on the site records your email address, your city or region, your phone (iPhone or Android) if you tell us, and your answers to the beta and ambassador boxes, on our server in France, to let you know about the launch and then send you the newsletter. If you ask for the beta, your address is passed on to Google or Apple so that they can invite you. If you tap the 📍 button, your rounded location is used only to find your municipality; our server doesn't keep it. Your IP address is used only to slow down bots: it's never recorded with your sign-up.",
        "**The “List my venue” form**: your venue's details are used to create its page if we accept the request; your name, your email and your phone number are used only to reply to you, and are never published.",
        "**Your application** (“Get involved” page): your name, your email, your message and, if you provide them, a link and your CV as a PDF. Everything is kept **encrypted**, only the publisher reads it, no third party receives it, and everything is deleted **6 months** after it's sent.",
        "**Your security flaw report** (“Bug hunt” page): your name or username, your email, your description of the flaw and, if you provide them, a link and screenshots. It's kept **encrypted**, only the publisher reads it, and it's deleted **2 years** after it's closed. Your name only appears in the hall of fame if you ask (see “[Your security flaw report](#chasse-aux-bugs)”).",
        "**If you write to us** (a venue to list, a problem with your account, a question), we keep your message for as long as it takes to follow it up, and **3 years at most** after your last contact. An application sent by email follows the rule for applications: **6 months** after it's sent, then we delete it (see “[Your application](#candidatures)”).",
        "**Your ambassador account** (18+): your email, your first name or nickname, your city and what you do in your area, to keep the programme going. Your password is never stored as it is. Your date of birth, given with your email and a password on the site, is used only to check your age: we don't keep it (in the app, or with Apple or Google, it's kept encrypted). After 1 year without any login to your account (app included), your ambassador role is removed; after 2 years without a login, your account is deleted (we email you a month before); and you can delete it yourself at any time.",
        "**Your pro area** (18+, to manage a venue's listing): with the same account, your request to manage a venue and what proves it's yours are seen only by the SOS Miam team; what you change on the listing is public, but without your name. A declined request or a withdrawn venue link is deleted 1 year later.",
        "**The SOS Miam app**: without an account, you browse, and nothing about you is kept. With an account, our server keeps your profile (without your special diets, which stay on your phone), your activity, your visits, your loyalty cards, your bookings, your reviews and, if you accept them, what's needed to send you notifications. Your location, only when you ask, is used to find your city, the venues around you or to check that you're at the venue when you confirm a visit, and is never kept. It's all summed up in [a table](#donnees-app).",
        "**Your crew and your messages**: the text of your messages, your photos, your voice notes and the titles of your groups are **encrypted** by our server; the SOS Miam team only reads a message if it's reported to them. Photos and voice notes can no longer be opened after **90 days**, and a conversation is deleted after **1 year** without a message. The preview of a message in a notification travels **encrypted for your phone alone** (Apple and Google can't read it), and you can turn it off, like “Seen”.",
        "**The Miamis** (meetups open to Miamis you don't know yet, “Who's around?” and the Suggestion box): your **gender**, optional, is **encrypted** and shown to no one; it's used only for restricted meetups. “Who's around?” only shows your username and your avatar, to the Miamis in your city, only if you choose to and for **3 hours**. An open meetup can only be seen by its audience and is deleted **1 year** after its date; your suggestions, your votes and your comments on suggestions can be seen by all the Miamis. “What I'm into” stays on your phone. Details in [The Miamis](#communaute).",
        "**“Alert a friend”** (Miam Safe): only if you trigger it, the friend you choose from your crew sees your location for **1 hour** at most; it's kept encrypted, then deleted as soon as the sharing ends.",
        "**We never sell your data**, and we don't rent it out.",
        `**You stay in control**: an email to ${lienEmail} is all it takes to access, correct or delete your data, or to object to its use. Your ambassador account can also be corrected and deleted directly in your area.`,
      ],
    },
  ],
  sections: [
    {
      id: "responsable",
      titre: "Who looks after your data",
      blocs: [
        `The data controller, that is, the person who decides what is done with your data and who is accountable for it, is **${editeur.nom}**, who publishes SOS Miam as a ${editeur.statut}. SOS Miam is not a business: everything on it is free and nothing is sold.`,
        `For any question about your data, write to ${lienEmail}.`,
        "There is no data protection officer (DPO): the law doesn't require one for an activity like this. The publisher replies to you personally.",
        "The hosting provider's contact details and other information about the publisher are in the [legal notice](/mentions-legales).",
      ],
    },
    {
      id: "journaux",
      titre: "Server logs",
      blocs: [
        "Like almost every site, our server records each page it sends in a log, right at its front door: the software that receives every request before passing it on to the site. This happens automatically as soon as you open a page.",
        {
          liste: [
            "**What's recorded**: your IP address (passed on by Cloudflare, see below), the date and time, the page requested, the server's response code, the address of the page you came from (the “referer”) and your browser's signature (the “user-agent”: browser type, system, version). For both the page requested and the page you came from, only the **path** is recorded, **without** anything after the “?”: no unsubscribe link, no search, no code. In the event of an error, an error log also keeps your IP address and the page requested, for the same length of time.",
            "**The site program's log**: the program that builds the pages also keeps its own log, which is much shorter: the type of request, the **path** of the page, **without** anything after the “?” (neither the code of a login QR code nor the username in an invitation), the response code and the response time. Not your IP address, not your browser, not the page you came from.",
            "**Why**: to spot and block attacks or abuse, and to understand an outage when something breaks. These logs aren't used to track you or to produce visitor statistics (those are counted separately, without keeping your IP address: see the next section).",
            "**Legal basis**: legitimate interest (Article 6(1)(f) GDPR). The interest pursued: keeping the site secure and working properly.",
            `**Where and who**: on our server, rented from ${hebergeur.nom} and located in France. ${hebergeur.nom} acts as a processor: it hosts the server on our behalf, and only the publisher looks at these logs.`,
            "**How long**: **15 days at most**, for each of these logs. A new log starts each day; we keep the previous 14, and the oldest one is deleted automatically.",
            "**Required?** You don't have to provide anything: this information is sent by your browser as soon as it requests a page.",
          ],
        },
      ],
    },
    {
      id: "statistiques",
      titre: "Visitor statistics",
      blocs: [
        "To find out whether SOS Miam interests people (how many visits, which pages, where visitors come from), our server counts the pages it sends itself. No analytics cookie, no script in your page, no outside service like Google Analytics: everything happens on our server.",
        {
          liste: [
            "**What's looked at, when you open a page**: the page requested (without anything after the “?”, except the name of a campaign: “?utm_…” or “?ref=”), the name of the site you came from (for example “google.com”, never the full address of the page), the name of the campaign if the link carries one (“?utm_campaign=…”, for example a TikTok video), the broad family of your device, your browser and your system (“Mobile, Safari, iOS”), your browser's language, the country and, if Cloudflare provides them, the approximate region and city it infers from your IP address, the time of your visit, the time the server takes to respond, your IP address and your browser's signature.",
            "**What's kept**: only **totals**: the number of page views, visits and visitors per day, week, month and year; the most viewed pages, entry and exit pages; the average length of visits and the share of single-page visits; the sites and campaigns people arrive from; types of device, browsers, systems, languages, countries, regions and cities; days and times of visits; clicks on the buttons of the [Links](/liens) page; server response times; requested pages that couldn't be found. **Never your IP address**, never an identifier, never your browsing history.",
            "**Counting without recognising**: to know how many different people have visited, your IP address and your browser's signature are scrambled with a randomly drawn secret code (one per day, one per week, one per month and one per year). The resulting hash is never recorded: it only updates a statistical counter (a “HyperLogLog sketch”) that estimates the number of visitors without keeping a list. Each secret code is deleted at the end of its period, along with its counter; a copy may still sit in our encrypted backups for **30 days at most**, then it disappears too: after that, no one can redo the calculation. To group together the pages of a single visit, the day's hash and the path of the visit (entry page, number of pages, last page, start time) stay in memory for 30 minutes at most after your last page, without ever being written to disk; after that, only totals are added (one more visit, its length, its exit page).",
            "**Why**: to know what people like and to improve the site. These statistics are used only by SOS Miam: they're not sold, passed on or combined with other data (your newsletter sign-up, for example), and they don't follow your browsing on other sites.",
            "**Legal basis**: legitimate interest (Article 6(1)(f) GDPR). The interest pursued: measuring the site's audience in order to improve it. This measurement meets the conditions set by the CNIL (the French data protection authority) for doing without your consent: use reserved to the publisher, anonymous statistics only, no combining or passing on, and secret codes that live for a year at most (and 30 more days, at most, in our encrypted backups).",
            "**How long**: the secret codes and the visitor counters disappear at the end of each period (the day, the week, the month or the year), and from our encrypted backups 30 days later at most; the daily detail (pages, sources, devices, countries…) is deleted after **25 months**. Only the anonymous totals of views, visits and visitors per period remain.",
            `**Your choice**: you can refuse to be counted, in one click, on the [Your visits and our statistics](/statistiques) page. A small cookie then remembers your refusal for 13 months, and is used only for that. If your browser sends the “Global Privacy Control” or “Do Not Track” signal, you're not counted at all, without doing anything. As we keep nothing that would allow us to recognise you, we can't find your past visits or remove them from the totals.`,
            "**Not counted as visitors**: bots and automated tools (we only count their visits, by name: “Google”, “Bing”…), pages preloaded by your browser without you opening them, and the version of the site in preparation.",
            `**Where and who**: on our server, rented from ${hebergeur.nom} and located in France. Only the publisher looks at these statistics.`,
          ],
        },
      ],
    },
    {
      id: "cloudflare",
      titre: "Cloudflare, which protects the site",
      blocs: [
        `All traffic to ${site.adresse} passes through **${prestataires.reseau.nom}**, an American company (${prestataires.reseau.adresse}). It delivers the site and protects it: in practice, it sits between your browser and our server to deliver pages quickly and stop attacks before they reach us. To do this, it decrypts what passes through along the way, then encrypts it again on the way to our server.`,
        {
          liste: [
            "**What's processed**: your IP address and the data of each request (page requested, date and time, information sent by your browser, and what you send, for example in a form).",
            "**Why**: to display the site quickly and protect it, in particular against denial-of-service attacks and malicious bots.",
            "**Legal basis**: legitimate interest (Article 6(1)(f) GDPR). The interest pursued: keeping the site available, fast and secure for everyone.",
            `**Who**: ${prestataires.reseau.nom} acts as a processor: it processes this data on our behalf, under its data processing agreement, except for the use described just below.`,
            `**On its own behalf**: according to its ${lienPolitiqueCloudflare}, Cloudflare also derives analyses and statistics from the traffic it routes, which help it to spot and block malicious activity on its network. For this use, it acts as a separate data controller, and its own policy applies.`,
            `**Outside the European Union**: Cloudflare has servers all over the world, and data may be processed outside the European Union, notably in the United States. To the United States, the transfer is governed by the **EU–US Data Privacy Framework**, recognised by an adequacy decision of the European Commission of 10 July 2023, which Cloudflare has joined (certification can be checked on [dataprivacyframework.gov](https://www.dataprivacyframework.gov/)). To other countries, it's governed by the European Commission's **standard contractual clauses**, provided for in its [data processing agreement](https://www.cloudflare.com/cloudflare-customer-dpa/). You can also get a copy of these clauses by writing to us at ${lienEmail}.`,
            `**How long**: on our behalf, Cloudflare keeps this data for as long as necessary to deliver the pages and protect the site, and at most until the end of our contract with it; its data processing agreement then requires it to delete the data or return it to us. For the use it makes on its own behalf, the periods are those set out in its ${lienPolitiqueCloudflare}.`,
            "**Required?** It's automatic: it's the route by which the site reaches you.",
          ],
        },
        "**And cookies?** Cloudflare sets a strictly necessary security cookie, “cf_clearance”, which remembers that your browser has passed its anti-bot check (duration observed: 1 year); in some cases, it may also set “__cf_bm”, which helps to tell humans from bots and expires after about 30 minutes. These essential cookies don't require your consent: all the details are on the [Cookies](/cookies#liste-des-cookies) page.",
      ],
    },
    sectionCarteDesLieuxAnglais,
    sectionSignalerImageAnglais,
    {
      id: "newsletter",
      titre: "The newsletter",
      blocs: [
        `You can sign up in two ways: with the “Keep me posted” form on the site (details in the next section), or by writing to us at ${lienEmail}, for example with the subject “SOS Miam newsletter sign-up”. What follows applies to both.`,
        "And two cases where it's decided when you sign up. **If you create an account in the app**, a box offers you the newsletter: you can untick it, and in that case we don't subscribe you. If you leave it ticked, you're subscribed straight away if you use Apple or Google (they've already verified your address); with your email and a password, only after you click the confirmation link we send you (see “The confirmation” below). **If you sign up as an ambassador**, the same box is waiting for you in the form: ticked, you're subscribed once your application has been approved, to keep up with the programme; unticked, we don't subscribe you. If you untick it, in the app or as an ambassador, your email address joins the list of unsubscribed addresses (see “The list of subscribers” below, **3 years**), so that we never subscribe you by mistake. In both cases, we only take your email address and your city, and you can unsubscribe in one click at any time (see “Unsubscribing” below); your account doesn't depend on it.",
        {
          liste: [
            "**What we receive**: through the form, what's described in the next section; by email, your email address, the name shown by your email app, the city you give and whatever you choose to add to the message.",
            "**Why**: to let you know when SOS Miam launches near you, then to send you news (new venues, new cities, BIG SOS…) through the newsletter.",
            "**Legal basis**: your consent (Article 6(1)(a) GDPR), which you give by sending the email, or by confirming the form with the link we send you, and which you can withdraw at any time. For app accounts and ambassadors: our legitimate interest (Article 6(1)(f) GDPR) in sending you news of SOS Miam, whose service you already use, within the framework of Article L. 34-5 of the French Postal and Electronic Communications Code ({fr:Code des postes et des communications électroniques}): you can refuse when you sign up, then with each newsletter, free of charge.",
            `**Where and who**: if you sign up by email, your email arrives in the ${site.emailContact} mailbox, provided by ${prestataires.messagerie.nom}; it's received by a mail server located in Switzerland (see “Who sees your data, and where it is”). Only the publisher looks at this mailbox.`,
            `**The list of subscribers**: to send you the newsletter, sign-ups from the form and those received by email are brought together in one list (your email address, your city, your phone and your beta choice if you gave them in the form, the language of your request, so we can write to you in French or English, the date you signed up and the date of your last message), kept on our server, rented from ${hebergeur.nom} and located in France. Only the publisher has access to it, and it follows the same retention rules: if you unsubscribe, your entry is removed from the list and deleted from our database before any new mailing, city included. Only your email address and the date you unsubscribed remain, for **3 years**, in a separate list: it's used only to make sure we never subscribe you again by mistake (for example if your address turns up in an import). Your address also goes into it, with the date, if you untick the newsletter box when creating your account.`,
            "**How long**: as long as you stay subscribed, you keep receiving the newsletter, even after the launch. If we've had no message at all from you for 3 years, we ask whether you want to carry on; without a reply, we delete your address. Your sign-up or unsubscribe email stays in our mailbox as proof of your choice, for 3 years at most.",
            "**Required?** No, none of it is. Without an email address, we simply can't let you know; your city helps us to do it at the right time.",
            `**Sending**: the newsletter goes out from our ${site.emailContact} mailbox, with ${prestataires.messagerie.nom}, with no other provider, and the publisher sends it manually. Just before each mailing, the unsubscribe requests received are removed from the list. The sending log (your address, the date and the result of the sending) is deleted after **90 days**; the text of the newsletter, the same for everyone, is kept without any address.`,
            `**Unsubscribing**: in one click, with the “Unsubscribe” link ({fr:Me désinscrire}) at the bottom of each newsletter, or the unsubscribe button your email app displays. This link is unique to you: it contains your email address (encoded, not encrypted) and a signature that stops anyone else from unsubscribing you, nothing more. Like any address visited, it goes into the server's front-door log (15 days at most); the site program's log, for its part, only records “/desinscription”. You can also write to ${lienEmail} or reply “STOP” to a newsletter, without having to give a reason.`,
          ],
        },
      ],
    },
    {
      id: "formulaire",
      titre: "The “Keep me posted” form",
      blocs: [
        "At the bottom of the site's home page, the “Keep me posted” form asks for your email address and your city or region (which you type yourself, with suggestions). It also offers you, with no obligation, the chance to say whether you have an iPhone or an Android, to test the app before its release (beta) and to become an ambassador (18+).",
        {
          liste: [
            "**What we record**: your email address, your city or region, your phone (iPhone or Android) if you give it, your choices for the beta and ambassador boxes, the dates of your first and your last sign-up, and the fact that the sign-up came from the site. If you fill in the form several times, we keep a single entry, updated when you confirm with the link you receive.",
            "**The confirmation**: sending the form isn't enough. We first send you an email with a confirmation link, valid for **7 days** and only once: until you've clicked, you're not subscribed and you don't receive any newsletter. In the meantime, your request (what you entered, and a hash of the link, never the link itself) is kept separately, on our server; without a click, it's deleted during the night after the 7 days end. So as not to fill the inbox of someone who hasn't asked for anything, a new link goes out at most once an hour, and 3 times at most for the same request. The message displayed after sending is the same for everyone: it never says whether an address is already subscribed.",
            "**Why**: to let you know about the launch in your city, then send you the newsletter; to know which store (Apple's App Store or Google's Play Store) to publish the app on first; if you ticked the boxes, to invite you to test the beta and to create your account in the ambassador area.",
            "**Legal basis**: your consent (Article 6(1)(a) GDPR), which you can withdraw at any time.",
            `**Where and who**: in a database on our server, rented from ${hebergeur.nom} and located in France. Only the publisher has access to it.`,
            "**How long**: as for the newsletter, as long as you stay subscribed; if you unsubscribe, your entry is deleted before any new mailing; after 3 years without any message from you, we ask whether you want to carry on, otherwise we delete it.",
            "**Your IP address**: the site passes it on to our server to limit the number of submissions (5 every 10 minutes), against bots. It's only held in memory, for about ten minutes, and is never recorded with your sign-up.",
            "**Your location, if you tap the 📍 button**: your browser first asks for your consent. Your location, rounded to about 100 metres, is sent to our server, which asks the French State's public service geo.api.gouv.fr (run by the interministerial digital directorate, {fr:direction interministérielle du numérique}) for the municipality located there, with its department and region; your own IP address isn't passed on to it. Our server keeps neither your location nor the answer: the municipality found just fills in the field, and you can change it before sending. geo.api.gouv.fr may, for its part, keep a technical record of the request (the rounded location, coming from our server), under its own terms. To curb abuse, your IP address is also used to limit the number of searches (20 every 10 minutes), as for the form, without being recorded. Legal basis: your consent, which you give by tapping the button.",
            "**For the beta**: when we invite you, and only if you ticked the box, we pass your email address on to Apple (TestFlight, if you're on iPhone), which sends you the invitation, or to Google (the Play Console testers list, if you're on Android), and we then send you the link to join the test ourselves. Google and Apple then manage access to the test version, under their own privacy rules. On Android, Google needs the address of your Google account. Once ticked, the beta and ambassador boxes stay ticked even if you send the form again without them: you no longer want to test, or to be an ambassador? An email is enough, and we'll take you off the list.",
            "**Required?** Only the email is essential to let you know. Your city or region (which tells us when to let you know), your phone and the beta and ambassador boxes are optional. For the beta, we just need to know whether you have an iPhone or an Android.",
          ],
        },
        "Like any visit, sending the form goes through Cloudflare and appears in the server logs. The logs record the page called, not what you entered. Cloudflare, however, sees what you send, as with any request.",
      ],
    },
    {
      id: "demande-lieu",
      titre: "The “List my venue” form",
      blocs: [
        "On the [List my venue](/inscrire-mon-lieu) page, a venue can ask to be on SOS Miam. The request arrives in our management software, where the publisher accepts or declines it.",
        {
          liste: [
            "**What we receive about the venue**: its name and city, its description and, if you give them, its type, its address, its signature dish, its opening hours, its website and its Instagram account. If the request is accepted, this information is used to create the venue's page, which will be public.",
            "**What we receive about you**: your name, your email and, if you give it, your phone number. They're never published.",
            "**Why**: to review the request, create the venue's page and reply to you.",
            "**Legal basis**: steps taken at your request prior to entering into a contract (Article 6(1)(b) GDPR): you ask us to list your venue, and this information is necessary to do so.",
            `**Where and who**: in a database on our server, rented from ${hebergeur.nom} and located in France. Only the publisher has access to it.`,
            "**How long**: your contact details are deleted when we no longer need them for your request; the whole request, contact details included, is deleted automatically **3 years after our decision** (or 3 years after it was sent, if no decision was ever made). If it's accepted, the venue's information becomes its page, which you can have changed or removed at any time with a simple email.",
            "**Your IP address**: as with the “Keep me posted” form, it's used only to limit the number of submissions (3 every 30 minutes) and is never recorded with your request.",
            "**Required?** The venue's name, its city, its description, your name and your email: without them, we can neither review the request nor reply to you. The rest is optional.",
          ],
        },
      ],
    },
    sectionCandidaturesAnglais,
    sectionChasseAuxBugsAnglais,
    {
      id: "messages",
      titre: "Your messages to us: venues, ambassadors, questions",
      blocs: [
        `You can also write to us at ${lienEmail} to list your venue (the [List my venue](/inscrire-mon-lieu) form is the simplest way), about a problem with your ambassador account (if “Forgotten your password?” doesn't work, for example) or simply to ask a question.`,
        {
          liste: [
            "**What we receive**: your email address, the name shown by your email app and the content of your message. For a venue: its name, its city and its type (restaurant, patisserie, bar, thing to do…).",
            "**Why**: to reply to you, review your venue's listing request, help you with your account, and get back to you about it.",
            "**Legal basis**: legitimate interest (Article 6(1)(f) GDPR). The interest pursued: following up on the messages we receive and promoting independent venues. For a problem with your ambassador account, it's the performance of the Terms of Use (Article 6(1)(b) GDPR).",
            `**Where and who**: in the ${site.emailContact} mailbox, provided by ${prestataires.messagerie.nom}; emails are received by a mail server located in Switzerland (see “Who sees your data, and where it is”). Only the publisher looks at this mailbox.`,
            "**How long**: for a venue request or an application, at most 3 years after your last contact. For a question or a problem with your account, as long as it takes to reply to you, then at most 3 years.",
            "**Required?** No. Without an email address, we simply can't reply to you.",
          ],
        },
        "There's no need to send us sensitive information (health, opinions, bank details…): we have no use for it.",
      ],
    },
    sectionCompteAmbassadeurAnglais,
    sectionCompteProAnglais,
    sectionConnexionAppleGoogleAnglais,
    sectionConnexionQrAnglais,
    sectionAppAnglais,
    sectionAppComptesAnglais,
    sectionDonneesAppAnglais,
    sectionPotesAnglais,
    sectionMessagerieAnglais,
    sectionCommunauteAnglais,
    sectionSortiesMiamisAnglais,
    sectionBoiteAIdeesAnglais,
    sectionActusAnglais,
    sectionSignalementsSociauxAnglais,
    sectionMiamSafeAnglais,
    sectionPrevenirUnPoteAnglais,
    {
      id: "ce-qu-on-ne-fait-pas",
      titre: "What we don't do",
      blocs: [
        {
          liste: [
            "**We never sell your data**, we don't rent it out, and we only entrust it to the technical providers listed below, on our behalf (unless the law requires otherwise).",
            "**No tracking cookies**: to date, our pages don't set any. The only possible exceptions: Cloudflare's security cookies described above, the cookie that remembers your refusal to be counted in the statistics, if you ask for it, the one that keeps you logged in (to “My account”, your ambassador area or your pro area) and, for the length of a login with Apple or Google, two 10-minute cookies (or, for a login with a QR code, a 2-minute cookie). The full list is on the [Cookies](/cookies#liste-des-cookies) page.",
            "**Almost nothing in your browser**: the site only keeps, in your browser's session storage, where you were on each page, to take you back there when you go back, and sometimes the site's version number after an update. No identifier, no personal data, and it's all cleared when you close the tab: it's strictly necessary for browsing, so no consent is asked for.",
            "**No outside audience measurement tool** (no Google Analytics, no social media pixel): our visitor statistics are counted by our server, without cookies (see “Visitor statistics”). And **no advertising** for now.",
            "**No embedded third-party content**: no video, map or social media button that would tell another service about your visit. Even our fonts are hosted with the site, on our server at our hosting provider.",
            `**No automated decision-making within the meaning of Article 22 GDPR**: no decision producing legal effects concerning you, or significantly affecting you, is based solely on automated processing. Only Cloudflare's security filtering can automatically ask you for a check or block a request it considers malicious; after several wrong passwords, our server makes you wait a little before trying again; and it automatically refuses a sign-up from anyone under 18 (in the app, the ambassador area or the pro area), based on the date of birth you give (a refused sign-up leaves nothing on our server). In the app, the word filter automatically refuses a text containing a common insult, and a report for violence or sexual content can hide content immediately, until a member of the SOS Miam team decides (see the [Terms of Use](/cgu#moderation)). If you're wrongly blocked, write to us at ${lienEmail}. All other ambassador sign-ups, and every request to manage a venue, are looked at by a person.`,
          ],
        },
      ],
    },
    {
      id: "destinataires",
      titre: "Who sees your data, and where it is",
      blocs: [
        "Your data is only looked at by the publisher of SOS Miam. The technical providers below process it on the publisher's behalf, under their contract (they're “processors” within the meaning of the GDPR):",
        {
          liste: [
            `**${hebergeur.nom}** (${hebergeur.adresse}): hosting of the site's server, in France.`,
            `**${prestataires.messagerie.nom}**: ${prestataires.messagerie.role}; emails are received by a mail server located in Switzerland, and our emails also go out through this mailbox (the newsletter, and the emails for your ambassador account: confirmation of your email address, welcome, programme news, warnings before the role is removed or the account is deleted, a link for a new password you asked for). Our server keeps a log of these sendings (address, type and subject of the email, date, result) for 90 days, even if the account is deleted in the meantime. A copy of each email we send to you personally (automatic, or written by the SOS Miam team) is filed in the “Sent” folder ({fr:Envoyés}) of our mailbox, with personal links masked (such as a new password link), and deleted automatically after **90 days**; for the newsletter, a single copy of each mailing is filed, without any address.`,
            `**${prestataires.reseau.nom}** (${prestataires.reseau.adresse}): ${prestataires.reseau.role}. For the security of its own network, it also uses some data on its own behalf (see “Cloudflare, which protects the site”).`,
          ],
        },
        "These providers may themselves use other technical providers (“sub-processors”), who must meet the same obligations to protect your data.",
        "Only if you've asked to test the beta, your email address is passed on to **Google** (the Play Console testers list, for Android) or to **Apple** (TestFlight, for iPhone) when we invite you. And only if you tap the 📍 button on the form or “Near me” on the Places page, your rounded location is sent by our server to the public service **geo.api.gouv.fr** to find your municipality: our server keeps none of it. The base map of the map of venues comes from **OpenFreeMap**, but it's our server that requests it: OpenFreeMap receives nothing from you (see “[The map of venues](#carte-des-lieux)”). Finally, if a venue you suggested from your ambassador area joins SOS Miam, your first name may appear on its page, visible to everyone (“Spotted by”); and if you become a certified ambassador, the “Certified Ambassador ✓” badge appears with your first name and, if you gave one, the name of your organisation, on the pages of the venues you've helped. There's no public list of certified ambassadors.",
        "In the app, and only when you ask, your location is sent to your phone's service (**Apple**'s on iPhone, **Google**'s on Android) to find the name of your city; on iPhone, the Explore map is drawn by **Apple Maps**, which receives the area you're looking at. Notifications go through **Apple**'s service (APNs) or **Google**'s (Firebase Cloud Messaging), which receives their title and text to deliver them to your phone: for messages and the Miamis, the person's first name and, depending on the case, the title of a group or a get-together and the name of its venue, and the kind of message; the preview of a message, however, travels **encrypted for your phone alone**, which they can't read (see “Your messages”). When a GIF is displayed, its image comes directly from **GIPHY** (GIPHY, Inc., in the United States), which then sees your phone's IP address; your search, however, goes through our server, without your account or your IP address. Their own privacy rules then apply (see “The SOS Miam app: on your phone”).",
        "And of course, what you share in the app goes to the people you choose: your messages to the members of the conversation, your “Alert a friend” location to the one friend you choose, your profile and your lists according to your settings (see “Your crew, your followers and your profile”), an open meetup to its audience only, your presence in “Who's around?” to the Miamis in your city, and your suggestions and your comments on suggestions to all the Miamis (see [The Miamis](#communaute)).",
        "If the law requires it, some data may be disclosed to an authority that requests it within a legal framework, for example by court order. No one else receives it.",
        `**Transfers outside the European Union**: the site's server is in France. Emails sent to ${site.emailContact} are received by a server located in Switzerland: Switzerland benefits from an adequacy decision of the European Commission (Decision 2000/518/EC of 26 July 2000), which recognises that your data is as well protected there as in the European Union. Cloudflare may process data outside the European Union, notably in the United States, with the safeguards described in the “Cloudflare, which protects the site” section. Finally, if you ask for the beta, Google or Apple may process your address in the United States: for Google, the transfer is governed by the **EU–US Data Privacy Framework**, which Google LLC has joined (certification can be checked on [dataprivacyframework.gov](https://www.dataprivacyframework.gov/)); for Apple, by the European Commission's **standard contractual clauses**, as stated in its [privacy policy](https://www.apple.com/fr/legal/privacy/fr-ww/).`,
      ],
    },
    {
      id: "securite",
      titre: "How we protect your data",
      blocs: [
        {
          liste: [
            "**Encrypted connection**: the whole site uses HTTPS. The connection is encrypted from your browser to Cloudflare, then from Cloudflare to our server; Cloudflare decrypts the traffic along the way to protect it.",
            "**A single administrator**: the publisher is the only person who administers the server and looks at the logs, the mailbox and the ambassador accounts (from software protected by a password and a 6-digit code).",
            "**Your messages encrypted**: the text of your messages, the venues you send, your photos, your voice notes, the titles of your groups, your invitation code, your gender (if you give it), the “Alert a friend” location and the copy of reported content are encrypted by our server (AES-256-GCM), with keys derived from a key kept outside the database. This isn't “end-to-end” encryption: our server decrypts them to show them to you, but a stolen copy of the database or of a backup wouldn't reveal them. Our server never writes the content of a message to its logs.",
            "**Protected passwords**: we never keep your password, only a hash computed with scrypt, a method deliberately designed to be slow to attack; your login keys are also kept as hashes. And anyone who tries to guess a password is quickly slowed down (see “Your ambassador account”).",
            "**Protection against attacks**: Cloudflare filters malicious traffic before it reaches the server.",
            "**As little as possible, for as short a time as possible**: we collect only what's strictly necessary, and the logs delete themselves after 15 days at most. What we don't have can't leak.",
            "**Encrypted backups**: so that nothing is lost in the event of an outage, an encrypted copy of our database is made every night on our server, in France, and we keep the last 30. An encrypted copy may also be kept on the publisher's computer, under the same rule. When data is deleted from the database, it disappears from the backups 30 days later at the latest.",
            "**Exports, only when necessary**: the SOS Miam team may export a list (newsletter subscribers, ambassadors, or an account's data when you ask us for a copy) to the publisher's computer, which is protected, and deletes it as soon as it has served its purpose.",
          ],
        },
        "If a security incident affected your data, we would report it to the CNIL within 72 hours where the law requires it, and we would inform you directly if the risk to you were high.",
      ],
    },
    {
      id: "droits",
      titre: "Your rights",
      blocs: [
        "Regarding the data that concerns you, you have the following rights:",
        {
          liste: [
            "**Access**: to know whether we hold data about you, and to receive a copy of it.",
            "**Rectification**: to have anything inaccurate or incomplete corrected (for your ambassador account, you can also do it yourself in “My account”).",
            "**Erasure**: to have your data erased, for example when you withdraw your consent or when it's no longer needed (your ambassador account can also be deleted online, in “My account”).",
            "**Restriction of processing**: to have the use of your data frozen for a time, for example while a dispute is being looked into.",
            "**Objection**: to object to processing based on our legitimate interest (see just below).",
            "**Data portability**: to receive the data you've provided to us with your consent or for your account (newsletter, form, application, ambassador account, app account) in a machine-readable format, or to have it sent to another service where technically possible. Your social data (crew, lists, messages…) you download yourself in the app (see “How to exercise your rights”).",
            "**Withdrawal of consent**: at any time, as simply as you gave it. What was done before remains valid.",
            "**Instructions for after your death**: to tell us what should happen to your data after your death (retention, erasure, disclosure) and to appoint someone to carry out these instructions, as provided for by the French Data Protection Act.",
          ],
        },
        `**Your right to object**: for the server logs, visitor statistics, Cloudflare, your messages to us, the SOS Miam team's note and the attempt limits on your ambassador account, which are based on our legitimate interest, you can object at any time to the processing of your data on grounds relating to your particular situation (Article 21 GDPR). We then stop, unless there are compelling legitimate grounds that override it, such as the security of the site, or if the data is needed for the establishment, exercise or defence of legal claims. Write to ${lienEmail}. For visitor statistics, it's even simpler: one click on the [Your visits and our statistics](/statistiques) page.`,
      ],
    },
    {
      id: "exercer-tes-droits",
      titre: "How to exercise your rights",
      blocs: [
        {
          liste: [
            "**Your social data, without writing to us**: in the app, “Download my social data” ({fr:Télécharger mes données sociales}), in Profile › ⚙️ Settings › Your data ({fr:Profil › ⚙️ Paramètres › Tes données}), **2 times per 24 hours** at most, gives you a file (in JSON format) with your crew, your requests, your blocks, the people you follow and your followers, your conversations with **your** messages, your reactions, your groups and your get-togethers, your lists, your comments, your notifications, your reports (what you wrote, and where they stand), what you've hidden and the restrictions on your account (the rule, the explanation, the dates and your complaint, without any SOS Miam team member's name). Never other people's messages, nor what they haven't shown you, nor your invitation code; photos and voice notes aren't attached (only their date, their type and their size). The file only stays on your phone for as long as it takes to save it or share it wherever you like. The copy the SOS Miam team can make for you on request also contains your social data but, for your conversations, only what surrounds them (who with, when), **never their content**. The Miamis data (your gender, your open meetups and your spots, your suggestions, your votes, your comments on suggestions and your waves) **isn't included yet**: it's coming to this file **soon**; in the meantime, write to us for a copy.",
            `**Write to us** at ${lienEmail} stating the right you want to exercise. For the server logs, also give your IP address and the time of your visit: without that, it's impossible to find the lines that concern you (and they disappear anyway after 15 days at most).`,
            "**For the logs, a precaution**: as an IP address may be shared by several people (home router, public Wi-Fi, mobile network), we may ask you for something to check that it really was yours at that time, and we won't give you lines that could concern someone else.",
            "**We reply within one month** at most. If your request is complex, this period may be extended by two months: we then let you know within the first month, explaining why.",
            "**We only ask you to prove your identity if there's reasonable doubt**, for example if the request doesn't come from the email address concerned. No copy of an identity document as a matter of course.",
            "**It's free.**",
          ],
        },
      ],
    },
    {
      id: "cnil",
      titre: "Complaints to the CNIL",
      blocs: [
        "If you believe your rights aren't being respected, you can lodge a complaint with the CNIL ({fr:Commission nationale de l'informatique et des libertés}), the French data protection authority, directly [online](https://www.cnil.fr/fr/plaintes).",
        `You can also write to us first at ${lienEmail}: we'd like a chance to put things right.`,
      ],
    },
    {
      id: "mineurs",
      titre: "Minors",
      blocs: [
        "An SOS Miam account (in the app, the ambassador area or the pro area) is reserved for people of legal age: **18 or over** in France. Without an account, the site can be visited at any age.",
        "The newsletter and the “Keep me posted” form remain open to everyone. In France, the French Data Protection Act allows you to consent on your own to the processing of your data from the age of **15**: if you're under 15, you need the consent of your parents (or of the person with parental authority), in addition to your own, before signing up.",
        `If we learn that a child under 15 has signed up without this consent, we delete their data. A parent can let us know at ${lienEmail}.`,
        "Your date of birth is used to check that you're 18 or over: if you create your account on the site with your email and a password (ambassador or pro area), it isn't kept; in the app, or with Apple or Google, it's kept encrypted (see “The SOS Miam app: your account”). If we learn that an account belongs to someone under 18, or if a parent tells us so, we delete it along with its data.",
      ],
    },
    {
      id: "a-venir",
      titre: "What's coming later",
      blocs: [
        "SOS Miam is going to grow. Here's what's planned, **but doesn't work today**:",
        {
          liste: [
            "**Advertising**, always labelled as such, and **embedded videos**: anything that isn't essential will only be switched on with your consent, collected through a banner that complies with the CNIL's rules, and your choice will be kept for 6 months.",
            "**Text messages (SMS)**, perhaps one day: promotional ones will only be sent with your explicit consent (a box that isn't ticked in advance), and “STOP” will be enough to stop them.",
            "**App crash tracking**, to fix bugs faster: if it comes, this page will say beforehand which service does it and what it receives.",
            "**Support vouchers**, to pay in advance at a venue while it has a BIG SOS. How payment will work hasn't been decided yet.",
          ],
        },
        "Before each of these new features starts, this policy (and the [Cookies](/cookies) page if needed) will be updated to say what is collected, why, on what legal basis, for how long and by which provider.",
      ],
    },
    {
      id: "mises-a-jour",
      titre: "Updates to this policy",
      blocs: [
        "This policy describes what happens on the date shown at the top of the page. We update it with every change, and always **before** a new processing operation starts.",
        "If a change affects data you've already entrusted to us, we'll let you know, and we'll ask for your consent again where necessary.",
      ],
    },
  ],
  chapitres: [
    { id: "qui-on-est", titre: "Who we are", sections: ["responsable"] },
    { id: "quand-tu-visites", titre: "When you visit the site", sections: ["journaux", "statistiques", "cloudflare", "carte-des-lieux", "signaler-image"] },
    { id: "quand-tu-nous-ecris", titre: "When you sign up or write to us", sections: ["newsletter", "formulaire", "demande-lieu", "candidatures", "chasse-aux-bugs", "messages"] },
    {
      id: "ton-compte-et-l-app",
      titre: "Your account and the app",
      sections: ["compte-ambassadeur", "compte-pro", "connexion-apple-google", "connexion-qr", "app", "app-comptes", "donnees-app"],
    },
    {
      id: "ta-bande-et-tes-messages",
      titre: "Community: your crew, your messages and the Miamis",
      sections: ["potes", "messagerie", "communaute", "sorties-miamis", "boite-a-idees", "actus", "signalements-sociaux"],
    },
    { id: "en-securite", titre: "Miam Safe", sections: ["miam-safe", "prevenir-un-pote"] },
    { id: "jamais", titre: "What we don't do", sections: ["ce-qu-on-ne-fait-pas"] },
    { id: "avec-qui", titre: "Who with, where, and how it's protected", sections: ["destinataires", "securite"] },
    { id: "tes-droits", titre: "Your rights, and how to exercise them", sections: ["droits", "exercer-tes-droits", "cnil"] },
    { id: "moins-de-18-ans", titre: "Minors", sections: ["mineurs"] },
    { id: "la-suite", titre: "What's going to change", sections: ["a-venir", "mises-a-jour"] },
  ],
};
