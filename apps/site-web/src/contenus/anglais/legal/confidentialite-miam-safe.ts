import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionMiamSafeAnglais: SectionLegale = {
  id: "miam-safe",
  titre: "Miam Safe, when you don't feel safe in a venue",
  blocs: [
    "Miam Safe helps you when you don't feel safe in a venue: a button on the venue's page and on the screen of a visit, with an account. It's a helping hand, not an emergency service: emergency numbers (17, 18, 15, 112 and 114 by text message) are called directly from your phone, and we don't see those calls. “Alert a friend” has its own section, just after this one.",
    {
      liste: [
        "**The silent alert to the staff** (venues that have signed the Miam Safe charter): the venue's staff receive, on the phones logged in to the venue's pro area, **your first name, where you are** (inside, on the terrace, in the toilets, somewhere else) **and the small detail you choose to write** (“Table 12, green jumper”). Never your surname, your photo or your email. We keep the alert (this information, the time, and who replied “On our way”) for **30 days**, so that the SOS Miam team can check that an alert left unanswered was followed up, then it's deleted.",
        "**Telling us what happened**: the reason you choose and your text are read by the SOS Miam team, by hand, **within 48 hours**. They're **never shown on the venue's page**, and **your identity is never given to the venue**. We keep your account with the report so that we can tell you what we've decided, then everything is deleted **1 year** after the decision (or 1 year after you sent it, if no decision was ever made). Only write what's useful: there's no need for details about your health, your origins or your private life.",
        "**“Did you feel at ease here?”** (after a visit): your answer is kept for **2 years** at most (the latest one replaces the previous one), and deleted sooner if you delete your account. Only a total is shown on the page (“Miamis feel at ease here”, from 90% “yes” out of at least 20 answers); a “no” is never shown, and no one sees who answered what.",
        "**A venue's charter**, already in place (see “Your pro area”): we keep who signed it (the manager) and when, the date of any withdrawal and, if the SOS Miam team withdraws it after a report, why (a private note). This is kept as long as the venue is on SOS Miam.",
        "**Legal basis**: performance of the app's Terms of Use (Article 6(1)(b) GDPR) for the alert and your answer, and of the pro area's Terms of Use for the charter; our legitimate interest (Article 6(1)(f) GDPR) in handling reports, which protects everyone.",
        "**Deleting your account** deletes your alerts, your answers and your location shares. Your reports remain, with no link to you, until the end of their retention period.",
      ],
    },
  ],
};

export const sectionPrevenirUnPoteAnglais: SectionLegale = {
  id: "prevenir-un-pote",
  titre: "“Alert a friend”",
  blocs: [
    "When you don't feel safe in a venue, Miam Safe gives you a hand to **alert a friend** from your crew. It isn't an emergency service, and it never replaces **17** or **112**: if you're in danger, call them first.",
    {
      liste: [
        "**You trigger it, and only you**: from Miam Safe, on a venue's page or the screen of a visit, you choose **one** friend from your crew. Nothing is sent without this action.",
        "**What your friend receives**: a notification on their phone, not counted in the daily limit, with only your first name and the name of the venue: “🛡 Léa needs you” / “Léa doesn't feel safe at ‘[place]’. Léa's location is shared with you for 1 hour.” (with no location shared: “Check on Léa now.”). Like any notification, it goes through Apple or Google. If your friend has no phone logged in to their account, the app tells you so (“didn't receive anything”, in French {fr:n'a rien reçu}): it never lets you believe they've been alerted. It can't know, however, whether they've seen the notification: call them if you can.",
        "**Your location, only if you want**: it's only sent if the “Share my location for 1 hour” switch is on (it is at the start, and you can turn it off) and if you've allowed access to your location “While Using the App”. It's only updated while the sharing screen is open, **never in the background**. You can stop sharing at any time.",
        "**What we keep**: who is sharing, with which friend, from which venue, the start time, the planned end (1 hour later) and the time you stopped, and your **last location** (latitude, longitude, accuracy and time), **encrypted** in our database (AES-256-GCM, with a key derived from the data key, which is kept outside the database).",
        "**Who sees it**: only the friend you chose, and only while you're friends: if they leave your crew or if either of you blocks the other, they no longer see anything: the sharing stops at once and your location is deleted. **Neither the venue nor the SOS Miam team** sees it: it appears neither in our management software nor in our logs. Your friend can open it in Apple Maps or Google Maps: it then goes through their phone's map service.",
        "**How long**: your location is deleted as soon as you stop sharing. After 1 hour, it can no longer be seen, and it's deleted at the latest on the first request after that, or the following night. The rest (who, with whom, which venue, the times) is deleted the night after the sharing ends. The only exception: if a share is in progress at the time of our nightly backup (around 03:30), its last location, still encrypted, is in that encrypted backup, which disappears at the latest 30 days later.",
        "**Why, and on what basis**: to help you alert someone you trust, at your request; this is performance of the app's [Terms of Use](/cgu) (Article 6(1)(b) GDPR). If you delete your account, your shares are deleted with it.",
      ],
    },
  ],
};
