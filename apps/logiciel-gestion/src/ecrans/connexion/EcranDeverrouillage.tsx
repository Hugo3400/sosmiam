import { LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { ouvrirCoffre } from "~/fonctions/securite/ouvrir-coffre.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { aUneSession, configurerClient, ErreurApi } from "~/services/client-gestion.ts";
import { aUneSessionGardee, definirCleCoffre, ouvrirSession, reprendreSessionGardee } from "~/services/session.ts";
import type { CoffreCle } from "~/stockage/coffre-local.ts";
import { CadreConnexion } from "./CadreConnexion.tsx";

type Props = {
  coffre: CoffreCle;
  /** La clé est déjà en mémoire (juste créée, ou session perdue) : seul le code est demandé */
  cleEnMemoire: boolean;
  onConnecte: (poste: string) => void;
  onRevoirAutorisation: () => void;
  onOublierPoste: () => void;
};

/** Connexion : mot de passe (pour ouvrir la clé de ce PC) et code à 6 chiffres (pour ouvrir une session sur le serveur). */
export function EcranDeverrouillage({ coffre, cleEnMemoire, onConnecte, onRevoirAutorisation, onOublierPoste }: Props) {
  const [motDePasse, setMotDePasse] = useState("");
  const [code, setCode] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<{ texte: string; nonAutorise?: boolean } | null>(null);
  const [cleOuverte, setCleOuverte] = useState(cleEnMemoire);
  // Le code n'est demandé que s'il n'y a pas de session valable (en mémoire, ou gardée sur ce PC)
  const [demanderCode, setDemanderCode] = useState(() => !aUneSession() && (cleEnMemoire || !aUneSessionGardee()));

  async function entrer(evenement: FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      if (!cleOuverte) {
        try {
          const { cleSecrete, cleCoffre } = await ouvrirCoffre(coffre, motDePasse);
          configurerClient(cleSecrete, coffre.idPoste);
          await definirCleCoffre(cleCoffre);
          setCleOuverte(true);
          setMotDePasse("");
        } catch {
          setErreur({ texte: "Mauvais mot de passe." });
          return;
        }
        // Session gardée sur ce PC : si le serveur la reconnaît, le mot de passe suffit
        if (!aUneSession() && !demanderCode) {
          const poste = await reprendreSessionGardee();
          if (poste) return onConnecte(poste);
          setDemanderCode(true);
          setErreur({ texte: "Ta session a expiré (24 h sans t'en servir, ou 7 jours) : tape ton code." });
          return;
        }
      }
      if (demanderCode) {
        const { poste } = await ouvrirSession(code.replace(/\s/g, ""));
        onConnecte(poste);
      } else {
        onConnecte("");
      }
    } catch (probleme) {
      const erreurApi = probleme instanceof ErreurApi ? probleme : new ErreurApi("erreur-inattendue", 0);
      setErreur({ texte: expliquerErreur(erreurApi), nonAutorise: erreurApi.code === "non-autorise" });
      setCode("");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <CadreConnexion titre={cleOuverte ? "Ton code, s'il te plaît" : "Re-bonjour Hugo"} sousTitre={`Poste ${coffre.idPoste}`}>
      <form onSubmit={entrer} className="grid gap-4">
        {!cleOuverte && (
          <Champ libelle="Mot de passe de ce PC" type="password" autoComplete="current-password" autoFocus valeur={motDePasse} onChange={setMotDePasse} />
        )}
        {demanderCode && (
          <Champ
            libelle="Code à 6 chiffres"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus={cleOuverte}
            maxLength={7}
            placeholder="123 456"
            valeur={code}
            onChange={setCode}
            aide="Celui de ton application d'authentification, compte « SOS Miam Gestion »."
          />
        )}
        {erreur && (
          <div role="alert" className="rounded-xl bg-rose-alerte px-3 py-2 text-sm font-semibold text-rouge-texte">
            {erreur.texte}
            {erreur.nonAutorise && (
              <button type="button" onClick={onRevoirAutorisation} className="mt-1 block underline">Revoir la commande d'autorisation</button>
            )}
          </div>
        )}
        <Bouton type="submit" variante="principal" icone={LogIn} chargement={enCours}>Entrer</Bouton>
      </form>
      {!cleOuverte && (
        <details className="mt-6 text-sm text-gris">
          <summary className="cursor-pointer font-semibold">Mot de passe oublié ?</summary>
          <p className="mt-2">
            Il n'est gardé nulle part : il faut recréer une clé pour ce PC, puis l'autoriser à nouveau sur le serveur (et retirer
            l'ancienne avec <code className="text-[12px]">npm run gestion:autoriser -- --retirer {coffre.idPoste}</code>).
          </p>
          <Bouton petit variante="danger" className="mt-3" onClick={onOublierPoste}>Recréer une clé pour ce PC</Bouton>
        </details>
      )}
    </CadreConnexion>
  );
}
