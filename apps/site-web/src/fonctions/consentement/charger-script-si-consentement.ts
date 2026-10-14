import { EVENEMENT_CONSENTEMENT, type IdCategorieFacultative } from "~/contenus/cookies-consentement";
import { aConsenti } from "~/fonctions/consentement/a-consenti";
import { lireConsentementNavigateur } from "~/fonctions/consentement/lire-consentement-navigateur";

/**
 * Charge le script d'un partenaire (pub, mesure…) seulement si sa catégorie est acceptée : tout de suite si c'est déjà le
 * cas, sinon dès que la personne l'accepte (événement « sosmiam:consentement »). Rien sur le serveur. Refuse tout script
 * qui n'est pas en https ou dont le domaine n'est pas déclaré chez un partenaire de la catégorie
 * (contenus/cookies-consentement.ts) : la liste des partenaires reste la vérité. Renvoie de quoi arrêter d'attendre
 * (à appeler quand le composant disparaît). Un retrait recharge la page : le script n'y est plus.
 */
export function chargerScriptSiConsentement(categorie: IdCategorieFacultative, src: string): () => void {
  const rien = () => {};
  const etat = lireConsentementNavigateur();
  if (!etat) return rien;
  const adresse = new URL(src, window.location.href);
  const declare = etat.categories
    .find((candidate) => candidate.id === categorie)
    ?.partenaires.some((partenaire) => partenaire.domaines.includes(adresse.hostname));
  if (adresse.protocol !== "https:" || !declare) {
    console.error(`Script refusé (${adresse.href}) : domaine non déclaré pour « ${categorie} » dans contenus/cookies-consentement.ts.`);
    return rien;
  }

  function essayer(): boolean {
    if (!aConsenti(categorie, lireConsentementNavigateur()?.choix ?? null)) return false;
    if (![...document.scripts].some((script) => script.src === adresse.href)) {
      const script = document.createElement("script");
      script.src = adresse.href;
      script.async = true;
      script.dataset.consentement = categorie;
      document.head.append(script);
    }
    return true;
  }

  if (essayer()) return rien;
  const ecouter = () => {
    if (essayer()) window.removeEventListener(EVENEMENT_CONSENTEMENT, ecouter);
  };
  window.addEventListener(EVENEMENT_CONSENTEMENT, ecouter);
  return () => window.removeEventListener(EVENEMENT_CONSENTEMENT, ecouter);
}
