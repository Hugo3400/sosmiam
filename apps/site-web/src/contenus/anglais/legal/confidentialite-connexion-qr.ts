import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionConnexionQrAnglais: SectionLegale = {
  id: "connexion-qr",
  titre: "Logging in with a QR code",
  blocs: [
    "On sosmiam.fr (“My account”), in the ambassador area and in the pro area, “Log in with the app” displays a QR code; a phone where you're not logged in yet can also display one. You scan it with the SOS Miam app already logged in to your account, you check the device it shows you, and you accept (with Face ID, your fingerprint or your phone's passcode): the waiting device is logged in, without you typing your password.",
    {
      liste: [
        "**What we keep, for the duration of the request**: a short description of the device displaying the QR code (for example “Chrome on Mac”, taken from its browser's signature, **never its IP address**), the site the request comes from (sosmiam.fr, the ambassador area, the pro area or the app), the account that scanned it, the status of the request (pending, scanned, accepted or declined) and its dates. Of the QR code and of the secret code kept by the waiting device, we keep only **hashes** (a calculation that can't be reversed to recover them).",
        "**How long**: a QR code works for only **2 minutes**, and only once. The request is deleted by our nightly clean-up once it ended more than **a day** ago (so 2 days at most), and straight away if you delete your account. The session it opens then follows the usual rules (see [Your ambassador account](#compte-ambassadeur) and [The SOS Miam app: your account](#app-comptes)).",
        "**A 2-minute cookie**: on the site, while you wait, the secret code is kept in an encrypted cookie, **__Host-sosmiam-connexion-qr**, deleted after **2 minutes at most** (see the [Cookies](/cookies#liste-des-cookies) page). It's strictly necessary: without it, there's no way to know that it's really your browser that's waiting.",
        "**Your IP address** is used only to limit the number of QR codes requested, to fend off bots: it stays in memory for the duration of that limit and is never recorded with the request. Our server writes neither the code, nor the secret, nor your email address in its logs. The only exception: if the QR code is opened in a browser rather than in the app, its address, like any address visited, goes into the server's front-door log (see “Server logs”); in any case, the code is useless after 2 minutes.",
        "**Why**: to log you in without typing your password, while seeing clearly which device you're logging in. **Legal basis**: performance of the [Terms of Use](/cgu) you accepted when you created your account (Article 6(1)(b) GDPR).",
        "**The security tip that matters**: **never** scan someone else's QR code, even if you're asked very nicely (“scan to win a bonus”, “it's to verify your account”…). Accepting a QR code means opening your account on the device displaying it: if it isn't yours, someone else ends up in your account. And don't send your QR code to anyone. Any doubt? Decline in the app: nothing happens.",
      ],
    },
  ],
};
