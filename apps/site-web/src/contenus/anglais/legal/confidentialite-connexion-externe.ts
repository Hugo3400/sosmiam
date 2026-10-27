import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionConnexionAppleGoogleAnglais: SectionLegale = {
  id: "connexion-apple-google",
  titre: "Logging in with Apple or Google on the site",
  blocs: [
    "On sosmiam.fr (“My account”), in the ambassador area and in the pro area, you can log in with “Continue with Apple” or “Continue with Google”. You then go through Apple's or Google's page, which sends us back a signed attestation: **the identifier of your Apple or Google account**, **your email address** (with Apple, the one you choose, including a Hide My Email address) and, if you share them, **your first name** (and your surname). Our server checks this attestation itself; we never receive your Apple or Google password, and neither Apple nor Google adds any script or cookie to our pages.",
    "We keep the Apple or Google identifier with your SOS Miam account, to recognise you next time. If an account already has the same email address, it's linked to your Apple or Google account (it's still a single account). If there's no account yet, we ask for your first name, your date of birth (18 or over, kept encrypted), your city and your agreement to the Terms of Use, as for an account created in the app: until you've finished, the attestation stays only in an encrypted 10-minute cookie, then it's forgotten. Your account then follows the rules in [Your ambassador account](#compte-ambassadeur), without a password: to delete it, you confirm by logging in again with Apple or Google.",
    "**Legal basis**: performance of the [Terms of Use](/cgu) you accept when you create your account (Article 6(1)(b) GDPR). Apple and Google process your login on their side according to their own privacy rules.",
  ],
};
