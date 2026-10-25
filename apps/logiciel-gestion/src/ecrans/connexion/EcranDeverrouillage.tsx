import { LogIn } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { decoderBase64Url } from "~/fonctions/securite/decoder-base64url.ts";
import { deriverOctetsMotDePasse } from "~/fonctions/securite/deriver-octets-mot-de-passe.ts";
import { ouvrirCoffreAvecOctets } from "~/fonctions/securite/ouvrir-coffre-avec-octets.ts";
import { retenirDeverrouillage, rouvrirDeverrouillageRetenu } from "~/services/deverrouillage.ts";
import { peutRetenirMotDePasse } from "~/services/systeme.ts";
import { CHOIX_RETENUE, ecrireChoixRetenue, lireChoixRetenue } from "~/stockage/deverrouillage-retenu.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { aUneSession, configurerClient, ErreurApi } from "~/services/client-gestion.ts";
import { aUneSessionGardee, definirCleCoffre, ouvrirSession, reprendreSessionGardee } from "~/services/session.ts";
import { TEXTES_AUTORISATION, TEXTES_PASSAGE } from "~/contenus/postes.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { estPassageFini, estPosteDePassage, type CoffreCle } from "~/stockage/coffre-local.ts";
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
  const [retenue, setRetenue] = useState(lireChoixRetenue);

  async function ouvrirAvec(cles: { cleSecrete: CryptoKey; cleCoffre: CryptoKey }): Promise<boolean> {
    configurerClient(cles.cleSecrete, coffre.idPoste);
    await definirCleCoffre(cles.cleCoffre);
    setCleOuverte(true);
    if (estPassageFini(coffre)) {
      onRevoirAutorisation();
      return true;
    }
    if (aUneSession()) {
      onConnecte("");
      return true;
    }
    if (demanderCode) return false;
    const poste = await reprendreSessionGardee();
    if (poste) {
      onConnecte(poste);
      return true;
    }
    setDemanderCode(true);
    setErreur({ texte: "Ta session a expiré (30 jours) : tape ton code." });
    return false;
  }

  useEffect(() => {
    if (cleEnMemoire) return;
    let annule = false;
    setEnCours(true);
    void rouvrirDeverrouillageRetenu(coffre)
      .then((cles) => (cles && !annule ? ouvrirAvec(cles) : false))
      .catch(() => false)
      .finally(() => !annule && setEnCours(false));
    return () => void (annule = true);
  }, []);

  async function entrer(evenement: FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      if (!cleOuverte) {
        const octets = await deriverOctetsMotDePasse(motDePasse, decoderBase64Url(coffre.sel), coffre.iterations);
        let cles: { cleSecrete: CryptoKey; cleCoffre: CryptoKey };
        try {
          cles = await ouvrirCoffreAvecOctets(coffre, octets);
          ecrireChoixRetenue(retenue);
          await retenirDeverrouillage(octets, CHOIX_RETENUE.find((c) => c.valeur === retenue)?.heures ?? 0);
        } catch {
          setErreur({ texte: "Mauvais mot de passe." });
          return;
        } finally {
          octets.fill(0);
        }
        setMotDePasse("");
        if (await ouvrirAvec(cles)) return;
        if (!demanderCode && !aUneSession()) return;
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
      {estPassageFini(coffre) && <p role="status" className="mb-4 rounded-xl bg-jaune-clair px-3 py-2 text-sm font-semibold">{TEXTES_PASSAGE.expire(formaterDate(coffre.expireLe!, true))}</p>}
      <form onSubmit={entrer} className="grid gap-4">
        {!cleOuverte && (
          <Champ libelle="Mot de passe de ce PC" type="password" autoComplete="current-password" autoFocus valeur={motDePasse} onChange={setMotDePasse} />
        )}
        {!cleOuverte && peutRetenirMotDePasse() && !estPosteDePassage(coffre) && (
          <Selecteur libelle="Retenir le mot de passe sur ce PC" valeur={retenue} onChange={setRetenue} options={CHOIX_RETENUE.map(({ valeur, libelle }) => ({ valeur, libelle }))} className="w-full" />
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
              <button type="button" onClick={onRevoirAutorisation} className="mt-1 block underline">{TEXTES_AUTORISATION.lienDepuisConnexion}</button>
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
