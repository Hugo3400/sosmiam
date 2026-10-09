// La communauté telle que la voit le téléphone (démo) : ta bande, les personnes bloquées, les sorties, les listes,
// l'activité, les lieux envoyés entre potes, les commentaires et tes signalements. Gardée sur le téléphone en attendant l'API.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Commentaire } from "@sos-miam/commun/types/commentaires";
import type { ActivitePote, ListePartagee, Recommandation, Sortie } from "@sos-miam/commun/types/potes";
import type { SignalementContenu } from "@sos-miam/commun/types/signalement";

export type CommunauteLocale = {
  /** Version du format, pour les reprises futures */
  version: 1;
  bande: string[];
  bloques: string[];
  sorties: Sortie[];
  listes: ListePartagee[];
  activites: ActivitePote[];
  recommandations: Recommandation[];
  commentaires: Commentaire[];
  signalements: SignalementContenu[];
  /** Comment chaque pote a été ajouté (lien, QR code ou pseudo) : un mineur ne discute qu'avec des potes ajoutés en vrai */
  moyens: Record<string, "lien" | "qr" | "pseudo">;
  /** Ce que tu as retiré de ta vue, pour toi seulement (sorties passées, listes à découvrir, activité de ta bande), par identifiant */
  masques: string[];
  /** Version des exemples de la démo déjà reçus (absent : 1) ; voir ajouterNouveauxExemples */
  exemples?: number;
};

const CLE = "sosmiam.communaute";

/** Lit la communauté gardée sur le téléphone (null si rien, ou illisible : la démo repart alors de zéro). */
export async function lireCommunauteLocale(): Promise<CommunauteLocale | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return null;
    const lu = JSON.parse(brut) as Partial<CommunauteLocale>;
    if (lu.version !== 1) return null;
    const listeOuVide = <T,>(v: T[] | undefined) => (Array.isArray(v) ? v : []);
    return {
      version: 1,
      bande: listeOuVide(lu.bande),
      bloques: listeOuVide(lu.bloques),
      sorties: listeOuVide(lu.sorties),
      listes: listeOuVide(lu.listes),
      activites: listeOuVide(lu.activites),
      recommandations: listeOuVide(lu.recommandations),
      commentaires: listeOuVide(lu.commentaires),
      signalements: listeOuVide(lu.signalements),
      moyens: lu.moyens && typeof lu.moyens === "object" ? lu.moyens : {},
      // Absent d'une communauté enregistrée avant le 9 octobre 2026 : rien de retiré
      masques: listeOuVide(lu.masques).filter((id): id is string => typeof id === "string"),
      exemples: typeof lu.exemples === "number" ? lu.exemples : 1,
    };
  } catch {
    return null;
  }
}

/** Enregistre la communauté sur le téléphone. */
export async function enregistrerCommunauteLocale(communaute: CommunauteLocale): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(communaute));
}

/** Efface la communauté du téléphone. */
export async function effacerCommunauteLocale(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
