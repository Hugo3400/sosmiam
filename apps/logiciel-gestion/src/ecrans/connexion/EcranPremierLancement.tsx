import { KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { creerClePoste } from "~/fonctions/securite/creer-cle-poste.ts";
import { ecrireCoffre, type CoffreCle } from "~/stockage/coffre-local.ts";
import { CadreConnexion } from "./CadreConnexion.tsx";

const LONGUEUR_MIN = 12;

/** Tout premier lancement : on choisit le mot de passe qui protège la clé secrète de ce PC. */
export function EcranPremierLancement({ onCree }: { onCree: (coffre: CoffreCle, cleSecrete: CryptoKey, cleCoffre: CryptoKey) => void }) {
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function creer(evenement: FormEvent) {
    evenement.preventDefault();
    if (motDePasse.length < LONGUEUR_MIN) return setErreur(`Au moins ${LONGUEUR_MIN} caractères : une petite phrase marche très bien.`);
    if (motDePasse !== confirmation) return setErreur("Les deux mots de passe ne sont pas pareils.");
    setEnCours(true);
    setErreur(null);
    try {
      const { coffre, cleSecrete, cleCoffre } = await creerClePoste(motDePasse);
      ecrireCoffre(coffre);
      onCree(coffre, cleSecrete, cleCoffre);
    } catch {
      setErreur("Impossible de créer la clé : ce PC est-il à jour (Windows et WebView2) ?");
      setEnCours(false);
    }
  }

  return (
    <CadreConnexion
      titre="Salut Hugo 👋"
      sousTitre="Premier lancement sur ce PC. Le logiciel va créer une clé secrète, rangée sur ce PC et chiffrée par un mot de passe. Sans ce PC et ce mot de passe, personne n'entre, même avec l'adresse du serveur."
    >
      <form onSubmit={creer} className="grid gap-4">
        <Champ
          libelle="Mot de passe"
          type="password"
          autoComplete="new-password"
          valeur={motDePasse}
          onChange={setMotDePasse}
          aide={`${LONGUEUR_MIN} caractères au moins. Il n'est envoyé nulle part : s'il est perdu, il faudra autoriser ce PC à nouveau.`}
        />
        <Champ libelle="Le même, encore une fois" type="password" autoComplete="new-password" valeur={confirmation} onChange={setConfirmation} erreur={erreur} />
        <Bouton type="submit" variante="principal" icone={KeyRound} chargement={enCours}>Créer la clé de ce PC</Bouton>
      </form>
    </CadreConnexion>
  );
}
