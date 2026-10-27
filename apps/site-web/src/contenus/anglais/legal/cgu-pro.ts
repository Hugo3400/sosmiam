import { HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";
import { site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;
const lienEspacePro = `[${HOTE_PRO}](https://${HOTE_PRO})`;

export const sectionProCguAnglais: SectionLegale = {
  id: "pro",
  titre: "The Pro area",
  blocs: [
    `On ${lienEspacePro}, venues keep their SOS Miam listing up to date: opening hours, description, contact details, good-to-know information, banner and logo, staff and table card. You log in there with your SOS Miam account, **if you are 18 or over**. By creating this account, you accept these Terms, and in particular the rules below.`,
    {
      liste: [
        "**It is free**, for good: no subscription, no commission, nothing to pay to have a listing, keep it up to date or be “Verified ✓”. And no venue can pay to be placed higher (see “What you find on SOS Miam”).",
        "**You genuinely represent the venue.** You only ask to manage a venue if you are its manager, its owner or the person they have put in charge of its listing, and you tell us why (the “proof”; the SIRET number, the French business identification number, is optional). A member of the venue's staff, for their part, joins by invitation from a manager.",
        "**The SOS Miam team decides**, by hand. It may decline a request, or later remove an account's link to a venue (for example if the venue changes hands, if the proof turns out to be false or if these rules are not followed): you see its decision, and its reply if there is one, in your dashboard, and you can write to us to find out more or if you disagree. Until your request is approved, you do not edit the listing.",
        "**The information you publish must be accurate**: opening hours, description, contact details, good-to-know information. It appears straight away on the public listing, and customers rely on it when they come. If anything changes (closure, new opening hours), you update the listing. The [community rules](#regles-communaute) also apply to everything you write.",
        "**The banner and the logo**: only a manager can upload, change or remove them, and they only appear on the listing of a “Verified ✓” venue. You only upload images that the venue has the right to use (its own logo, its own photos), that genuinely show it, without the recognisable face of anyone who has not said yes, and that follow the [community rules](#regles-communaute). You authorise us to display them free of charge on the venue's listing, on the site and in the SOS Miam app, for as long as they are there. Anyone can report an image: if our team upholds the notice, it removes the image from the listing and lets you know in the app, stating the rule concerned.",
        "**The name and the address go through the SOS Miam team**: you can suggest them from your listing, but they only change once the team has accepted them. This is what protects a venue against someone who might want to change its name or address in its place.",
        "**No false identity**: you do not pass yourself off as a venue you do not represent, or as someone else, and you only invite people who genuinely work with you to join your team. A manager is responsible for the invitations they send, and can remove a member at any time.",
        "**Customers' suggestions** about your listing are shown to you without their author's name: it is the SOS Miam team that accepts them or not. You do not try to find out who wrote them, and you never take it out on a customer because of a suggestion.",
        `**You can leave whenever you like**: leave a venue from your dashboard, or delete your account in “My account” (you will be asked for your password). The venue's listing, however, stays on SOS Miam: to have it removed, write to us at ${lienContact}. What we keep, and for how long, is set out in the [privacy policy](/confidentialite#compte-pro).`,
        `**In case of abuse** (false identity, false information on a listing, invitations to strangers, hurtful remarks…), the SOS Miam team can remove the account's link to the venue and, in serious cases, delete the account. If you think there has been a mistake, write to us at ${lienContact}.`,
      ],
    },
  ],
};
