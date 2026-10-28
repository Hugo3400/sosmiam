import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { ANNONCE_POSITION_OUBLIEE_ANGLAIS } from "~/contenus/anglais/textes-position";

export const ANNONCE_POSITION_OUBLIEE = "Plus de 5 min hors de l'app : ta position est oubliée 📍";

export const ANNONCE_POSITION_OUBLIEE_PAR_LANGUE: ParLangue<Traduction<typeof ANNONCE_POSITION_OUBLIEE>> = { fr: ANNONCE_POSITION_OUBLIEE, en: ANNONCE_POSITION_OUBLIEE_ANGLAIS };
