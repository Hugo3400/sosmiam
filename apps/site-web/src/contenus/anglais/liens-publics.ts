import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_LIENS_PUBLICS } from "~/contenus/liens-publics";

export const TEXTES_LIENS_PUBLICS_ANGLAIS: Traduction<typeof TEXTES_LIENS_PUBLICS> = {
  meta: {
    titre: "Our links",
    description: "Launch updates, becoming an ambassador, the pro area, listing your venue, plus the SOS Miam Discord, TikTok, Instagram and website, all in one place.",
  },
  slogan: "Rescue a table, treat yourself.",
  presentation:
    "Independent restaurants, bars and patisseries that would love a few more faces (plus a few things to do), all over France. Pick your way in – we'll keep a table for you.",
  ouNousRetrouver: "Where to find us",
  liens: {
    prevenu: {
      nom: "Hear when we launch",
      identifiant: "Newsletter and app beta",
      accroche: "Leave your email: we'll tell you as soon as the app reaches your area, and you can try it before everyone else.",
    },
    ambassadeur: {
      nom: "Become an ambassador",
      accroche: "Share the hidden gems near you. 367 founding spots all over France, 18+.",
    },
    pro: {
      nom: "Pro area",
      accroche: "Run a venue? Your listing, your menu and your customers' suggestions. It's free.",
    },
    "inscrire-lieu": {
      nom: "List my venue",
      accroche: "Your venue's not on SOS Miam yet? Tell us about it in a few words and we'll take care of the rest.",
    },
    discord: {
      nom: "Our Discord",
      identifiant: "SOS Miam server",
      accroche: "The community: your hidden gems, your questions, and a look behind the scenes.",
    },
    tiktok: {
      nom: "TikTok",
      accroche: "Videos that'll make you hungry. Watch them on a full stomach – you've been warned.",
    },
    instagram: {
      nom: "Instagram",
      accroche: "Photos of great spots, and news from SOS Miam.",
    },
    site: {
      nom: "The website",
      accroche: "Still simmering in the kitchen – pop by and see how it's coming along.",
    },
  },
};
