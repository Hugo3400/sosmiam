import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import { site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;
const lienEspace = `[${adresseEspaceAmbassadeur.replace("https://", "")}](${adresseEspaceAmbassadeur})`;

export const sectionAmbassadeursCguAnglais: SectionLegale = {
  id: "ambassadeurs",
  titre: "The Ambassador programme",
  blocs: [
    `On ${lienEspace}, you can create an account to become an ambassador: introducing people to the independent venues near you, suggesting some to us and spreading the word around you. By creating this account, you accept these Terms, and in particular the rules below.`,
    {
      liste: [
        "**18 or over.** Your date of birth is only used to check this when you sign up: it is not kept. Lying about your age is prohibited; if we learn that an account belongs to someone under 18, we delete it.",
        `**One account per person**, with accurate information and an email address of your own: you confirm it by clicking the link emailed to you when you sign up. Your first name or nickname may appear on the page of a venue you brought in (“Spotted by …”): choose one you are happy to show. Keep your password to yourself, and let us know quickly at ${lienContact} if someone else is using your account.`,
        "**Every sign-up is approved by the SOS Miam team**, by hand. The team may decline a sign-up without having to give a reason. Until your account is approved, you can only see the status of your sign-up and manage your account.",
        "**A programme for enthusiasts, not a job**: no pay, no set hours, no targets. You take part when you like, as much as you like, and you can stop at any time.",
        "**Never paid by a venue you promote.** If a venue gives you something (a meal, a gift…), you state it clearly in what you post, with the label {fr:Collaboration commerciale} (a paid or gifted partnership), as required by Law No. 2023-451 of 9 June 2023 on commercial influence.",
        "**You do not pass yourself off as SOS Miam**: you speak in your own name, as an ambassador, never on behalf of SOS Miam or its team. You do not promise anything on our behalf, to a venue or to anyone else (a listing, a place in the spotlight, a BIG SOS…). And wherever you talk about us, the [community rules](#regles-communaute) also apply.",
        "**The media kit** (logos, mascot, badges, visuals and texts to share) is reserved for approved ambassadors. We grant you the right to use it free of charge, for yourself alone and for non-commercial purposes, solely to talk about SOS Miam, following its rules (for example, not distorting or recolouring the logo). This right ends as soon as you are no longer an approved ambassador: account deleted, suspended or declined, or ambassador role removed (whether you leave the programme, we remove you from it, or after 1 year without a visit).",
        `**In case of abuse** (false information, fake venues, undisclosed commercial collaboration, misuse of the media kit, hurtful remarks, passing yourself off as SOS Miam…), the SOS Miam team can suspend your account. A suspended account can still log in, see its status, correct its details, change its password and delete itself, but nothing else. If you think there has been a mistake, write to us at ${lienContact}.`,
        `**Deleting your account**: at any time, from “My account” in your area (you will be asked for your password), or by writing to us at ${lienContact} from your account's email address. After 1 year without any login to the account (app included), the ambassador role is removed; after 2 years without a login, the account is erased (an email warns you a month beforehand); if the sign-up is declined, the ambassador role is removed 30 days after the refusal, and the SOS Miam account remains: everything is set out in the [privacy policy](/confidentialite#compte-ambassadeur).`,
        "**Founders**: once your account is approved, you can apply from your area for the city where you live, or for your département (or your {fr:collectivité d'outre-mer}, an overseas collectivity) if your municipality has fewer than 50,000 inhabitants. Each city and each département has only a few spots: the SOS Miam team chooses, an application may be unsuccessful, and you then remain an ambassador, as before. When all the spots in a city or a département are taken, applications there close, and reopen if a spot frees up. If you move, you keep your founder title as a keepsake, but your spot frees up; your founder number is never given to anyone else.",
        "**Certified Ambassador**: a separate title, on top of your level, to help partner venues. The SOS Miam team awards it, on application from your area or by invitation, and can withdraw it at any time, for example if these rules are not followed. An organisation (association, town hall, tourist office, school…) is represented by one person, with their own account. A Certified Ambassador is **never paid by a venue**, neither for a mission nor for anything else: if a venue gives them something, they label it {fr:Collaboration commerciale}. **Missions** with partner venues are assigned by the team: you accept them or not, at your own pace, without promising the venue anything on behalf of SOS Miam. The **pro media kit** (poster, flyer, 30-second pitch, template email) follows the same rules as the media kit, as well as its own rules, written with it: you do not ask a venue for anything in exchange for its sign-up, which remains free, and you only write to the address that the venue itself displays. This right ends with the title.",
        "**Points and badges**: as in the app, they have no monetary value (see “Rescues, visits and badges”).",
      ],
    },
  ],
};
