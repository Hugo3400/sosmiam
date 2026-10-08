import { router, useNavigationContainerRef } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { listerModesOuverts } from "@sos-miam/commun/fonctions/roles/lister-modes-ouverts";
import { AGE_ALCOOL } from "@sos-miam/commun/regles/ages";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import type { ModeApp, RolesCompte } from "@sos-miam/commun/types/roles";
import { ContexteModes, type EtatModes } from "~/hooks/utiliser-modes";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { DEMO_VISITES_ACTIVE as DEMO } from "~/services/demo/demo-visites-active";
import { effacerModeApp, enregistrerModeApp, lireModeApp, MODE_APP_PAR_DEFAUT, type ModeAppGarde } from "~/stockage/mode-app";
import { effacerRolesDemo, enregistrerRolesDemo, lireRolesDemo, ROLES_VIDES } from "~/stockage/roles-demo";

const SEUL_MODE_PERSO: ModeApp[] = ["perso"];

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
 * Modes de l'app : perso pour tout le monde ; pro (équipe d'un lieu) et ambassadeur pour les 18 ans et plus qui ont le rôle.
 * En démo, les rôles sont ceux joués dans les Coulisses ; sans démo, aucun en attendant le compte unique.
 * Le dernier mode est gardé sur le téléphone : au lancement, s'il est encore ouvert, on y revient une fois la navigation prête.
 * Un rôle qui disparaît (ou un profil effacé) ramène au mode perso ; la garde de PileRacine ferme alors les écrans du mode.
 */
export function FournisseurModes({ children }: { children: ReactNode }) {
  const { profil, chargement } = utiliserProfil();
  const navigation = useNavigationContainerRef();
  const [roles, setRoles] = useState<RolesCompte>(ROLES_VIDES);
  const [garde, setGarde] = useState<ModeAppGarde>(MODE_APP_PAR_DEFAUT);
  const [relu, setRelu] = useState(false);
  const pret = relu && !chargement;

  useEffect(() => {
    Promise.all([DEMO ? lireRolesDemo() : Promise.resolve(ROLES_VIDES), lireModeApp()])
      .then(([rolesLus, gardeLue]) => {
        setRoles(rolesLus);
        setGarde(gardeLue);
      })
      .catch(() => {})
      .finally(() => setRelu(true));
  }, []);

  const majeur = profil !== null && calculerAge(profil.dateNaissance) >= AGE_ALCOOL;
  const modesOuverts = useMemo(() => (profil ? listerModesOuverts(roles, majeur) : SEUL_MODE_PERSO), [profil, roles, majeur]);
  const proOuvert = modesOuverts.includes("pro");
  const lieuPro = useMemo(
    () => (proOuvert ? (roles.pro.find((l) => l.id === garde.lieuProId) ?? roles.pro[0] ?? null) : null),
    [proOuvert, roles.pro, garde.lieuProId],
  );

  const memoriser = useCallback((nouvelle: ModeAppGarde) => {
    setGarde(nouvelle);
    enregistrerModeApp(nouvelle).catch(() => {});
  }, []);

  // Profil effacé (« Tout effacer ») : les rôles de démo et le mode partent avec lui
  const avaitUnProfil = useRef(false);
  useEffect(() => {
    if (chargement) return;
    if (avaitUnProfil.current && profil === null) {
      setRoles(ROLES_VIDES);
      setGarde(MODE_APP_PAR_DEFAUT);
      effacerRolesDemo().catch(() => {});
      effacerModeApp().catch(() => {});
    }
    avaitUnProfil.current = profil !== null;
  }, [profil, chargement]);

  // Le dernier mode n'est plus ouvert (rôle retiré, anniversaire pas encore passé…) : retour au mode perso
  useEffect(() => {
    if (pret && profil && garde.dernierMode !== "perso" && !modesOuverts.includes(garde.dernierMode)) {
      memoriser({ ...garde, dernierMode: "perso" });
    }
  }, [pret, profil, garde, modesOuverts, memoriser]);

  // Au lancement, une seule fois : le mode à rouvrir (s'il est encore ouvert)
  const [aRestaurer, setARestaurer] = useState<"pro" | "ambassadeur" | null>(null);
  const decide = useRef(false);
  useEffect(() => {
    if (!pret || decide.current) return;
    decide.current = true;
    if (profil && garde.dernierMode !== "perso" && modesOuverts.includes(garde.dernierMode)) setARestaurer(garde.dernierMode);
  }, [pret, profil, garde.dernierMode, modesOuverts]);

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

  const changerRolesDemo = useMemo(
    () =>
      DEMO
        ? async (nouveaux: RolesCompte) => {
            setRoles(nouveaux);
            await enregistrerRolesDemo(nouveaux);
          }
        : null,
    [],
  );

  const valeur = useMemo<EtatModes>(
    () => ({
      pret,
      roles,
      majeur,
      modesOuverts,
      lieuPro,
      choisirLieuPro,
      entrerEnModePro,
      entrerEnModeAmbassadeur,
      revenirAuModePerso,
      changerRolesDemo,
    }),
    [pret, roles, majeur, modesOuverts, lieuPro, choisirLieuPro, entrerEnModePro, entrerEnModeAmbassadeur, revenirAuModePerso, changerRolesDemo],
  );

  return <ContexteModes.Provider value={valeur}>{children}</ContexteModes.Provider>;
}
