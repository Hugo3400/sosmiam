import { ADRESSE_API } from "~/services/adresse-api";

export function construireAdressePhotoAvis(photo: string): string {
  return `${ADRESSE_API}/app/avis/photos/${encodeURIComponent(photo)}`;
}
