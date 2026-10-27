import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_MON_COMPTE } from "../mon-compte.ts";

export const TEXTES_MON_COMPTE_ANGLAIS: Traduction<typeof TEXTES_MON_COMPTE> = {
  titre: "My account",
  descriptions: {
    ambassadeur: "Your SOS Miam ambassador account.",
    pro: "Your SOS Miam account, in the Pro area.",
    site: "Your SOS Miam account: your details, your data, and deleting your account, even without logging in.",
  },
  retours: {
    ambassadeur: "Back to my area",
    pro: "Back to my dashboard",
    site: "Back to the home page",
  },
  chapoVisiteur:
    "One SOS Miam account for the app, the ambassador area and the Pro area. Log in to see your details, change your password or delete your account.",
  chapoConnecte: "Your details, your password, your data, and the way out if you need it.",
  chapoEspace: "Your details, your password, and the way out if you need it.",
  aideAppleGoogle:
    "Signed up with Apple or Google? Tap the same button, just above. Prefer a password? Tap “Forgotten your password?” and enter your account's email address (the one Apple or Google passed on to us): you'll get a link to choose one.",
  aideSansMotDePasse:
    "You log in with Apple or Google, so your account doesn't have a password with us. Want one anyway? Tap “Add a password”, just above, and we'll send you a link to choose it.",
  parties: {
    meConnecter: "Log in",
    mesInfos: "My details",
    monMotDePasse: "My password",
    meDeconnecter: "Log out",
    supprimer: "Delete my account",
  },
  deconnexionAppleGoogle: "On this device. You can log back in any time with Apple or Google.",
  deconnexionEmail: "On this device. You can log back in any time with your email and password.",
  motDePasseChange: "Done! Your new password is saved, and you've been logged out everywhere else.",
  enregistre: "Saved.",
  messages: {
    actuel: "Enter your current password.",
    actuelIncorrect: "That's not your current password.",
    nouveau: "Your new password needs at least 12 characters (and no more than 128).",
  },
  profil: {
    bouton: "Save changes",
    tonEmail: "Your email: ",
    nePasChanger: ". It can't be changed online. To change it, email us at ",
    aidePrenom:
      "It may show as “Spotted by …” on the page of a place you suggested. A page that's already live keeps the name it had then – email us to change it.",
  },
  delaiReponse: "within one month at most",
  mailSuppression: {
    objet: "Delete my SOS Miam account",
    texte: "Hello,\n\nI'd like my SOS Miam account and all the data linked to it to be deleted.\n\nThank you!",
  },
  mailCopie: {
    objet: "Copy of my SOS Miam data",
    texte: "Hello,\n\nI'd like to receive a copy of all the data SOS Miam holds about me.\n\nThank you!",
  },
  droitsRgpd: [
    { droit: "Right of access", explication: "knowing what we keep about you, and getting a copy of it." },
    { droit: "Right to rectification", explication: "correcting anything that's wrong. Your first name (and your ambassador city) can be changed right here, and your email address by emailing us." },
    { droit: "Right to erasure", explication: "having your data erased – you can delete your account here, in the app, or by email." },
    { droit: "Right to object", explication: "objecting to a use of your data based on our legitimate interest (visitor statistics, security…), on grounds relating to your particular situation." },
    { droit: "Right to complain", explication: "if you feel we're not respecting your rights, you can lodge a complaint with the CNIL, the French data protection authority." },
  ],
  resteApresSuppression:
    "What stays for a while, then disappears on its own: the log of emails we've sent you (up to 90 days after each one) and a copy in our encrypted backups (up to 30 days).",
  mesDonnees: {
    titre: "My data",
    ceQuOnGarde: "What we keep",
    garde: "Your email, your first name or username, and what you do on SOS Miam. Never your password in plain text, and we never sell anything. The details (what, why, for how long) are in our ",
    politique: "privacy policy",
    copie: "Get a copy of my data",
    copieTexte: "Email us from your account's address, with the subject “Copy of my data”. We'll send it to you ",
    mailToutPret: "Open a ready-made email",
    toutSupprimer: "Delete everything",
    supprimerConnecte: "The “Delete my account” button, just above: your account goes straight away, along with everything linked to it.",
    supprimerVisiteur:
      "Log in and use “Delete my account”, do it in the app (“My account”, in your settings), or email us – the steps are just above.",
    newsletter: " Signed up to the newsletter? The “Unsubscribe” link at the bottom of every email is all it takes.",
    mesDroits: "My rights, in plain words",
    separateurDroit: ": ",
    pourToutCa: "For all of this, just email ",
    reponse: (delai: string) => `. We'll reply ${delai} (two more months only for a complex request, and we'll let you know). To contact the CNIL, it's `,
    parIci: "this way",
    details: ", and all the details are in ",
    tesDroits: "your rights",
  },
  sansConnexion: {
    titre: "Delete my account without logging in",
    intro: "No app any more, no password, or just don't want to log in? No worries – an email is all it takes:",
    ecrisA: "Email ",
    depuisAdresse: " from your account's email address.",
    objet: (objet: string) => `Subject: “${objet}”. In the email, just say you want to delete your account and your data.`,
    onEfface: (delai: string) => `We'll delete your account and everything linked to it, and reply ${delai}.`,
    adresseImpossible:
      "Can't email from that address (a Hide My Email address from Apple, a closed inbox…)? Email us anyway and include it: we'll just check it's really you before deleting anything.",
  },
};
