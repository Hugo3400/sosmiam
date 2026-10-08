import { Linking, Platform } from "react-native";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";

/** Ce qu'il faut d'un lieu pour y aller : un Lieu, ou le lieu d'une mission d'ambassadeur (position null quand elle est inconnue). */
type Destination = { nom: string; ville: string; position?: PositionLieu | null };

/** L'adresse à ouvrir pour cette plateforme : Plans sur iPhone, l'app de cartes sur Android, Google Maps sur le web. */
function construireAdresse({ nom, ville, position }: Destination): string {
  const recherche = encodeURIComponent(`${nom}, ${ville}`);
  if (!position) {
    // Sans position, on cherche le lieu par son nom et sa ville (comme avant)
    if (Platform.OS === "ios") return `https://maps.apple.com/?q=${recherche}`;
    if (Platform.OS === "android") return `geo:0,0?q=${recherche}`;
    return `https://www.google.com/maps/search/?api=1&query=${recherche}`;
  }
  const coordonnees = `${position.latitude},${position.longitude}`;
  // daddr : l'itinéraire depuis là où tu es ; q : le nom du lieu sur l'épingle
  if (Platform.OS === "ios") return `https://maps.apple.com/?daddr=${coordonnees}&q=${encodeURIComponent(nom)}`;
  if (Platform.OS === "android") return `geo:${coordonnees}?q=${coordonnees}(${encodeURIComponent(nom)})`;
  return `https://www.google.com/maps/dir/?api=1&destination=${coordonnees}`;
}

/**
 * « Y aller » : ouvre l'itinéraire vers le lieu dans l'app de cartes du téléphone, par sa position quand on la connaît.
 * Si aucune app ne répond (un Android sans app de cartes), on se rabat sur Google Maps dans le navigateur ; sinon, rien ne se passe.
 */
export async function ouvrirItineraire(lieu: Destination): Promise<void> {
  try {
    await Linking.openURL(construireAdresse(lieu));
  } catch {
    const destination = lieu.position ? `${lieu.position.latitude},${lieu.position.longitude}` : `${lieu.nom}, ${lieu.ville}`;
    await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`).catch(() => {});
  }
}
