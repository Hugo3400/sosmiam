import { useEffect, useState } from "react";

export type CommuneLocalisee = { commune: string; departement: string; region: string };

export type EtatLocalisation = { etat: "attente" | "recherche" | "trouvee" | "erreur"; message: string };

const messagesErreur = {
  refus: "Pas de souci : tape simplement ta ville ou ta région.",
  indisponible: "On n'a pas trouvé ta position. Tape ta ville ou ta région.",
  "hors-de-france": "Tu sembles être hors de France : tape ta ville ou ta région.",
  "trop-de-demandes": "Trop d'essais d'affilée : réessaie dans quelques minutes, ou tape ta ville.",
  erreur: "La recherche de ta commune n'a pas marché. Tape ta ville ou ta région.",
};

/**
 * Bouton « Me localiser » : demande la position au navigateur (qui demande d'abord l'accord de la personne),
 * l'arrondit à environ 100 m, puis demande la commune à notre serveur (/localiser). Rien n'est gardé.
 */
export function utiliserLocalisation(quandTrouvee: (commune: CommuneLocalisee) => void) {
  const [possible, setPossible] = useState(false);
  const [localisation, setLocalisation] = useState<EtatLocalisation>({ etat: "attente", message: "" });

  // Le bouton n'apparaît qu'une fois la page chargée, si le navigateur sait localiser (page sécurisée obligatoire)
  useEffect(() => {
    setPossible("geolocation" in navigator && window.isSecureContext);
  }, []);

  async function chercherCommune(latitude: number, longitude: number) {
    const arrondir = (nombre: number) => Math.round(nombre * 1000) / 1000;
    try {
      const reponse = await fetch("/localiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: arrondir(latitude), longitude: arrondir(longitude) }),
      });
      const resultat = await reponse.json();
      if (resultat?.ok && typeof resultat.commune === "string") {
        quandTrouvee(resultat);
        const precision = resultat.departement ? ` (${resultat.departement})` : "";
        setLocalisation({ etat: "trouvee", message: `Trouvé : ${resultat.commune}${precision}. Tu peux le changer si besoin.` });
      } else {
        const cle = resultat?.erreur as keyof typeof messagesErreur;
        setLocalisation({ etat: "erreur", message: messagesErreur[cle] ?? messagesErreur.erreur });
      }
    } catch {
      setLocalisation({ etat: "erreur", message: messagesErreur.erreur });
    }
  }

  function localiser() {
    setLocalisation({ etat: "recherche", message: "Recherche de ta position…" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => void chercherCommune(coords.latitude, coords.longitude),
      (erreur) => setLocalisation({
        etat: "erreur",
        message: erreur.code === erreur.PERMISSION_DENIED ? messagesErreur.refus : messagesErreur.indisponible,
      }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  }

  const oublier = () => setLocalisation({ etat: "attente", message: "" });

  return { possible, localisation, localiser, oublier };
}
