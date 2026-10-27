import type { DocumentLegal } from "~/contenus/legal/type-legal";

export const documentStatistiquesAnglais: DocumentLegal = {
  titre: "Your visits and our statistics",
  description: "How SOS Miam counts its visits without cookies or tracking, and how to stop being counted in one click.",
  miseAJour: "14 October 2026",
  introduction: [
    "To find out whether people like SOS Miam (how many visits, which pages, where visitors come from), our server counts page views itself. **No measurement cookies, no spy scripts, no Google Analytics**: we only keep totals, never your IP address or anything that could identify you.",
  ],
  enBref: [
    {
      liste: [
        "**Counted without cookies**, by our server, as anonymous totals.",
        "**Not counted at all** if your browser sends the “Global Privacy Control” or “Do Not Track” signal.",
        "**Would you rather not be counted?** [One click is all it takes](#ton-choix).",
      ],
    },
  ],
  sections: [
    {
      id: "comment",
      titre: "How we count",
      blocs: [
        "When you open a page, our server looks at the page requested (without what follows the “?”, except a campaign name: “?utm_…” or “?ref=”), the site you came from, the broad type of your device and browser, your language and your country, then adds one to running **totals**: page views, visits, visitors. Nothing is kept that could identify you.",
        "To count visitors without recognising them, your IP address and browser are scrambled with a secret code that changes every period (day, week, month, year) and is deleted at the end of it. A copy of this code may still sit in our encrypted backups for **30 days at most**, then it disappears too.",
        "Bots are counted separately, by name only. Pages preloaded by your browser and the version of the site being prepared aren't counted.",
        "All the details (what's looked at, what's kept, for how long, the legal basis) are in the [privacy policy](/confidentialite#statistiques).",
      ],
    },
    {
      id: "ton-choix",
      titre: "Your choice",
      blocs: ["Being counted, even anonymously, isn't compulsory: you can say no at any time, and change your mind later."],
    },
    {
      id: "cookie-de-refus",
      titre: "The cookie that remembers your opt-out",
      blocs: [
        "If you say no, a small cookie, **sosmiam-sans-statistiques**, remembers your choice for **13 months** in this browser. That's all it does, and the law exempts it from consent. If you clear your cookies, you'll need to choose again.",
        "It's in the [list of cookies](/cookies#liste-des-cookies), along with the others.",
      ],
    },
  ],
  chapitres: [
    { id: "on-compte", titre: "How we count", sections: ["comment"] },
    { id: "choisir", titre: "Your choice", sections: ["ton-choix", "cookie-de-refus"] },
  ],
};
