import { hebergeur, prestataires, site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienEmail = `[${site.emailContact}](mailto:${site.emailContact})`;

export const sectionCandidaturesAnglais: SectionLegale = {
  id: "candidatures",
  titre: "Your application (“Get involved” page)",
  blocs: [
    "On the [Get involved](/carriere) page, you can apply for a volunteering or freelance role using a form. Your application arrives in our management software, and nowhere else.",
    {
      liste: [
        "**What we keep**: the role you chose, your name, your email, your message, the link to your work if you give one, your CV as a PDF if you attach one, the date you sent it and the status of your application (new, read, shortlisted or not). Your name, email, message and link are **encrypted** in our database, and your CV is stored **encrypted** on our server, separately. To limit applications to a few a day, we also keep a hash of your email: a code derived from your address that can't be used to recover it. For your age, you simply tick “I'm 18 or over”: we don't ask for your date of birth.",
        "**Why**: to review your application, and to write to you if we move forward together.",
        "**Legal basis**: steps taken at your request prior to entering into a contract (Article 6(1)(b) GDPR): you're offering to join SOS Miam, as a volunteer or a freelancer, and this information is needed to review your offer.",
        "**Who sees it**: only the publisher of SOS Miam, in our management software (protected by a password and a 6-digit code). Your CV can only be opened there, and no one else reads your application.",
        `**No third parties**: your application isn't entrusted to any other service: no recruitment platform, no automated sorting tool, no sharing, no resale. Like the whole site, it only passes through our usual technical providers, who work on our behalf: ${prestataires.reseau.nom} in transit (see “Cloudflare, which protects the site”) and ${hebergeur.nom}, which rents us our server, located in France.`,
        "**How long**: **6 months after it's sent**, your application is deleted automatically, CV included, whatever the answer. A copy may still sit in our encrypted backups for **30 days at most**, then it disappears too.",
        "**Your IP address**: as with the other forms, it's only used to limit the number of submissions, and is never stored with your application.",
        `**Your rights**: you can view your application, correct it, withdraw it or have it deleted before the 6 months are up, with a simple email to ${lienEmail} (see “[Your rights](#droits)”).`,
        "**By email**: if you send us your application by email rather than through the form, we also keep it for **6 months** after it's sent, then delete it from our mailbox, attachments included.",
        "**Required?** Your name, your email, your message and the “I'm 18 or over” box: without them, we can neither review your application nor reply to you. The link and the CV are optional.",
      ],
    },
    "There's no need to put your photo, date of birth, marital status or social security number on your CV: we have no use for them.",
  ],
};
