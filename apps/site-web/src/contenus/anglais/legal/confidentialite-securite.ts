import { hebergeur, prestataires, site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienEmail = `[${site.emailContact}](mailto:${site.emailContact})`;

export const sectionChasseAuxBugsAnglais: SectionLegale = {
  id: "chasse-aux-bugs",
  titre: "Your security flaw report (“Bug hunt” page)",
  blocs: [
    "On the [Bug hunt](/securite) page, you can report a security flaw to us using a form. Your report arrives in our management software, and nowhere else.",
    {
      liste: [
        "**What we keep**: your name or username, your email, where the flaw is (the site, the ambassador and pro areas, the API or the app), the title and description of your report, the link you give if you give one, your screenshots if you attach any, and the name to show in the hall of fame if you ask for it. We also keep the date you sent it and the status of your report. Your report is kept **encrypted** in our database. Your screenshots are checked and stripped of their metadata (such as where they were taken or the device model), then stored **encrypted** on our server, separately. For your age, you simply tick “I'm 18 or over”: we don't ask for your date of birth.",
        "**Why**: to fix the flaw, reply to you, and thank you: the “Bug Hunter” badge on the SOS Miam account with the same email address (if it's confirmed there), your name in the hall of fame if you want it, a certificate and, for some flaws, a cash reward.",
        "**Legal basis**: our legitimate interest in protecting SOS Miam and its users (Article 6(1)(f) GDPR): without this information, we couldn't understand the flaw, fix it or reply to you.",
        `**Who sees it**: only the publisher of SOS Miam, in our management software (protected by a password and a 6-digit code); your screenshots can only be opened there. Like the whole site, your report passes through our usual technical providers, who work on our behalf: ${prestataires.reseau.nom} in transit (see “Cloudflare, which protects the site”) and ${hebergeur.nom}, which rents us our server, located in France. No resale, no sharing. Only the name you choose for the hall of fame is public, along with a month.`,
        `**How long**: your report is deleted automatically **2 years after it's closed** (flaw fixed, or report not accepted), screenshots included. A copy may still sit in our encrypted backups for **30 days at most**, then it disappears too. Your name stays in the hall of fame for as long as you want: a simple email to ${lienEmail} is enough to remove it. The badge stays on your account, like your other badges.`,
        "**Your IP address**: as with the other forms, it's only used to limit the number of submissions, and is never stored with your report.",
        `**Your rights**: you can view your report, correct it or have it deleted, remove your name from the hall of fame, or object to this processing, with a simple email to ${lienEmail} (see “[Your rights](#droits)”).`,
        "**Required?** Your name or username, your email, where the flaw is, the title, the description and the two boxes (“I'm 18 or over” and “I've read the rules”): without them, we can neither understand the flaw nor reply to you. The link, the screenshots and the hall of fame are optional.",
      ],
    },
    "If you happen to come across someone else's data during your research, don't keep it and don't put it in your report: just tell us what you saw, and we'll take care of the rest.",
  ],
};
