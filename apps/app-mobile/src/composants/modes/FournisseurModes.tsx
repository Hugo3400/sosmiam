import { router, useNavigationContainerRef } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { listerModesOuverts } from "@sos-miam/commun/fonctions/roles/lister-modes-ouverts";
import type { ModeApp, RolesCompte } from "@sos-miam/commun/types/roles";
import { choisirModeARestaurer } from "~/fonctions/modes/choisir-mode-a-restaurer";
import { ContexteModes, type EtatModes } from "~/hooks/utiliser-modes";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { effacerModeApp, enregistrerModeApp, lireModeApp, MODE_APP_PAR_DEFAUT, type ModeAppGarde } from "~/stockage/mode-app";

const SEUL_MODE_PERSO: ModeApp[] = ["perso"];
const ROLES_VIDES: RolesCompte = { ambassadeur: null, pro: [] };

// Au démarrage, on attend que la pile d'écrans soit montée pour rouvrir le dernier mode ; au-delà, on reste en mode perso
const ATTENTE_PILE_MAX = 5000;
const INTERVALLE_ATTENTE_PILE = 200;

type EtatNavigation = { routes: readonly { name: string; state?: unknown }[] } | undefined;

/** Vrai quand les onglets perso sont dans l'état de navigation : la pile d'écrans (PileRacine) est montée. */
function contientOnglets(etat: EtatNavigation): boolean {
  if (!etat || !Array.isArray(etat.routes)) return false;
  return etat.routes.some((route) => route.name === "(onglets)" || contientOnglets(route.state as EtatNavigation));
}

/**
 * Modes de l'app : perso pour tout le monde ; pro (équipe d'un lieu) et ambassadeur pour les comptes qui ont le rôle (une
 * visite sans compte n'a que perso).
 * Avec un vrai compte connecté, les rôles sont les siens (relus par le serveur) ; sans compte, aucun.
 * Le dernier mode est gardé sur le téléphone : au lancement, s'il est encore ouvert, on y revient une fois la navigation prête.
 * Un rôle qui disparaît (ou un profil effacé) ramène au mode perso ; la garde de PileRacine ferme alors les écrans du mode.
 */
