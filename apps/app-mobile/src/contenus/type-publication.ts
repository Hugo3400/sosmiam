// Une publication du fil « Pour toi » : une vidéo ou des photos d'un lieu, postées par le lieu ou par un créateur.
// Pour l'instant des exemples (médias libres Mixkit dans assets/medias-demo) ; la forme rejoindra packages/commun avec l'API.
import type { ImageSourcePropType } from "react-native";
import type { VideoSource } from "expo-video";

export type MediaPublication =
  | { type: "video"; video: VideoSource; affiche: ImageSourcePropType }
  | { type: "photos"; photos: ImageSourcePropType[] };

export type AuteurPublication =
  | { type: "lieu" }
  | {
      type: "createur";
      pseudo: string;
      /** Ce que le lieu a offert ou payé : affiché « Collaboration commerciale » (obligatoire, voir la FAQ) */
      partenariat?: string;
    };

export type Publication = {
  id: string;
  lieuId: number;
  auteur: AuteurPublication;
  legende: string;
  /** Absent tant que le média n'est pas prêt : le fil affiche alors le dégradé et l'emoji du lieu */
  media?: MediaPublication;
  jaimes: number;
  commentaires: number;
  /** Média libre qui illustre le lieu sans y avoir été filmé : étiquette « Vidéo / Photos d'illustration » */
  illustration?: boolean;
};
