import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_QR_VITRINE_ANGLAIS } from "~/contenus/anglais/qr-vitrine";

export const TEXTES_QR_VITRINE = {
  titreMeta: "Un lieu SOS Miam — SOS Miam",
  titre: "Ce QR mène à un lieu SOS Miam",
  chapo: "Ouvre l'app SOS Miam pour le retrouver : il t'y attend, promis.",
  indisponible: "Petit souci de notre côté : réessaie dans un instant, la fiche sera peut-être là.",
  decouvrir: "Découvrir SOS Miam",
};

export const TEXTES_QR_VITRINE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_QR_VITRINE>> = {
  fr: TEXTES_QR_VITRINE,
  en: TEXTES_QR_VITRINE_ANGLAIS,
};
