import { useEffect, useRef, useState } from "react";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

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
 * l'arrondit à environ 100 m, puis demande la commune à notre serveur (/localiser). Rien n'est gardé de notre côté.
 * Une recherche en cours est abandonnée dès qu'on tape, qu'on choisit une suggestion ou que le formulaire est vidé.
 */
export function utiliserLocalisation(quandTrouvee: (commune: CommuneLocalisee) => void) {
  const [possible, setPossible] = useState(false);
  const [localisation, setLocalisation] = useState<EtatLocalisation>({ etat: "attente", message: "" });
  // Numéro de la recherche en cours : une réponse qui arrive après un abandon est ignorée
  const tentative = useRef(0);

  // Le bouton n'apparaît qu'une fois la page chargée, si le navigateur sait localiser (page sécurisée obligatoire)
  useEffect(() => {
    setPossible("geolocation" in navigator && window.isSecureContext);
  }, []);

  function afficher(etat: EtatLocalisation["etat"], message: string) {
    setLocalisation({ etat, message: lierPonctuation(message) });
  }

  async function chercherCommune(latitude: number, longitude: number, numero: number) {
    const arrondir = (nombre: number) => Math.round(nombre * 1000) / 1000;
    try {
      const reponse = await fetch("/localiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: arrondir(latitude), longitude: arrondir(longitude) }),
      });
      const resultat = await reponse.json();
      if (numero !== tentative.current) return;
      if (resultat?.ok && typeof resultat.commune === "string") {
        quandTrouvee(resultat);
        const precision = resultat.departement && resultat.departement !== resultat.commune ? ` (${resultat.departement})` : "";
        afficher("trouvee", `Trouvé : ${resultat.commune}${precision}. Tu peux le changer si besoin.`);
      } else {
        const cle = resultat?.erreur as keyof typeof messagesErreur;
        afficher("erreur", messagesErreur[cle] ?? messagesErreur.erreur);
      }
    } catch {
      if (numero === tentative.current) afficher("erreur", messagesErreur.erreur);
    }
  }

  function localiser() {
    if (localisation.etat === "recherche") return;
    const numero = ++tentative.current;
    afficher("recherche", "Recherche de ta position…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (numero === tentative.current) void chercherCommune(coords.latitude, coords.longitude, numero);
      },
      (erreur) => {
        if (numero !== tentative.current) return;
        afficher("erreur", erreur.code === erreur.PERMISSION_DENIED ? messagesErreur.refus : messagesErreur.indisponible);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  }

  /** Abandonne la recherche en cours (s'il y en a une) et efface le message. */
  function oublier() {
    tentative.current += 1;
    setLocalisation({ etat: "attente", message: "" });
  }

  return { possible, localisation, localiser, oublier };
}
