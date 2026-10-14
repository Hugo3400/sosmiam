import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useLocation } from "react-router";

import { BandeauCookies } from "~/composants/cookies/BandeauCookies";
import {
  ADRESSE_CHOIX_COOKIES,
  ADRESSE_REGLAGES_COOKIES,
  EVENEMENT_CONSENTEMENT,
  PARAMETRE_APERCU_COOKIES,
  textesConsentement,
} from "~/contenus/cookies-consentement";
import { aConsenti } from "~/fonctions/consentement/a-consenti";
import { calculerVersionConsentement } from "~/fonctions/consentement/calculer-version-consentement";
import { choisirCategoriesConsentement } from "~/fonctions/consentement/choisir-categories-consentement";
import { choisirReglagesCookieConsentement } from "~/fonctions/consentement/choisir-reglages-cookie-consentement";
import { creerEffacementsTraceurs } from "~/fonctions/consentement/creer-effacements-traceurs";
import { doitAfficherBandeau } from "~/fonctions/consentement/doit-afficher-bandeau";
import { ecrireCookieConsentement } from "~/fonctions/consentement/ecrire-cookie-consentement";
import { lireChoixConsentement } from "~/fonctions/consentement/lire-choix-consentement";
import { lireFormulaireConsentement } from "~/fonctions/consentement/lire-formulaire-consentement";
import { listerCategoriesAChoisir } from "~/fonctions/consentement/lister-categories-a-choisir";
import { ContexteConsentement, type ValeurConsentement } from "~/hooks/utiliser-consentement";
import type { EtatConsentementServeur, ReponsesConsentement } from "~/types/consentement";

type Props = {
  /** Lu par le serveur (loader de root.tsx) : aperçu ou pas, et le choix du cookie */
  etat: EtatConsentementServeur;
  children: ReactNode;
};

/** Les données d'un formulaire envoyé, avec le bouton qui l'a envoyé (« geste ») */
function lireEnvoi(evenement: FormEvent<HTMLFormElement>): FormData {
  const bouton = (evenement.nativeEvent as SubmitEvent).submitter;
  try {
    return new FormData(evenement.currentTarget, bouton);
  } catch {
    const donnees = new FormData(evenement.currentTarget);
    if (bouton instanceof HTMLButtonElement && bouton.name) donnees.set(bouton.name, bouton.value);
    return donnees;
  }
}

/**
 * Le gestionnaire de consentement aux cookies, autour de toutes les pages (root.tsx) : il garde le choix, le donne aux
 * composants (utiliserConsentement), affiche le bandeau tant qu'une catégorie active n'a pas de réponse, et le panneau
 * « Choisir » quand on le demande (lien « Gérer mes cookies »). Sans catégorie active, il ne montre rien.
 */