export function FournisseurModes({ children }: { children: ReactNode }) {
  const { profil, chargement } = utiliserProfil();
  const navigation = useNavigationContainerRef();
  const [garde, setGarde] = useState<ModeAppGarde>(MODE_APP_PAR_DEFAUT);
  const [relu, setRelu] = useState(false);
  const pret = relu && !chargement;

  useEffect(() => {
    lireModeApp()
      .then(setGarde)
      .catch(() => {})
      .finally(() => setRelu(true));
  }, []);

  // Un vrai compte connecté : ses rôles à lui (rattachements validés, statut d'ambassadeur), relus par le serveur
  const { compte, connecte, pret: sessionPrete } = utiliserSession();
  const rolesConnus = relu && sessionPrete && (!connecte || compte !== null);
  const roles = useMemo<RolesCompte>(
    () =>
      compte
        ? { ambassadeur: compte.ambassadeur?.statut ?? null, pro: compte.pro.lieuxValides.map((l) => ({ id: l.lieuId, nom: l.nom, emoji: l.emoji, role: l.role })) }
        : ROLES_VIDES,
    [compte],
  );
  const modesOuverts = useMemo(() => (profil ? listerModesOuverts(roles) : SEUL_MODE_PERSO), [profil, roles]);
  const proOuvert = modesOuverts.includes("pro");
  const lieuPro = useMemo(
    () => (proOuvert ? (roles.pro.find((l) => l.id === garde.lieuProId) ?? roles.pro[0] ?? null) : null),
    [proOuvert, roles.pro, garde.lieuProId],
  );

  const memoriser = useCallback((nouvelle: ModeAppGarde) => {
    setGarde(nouvelle);
    enregistrerModeApp(nouvelle).catch(() => {});
  }, []);

  // Profil effacé (« Tout effacer ») : le mode part avec lui
  const avaitUnProfil = useRef(false);
  useEffect(() => {
    if (chargement) return;
    if (avaitUnProfil.current && profil === null) {
      setGarde(MODE_APP_PAR_DEFAUT);
      effacerModeApp().catch(() => {});
    }
    avaitUnProfil.current = profil !== null;
  }, [profil, chargement]);

  // Le dernier mode n'est plus ouvert (rôle retiré, profil effacé…) : retour au mode perso
  useEffect(() => {
    if (pret && rolesConnus && profil && garde.dernierMode !== "perso" && !modesOuverts.includes(garde.dernierMode)) {
      memoriser({ ...garde, dernierMode: "perso" });
    }
  }, [pret, rolesConnus, profil, garde, modesOuverts, memoriser]);

  // Au lancement, une seule fois : le mode à rouvrir (s'il est encore ouvert)
  const [aRestaurer, setARestaurer] = useState<"pro" | "ambassadeur" | null>(null);
  const decide = useRef(false);
  const debutPret = useRef<number | null>(null);
  useEffect(() => {
    if (!pret || decide.current) return;
    debutPret.current ??= Date.now();
    if (!rolesConnus) return;
    decide.current = true;
    const mode = choisirModeARestaurer(garde.dernierMode, modesOuverts, profil !== null, Date.now() - debutPret.current);
    if (mode) setARestaurer(mode);
  }, [pret, rolesConnus, profil, garde.dernierMode, modesOuverts]);

  const annulerRestauration = useCallback(() => {
    decide.current = true;
    setARestaurer(null);
  }, []);

  // … rouvert dès que la pile d'écrans est montée (sinon la navigation ne connaît pas encore les écrans du mode)
  useEffect(() => {
    if (!aRestaurer) return;
    let fait = false;
    const essayer = () => {
      if (fait || !navigation.isReady() || !contientOnglets(navigation.getRootState())) return;
      fait = true;
      setARestaurer(null);
      router.push(aRestaurer === "pro" ? "/pro/comptoir" : "/ambassadeur");
    };
    const desabonner = navigation.addListener("state", essayer);
    const intervalle = setInterval(essayer, INTERVALLE_ATTENTE_PILE);
    const abandon = setTimeout(() => {
      fait = true;
      setARestaurer(null);
    }, ATTENTE_PILE_MAX);
    essayer();
    return () => {
      desabonner();
      clearInterval(intervalle);
      clearTimeout(abandon);
    };
  }, [aRestaurer, navigation]);

  const choisirLieuPro = useCallback(
    (lieuId: number) => {
      if (roles.pro.some((l) => l.id === lieuId)) memoriser({ ...garde, lieuProId: lieuId });
    },
    [roles.pro, garde, memoriser],
  );

  const entrerEnModePro = useCallback(
    (lieuId?: number) => {
      if (!proOuvert) return;
      const choisi = lieuId !== undefined && roles.pro.some((l) => l.id === lieuId) ? lieuId : garde.lieuProId;
      memoriser({ dernierMode: "pro", lieuProId: choisi });
      router.push("/pro/comptoir");
    },
    [proOuvert, roles.pro, garde.lieuProId, memoriser],
  );

  const entrerEnModeAmbassadeur = useCallback(() => {
    if (!modesOuverts.includes("ambassadeur")) return;
    memoriser({ ...garde, dernierMode: "ambassadeur" });
    router.push("/ambassadeur");
  }, [modesOuverts, garde, memoriser]);

  const revenirAuModePerso = useCallback(() => {
    memoriser({ ...garde, dernierMode: "perso" });
    // Les onglets perso sont restés montés sous le mode : on y redescend ; s'ils n'y sont pas, l'écran est remplacé
    router.dismissTo("/profil");
  }, [garde, memoriser]);

  const valeur = useMemo<EtatModes>(
    () => ({
      pret,
      roles,
      modesOuverts,
      lieuPro,
      choisirLieuPro,
      entrerEnModePro,
      entrerEnModeAmbassadeur,
      revenirAuModePerso,
      rolesConnus,
      annulerRestauration,
    }),
    [pret, roles, modesOuverts, lieuPro, choisirLieuPro, entrerEnModePro, entrerEnModeAmbassadeur, revenirAuModePerso, rolesConnus, annulerRestauration],
  );

  return <ContexteModes.Provider value={valeur}>{children}</ContexteModes.Provider>;
}