export function GestionnaireConsentement({ etat, children }: Props) {
  const { apercu } = etat;
  const location = useLocation();
  const categories = useMemo(() => choisirCategoriesConsentement(apercu), [apercu]);
  const aChoisir = useMemo(() => listerCategoriesAChoisir(categories), [categories]);
  const version = useMemo(() => calculerVersionConsentement(categories), [categories]);
  const [choix, setChoix] = useState(etat.choix);
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const [annonce, setAnnonce] = useState("");
  const [hauteur, setHauteur] = useState(0);
  const refDialogue = useRef<HTMLDivElement>(null);
  const declencheur = useRef<HTMLElement | null>(null);

  // Le navigateur a le dernier mot : son cookie est relu après l'hydratation et à chaque nouvelle lecture du serveur
  // (une page gardée en cache ne montre donc jamais le choix de quelqu'un d'autre)
  useEffect(() => {
    setChoix(lireChoixConsentement(document.cookie, version, Date.now()));
  }, [version, etat]);

  // Hors aperçu (on a quitté « ?apercu-cookies »), le panneau d'aperçu se ferme
  useEffect(() => {
    if (aChoisir.length === 0) setPanneauOuvert(false);
  }, [aChoisir]);

  const bandeau = doitAfficherBandeau(aChoisir, choix);
  const visible = bandeau || panneauOuvert;

  // Le panneau s'ouvre : le focus va à son titre (annoncé par les lecteurs d'écran)
  useEffect(() => {
    if (panneauOuvert) document.getElementById("bandeau-cookies-titre-panneau")?.focus({ preventScroll: true });
  }, [panneauOuvert]);

  // Une cale de la hauteur du bandeau en bas de page : le pied de page ne reste pas caché dessous
  useEffect(() => {
    const element = refDialogue.current;
    if (!visible || !element) return;
    const observateur = new ResizeObserver(() => setHauteur(element.getBoundingClientRect().height));
    observateur.observe(element);
    return () => observateur.disconnect();
  }, [visible]);

  function fermerPanneau() {
    const focusDedans = refDialogue.current?.contains(document.activeElement) ?? false;
    setPanneauOuvert(false);
    const cible = declencheur.current;
    declencheur.current = null;
    if (cible?.isConnected) cible.focus({ preventScroll: true });
    else if (focusDedans) (document.getElementById("contenu") ?? document.body).focus({ preventScroll: true });
  }

  function enregistrer(reponses: ReponsesConsentement) {
    const maintenant = Date.now();
    const nouveau = { version, date: Math.floor(maintenant / 1000) * 1000, reponses };
    const hote = window.location.hostname;
    document.cookie = ecrireCookieConsentement(nouveau, choisirReglagesCookieConsentement(hote, apercu), maintenant);
    // Retrait d'un accord : on efface ce qu'on peut des cookies de la catégorie, et on recharge (plus aucun script tiers)
    const retirees = aChoisir.filter((categorie) => choix?.reponses[categorie.id] === true && reponses[categorie.id] !== true);
    if (retirees.length > 0) {
      for (const effacement of creerEffacementsTraceurs(retirees, document.cookie, hote)) document.cookie = effacement;
      window.location.reload();
      return;
    }
    setChoix(nouveau);
    setAnnonce(textesConsentement.choixEnregistre);
    window.dispatchEvent(new CustomEvent(EVENEMENT_CONSENTEMENT));
    fermerPanneau();
  }

  function envoyerFormulaire(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const donnees = lireEnvoi(evenement);
    // La croix, quand tout a déjà une réponse : fermer sans rien changer
    if (donnees.get("geste") === "fermer" && !bandeau) return fermerPanneau();
    enregistrer(lireFormulaireConsentement(donnees, aChoisir, choix));
  }

  function fermerAvecEchap() {
    if (!bandeau) return fermerPanneau();
    const donnees = new FormData();
    donnees.set("geste", "fermer");
    enregistrer(lireFormulaireConsentement(donnees, aChoisir, choix));
  }

  const suffixeApercu = apercu ? `?${PARAMETRE_APERCU_COOKIES}` : "";
  const valeur: ValeurConsentement = {
    apercu,
    categories,
    aChoisir,
    choix,
    aConsenti: (categorie) => aConsenti(categorie, choix),
    ouvrirReglages: (element) => {
      if (aChoisir.length === 0) return false;
      declencheur.current = element;
      setAnnonce("");
      setPanneauOuvert(true);
      return true;
    },
    envoyerFormulaire,
    actionFormulaire: `${ADRESSE_CHOIX_COOKIES}${suffixeApercu}`,
  };

  return (
    <ContexteConsentement value={valeur}>
      {visible && (
        <BandeauCookies
          panneauOuvert={panneauOuvert}
          gestion={!bandeau}
          retour={`${location.pathname}${location.search}`}
          adresseReglages={ADRESSE_REGLAGES_COOKIES.replace("#", `${suffixeApercu}#`)}
          adressePage={`/cookies${suffixeApercu}`}
          onChoisir={() => setPanneauOuvert(true)}
          onEchap={fermerAvecEchap}
          refDialogue={refDialogue}
        />
      )}
      {children}
      {visible && <div aria-hidden="true" className="h-72 sm:h-48" style={hauteur ? { height: hauteur } : undefined} />}
      {aChoisir.length > 0 && <p role="status" className="sr-only">{annonce}</p>}
    </ContexteConsentement>
  );
}
