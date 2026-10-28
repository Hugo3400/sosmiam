import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";

import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import { AGE_POSITION_MAX_MS, DUREE_NOUVEL_ESSAI_COMPTOIR_MS } from "@sos-miam/commun/regles/visites";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { LecturePosition } from "@sos-miam/commun/types/position";
import type { FeuillePositionVisite } from "~/composants/visites/FeuillePositionVisite";
import { classerCodeScanne } from "~/fonctions/scan/classer-code-scanne";
import { utiliserDemandeCompte } from "~/hooks/utiliser-demande-compte";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserPositionValidation, type ResultatLecturePosition } from "~/hooks/utiliser-position-validation";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserSession } from "~/hooks/utiliser-session";
import { enregistrerExplicationPositionVue, lireExplicationPositionVue } from "~/stockage/explication-position-vue";

/** repos, lecture de la position, envoi du QR, ou nouvel essai tout seul (pas de réseau) pendant une minute */
export type EtapeValidationComptoir = "repos" | "position" | "envoi" | "nouvel-essai";

export type EchecValidationComptoir = { erreur: ErreurService; details?: DetailsErreur };

/** Une lecture de position et l'instant où le téléphone l'a faite : son âge est recalculé au moment de l'envoi */
type PositionDatee = { position: LecturePosition; luLeMs: number };
type LectureDatee = { ok: true; datee: PositionDatee } | Extract<ResultatLecturePosition, { ok: false }>;

// Sans réseau, on renvoie le même QR et la même position toutes les 5 s, pendant une minute
const INTERVALLE_NOUVEL_ESSAI_MS = 5_000;
// Une lecture qui approche de 60 s est relue avant l'envoi : elle doit être encore fraîche en arrivant
const MARGE_FRAICHEUR_MS = 5_000;

function dater(position: LecturePosition): PositionDatee {
  return { position, luLeMs: Date.now() - position.ageMs };
}

/** La lecture avec son âge d'aujourd'hui ; null si elle est trop vieille pour partir */
function vieillir({ position, luLeMs }: PositionDatee): LecturePosition | null {
  const ageMs = Math.max(0, Math.round(Date.now() - luLeMs));
  return ageMs > AGE_POSITION_MAX_MS - MARGE_FRAICHEUR_MS ? null : { ...position, ageMs };
}

function attendre(ms: number): Promise<void> {
  return new Promise((resoudre) => setTimeout(resoudre, ms));
}

/** QR de vitrine : « Voir la fiche » du lieu, comme le ferait le serveur (le scanner est réservé aux inscrits, bars compris) */
function decrireVitrine(lieu: Lieu): EchecValidationComptoir {
  return { erreur: "qr-vitrine", details: { lieuId: lieu.id, lieu: lieu.nom } };
}

/**
 * Le scanner du QR du comptoir, sans l'appareil photo : explique la position la première fois, la lit (pendant qu'on vise),
 * range le texte scanné (invitation refusée, vitrine, autre chose : aucune adresse lue n'est jamais
 * ouverte), envoie le QR du comptoir, puis ouvre la célébration. Sans réseau, réessaie tout seul pendant une minute.
 * Pose la feuille « Petite vérif' de position » dans l'écran avec `propsFeuille`. La position n'est jamais gardée au-delà.
 */
export function utiliserValidationComptoir(): {
  preparer: () => Promise<boolean>;
  traiterTexte: (texte: string) => Promise<void>;
  etape: EtapeValidationComptoir;
  echec: EchecValidationComptoir | null;
  effacerEchec: () => void;
  propsFeuille: ComponentProps<typeof FeuillePositionVisite>;
} {
  const services = utiliserServices();
  const { contenu } = utiliserSession();
  const { trouverLieu, chargerLieu } = utiliserLieux();
  const demanderCompte = utiliserDemandeCompte();
  const { lire: lirePosition } = utiliserPositionValidation();
  const vraiePosition = services.source === "api";

  const [etape, setEtape] = useState<EtapeValidationComptoir>("repos");
  const [echec, setEchec] = useState<EchecValidationComptoir | null>(null);
  // Le nom reste après la fermeture : le texte ne change pas pendant que la feuille descend
  const [feuille, setFeuille] = useState<{ visible: boolean; lieuNom: string | null }>({ visible: false, lieuNom: null });

  const monte = useRef(true);
  const occupe = useRef(false);
  const reponseFeuille = useRef<((acceptee: boolean) => void) | null>(null);
  const explication = useRef<Promise<boolean> | null>(null);
  // La lecture lancée pendant qu'on vise, servie une fois au scan qui suit
  const lectureAvance = useRef<{ promesse: Promise<LectureDatee>; lanceeLeMs: number } | null>(null);

  useEffect(() => {
    monte.current = true;
    return () => {
      // L'écran se ferme : la feuille qui attend vaut « Pas maintenant », les essais en cours s'arrêtent
      monte.current = false;
      reponseFeuille.current?.(false);
      reponseFeuille.current = null;
      lectureAvance.current = null;
    };
  }, []);

  /** Un lieu par son identifiant : dans la liste, sinon lu seul sur le serveur (« hors-ligne » s'il ne répond pas) */
  const lireLieu = useCallback(
    async (id: number): Promise<Lieu | "inconnu" | "hors-ligne"> => {
      const connu = trouverLieu(id);
      if (connu) return connu;
      const r = await chargerLieu(id);
      return r.ok ? r.lieu : r.raison;
    },
    [trouverLieu, chargerLieu],
  );

  /** Le lieu d'un QR de vitrine, retrouvé par le serveur grâce à son code */
  const decrireCodeVitrine = useCallback(
    async (codePublic: string): Promise<EchecValidationComptoir> => {
      const r = await contenu.trouverParCode(codePublic);
      if (!r.ok && r.erreur !== "lieu-inconnu" && r.erreur !== "introuvable") return { erreur: r.erreur };
      const lieu = r.ok ? await lireLieu(r.lieuId) : "inconnu";
      if (lieu === "hors-ligne") return { erreur: "hors-ligne" };
      return lieu === "inconnu" ? { erreur: "introuvable" } : decrireVitrine(lieu);
    },
    [contenu, lireLieu],
  );

  const repondreFeuille = useCallback((acceptee: boolean) => {
    const resoudre = reponseFeuille.current;
    reponseFeuille.current = null;
    setFeuille((f) => ({ ...f, visible: false }));
    resoudre?.(acceptee);
  }, []);

  /**
   * « Petite vérif' de position », la toute première fois seulement (même mémoire que l'addition). Une explication déjà
   * ouverte (préparation puis scan, ou deux préparations) est partagée : une seule feuille, une seule réponse pour tous.
   */
  const expliquer = useCallback((lieuNom: string | null): Promise<boolean> => {
    explication.current ??= (async () => {
      try {
        if (await lireExplicationPositionVue()) return true;
        const acceptee = await new Promise<boolean>((resoudre) => {
          reponseFeuille.current = resoudre;
          setFeuille({ visible: true, lieuNom });
        });
        if (acceptee) await enregistrerExplicationPositionVue();
        return acceptee;
      } finally {
        explication.current = null;
      }
    })();
    return explication.current;
  }, []);

  const lireDatee = useCallback(
    async (): Promise<LectureDatee> => {
      const lue = await lirePosition();
      return lue.ok ? { ok: true, datee: dater(lue.position) } : lue;
    },
    [lirePosition],
  );

  const preparer = useCallback(async (): Promise<boolean> => {
    if (!demanderCompte("scan")) return false;
    // Version publiée sans comptes : rien ne sera validé, inutile de demander la position
    if (services.source === "indisponible") return true;
    if (!(await expliquer(null))) return false;
    const avance = lectureAvance.current;
    if (vraiePosition && monte.current && (!avance || Date.now() - avance.lanceeLeMs > AGE_POSITION_MAX_MS - MARGE_FRAICHEUR_MS)) {
      lectureAvance.current = { promesse: lireDatee(), lanceeLeMs: Date.now() };
    }
    return true;
  }, [demanderCompte, services.source, expliquer, vraiePosition, lireDatee]);

  /** La lecture faite pendant qu'on visait si elle est encore bonne (une seule fois), sinon une lecture toute fraîche */
  const obtenirPosition = useCallback(
    async (): Promise<LectureDatee> => {
      const avance = vraiePosition ? lectureAvance.current : null;
      lectureAvance.current = null;
      if (avance) {
        const lue = await avance.promesse;
        if (lue.ok ? vieillir(lue.datee) !== null : lue.erreur !== "position-introuvable") return lue;
      }
      return lireDatee();
    },
    [vraiePosition, lireDatee],
  );

  /**
   * Envoie le QR ; sans réseau, garde le texte et la position et réessaie toutes les 5 s pendant une minute.
   * Vrai si la visite est validée (la célébration s'ouvre).
   */
  const envoyer = useCallback(
    async (texte: string, lecture: PositionDatee, lieu: Lieu, details: DetailsErreur): Promise<boolean> => {
      const debut = Date.now();
      let datee = lecture;
      setEtape("envoi");
      for (;;) {
        let position = vieillir(datee);
        if (!position) {
          // Lecture trop vieille (une minute de nouveaux essais) : on en relit une toute fraîche
          const relue = await lireDatee();
          if (!monte.current) return false;
          if (!relue.ok) {
            setEchec({ erreur: relue.erreur, details });
            return false;
          }
          datee = relue.datee;
          position = relue.datee.position;
        }
        const reponse = await services.visites.validerComptoir(texte, position);
        if (!monte.current) return false;
        if (reponse.ok) {
          router.replace({ pathname: "/visite/[id]", params: { id: String(reponse.visite.id), celebrer: "1" } });
          return true;
        }
        if (reponse.erreur === "hors-ligne" && Date.now() - debut + INTERVALLE_NOUVEL_ESSAI_MS <= DUREE_NOUVEL_ESSAI_COMPTOIR_MS) {
          setEtape("nouvel-essai");
          await attendre(INTERVALLE_NOUVEL_ESSAI_MS);
          if (!monte.current) return false;
          continue;
        }
        setEchec({ erreur: reponse.erreur, details: { ...details, ...reponse.details } });
        return false;
      }
    },
    [services.visites, lireDatee],
  );

  const traiterTexte = useCallback(
    async (texte: string): Promise<void> => {
      // Une seule lecture à la fois : les QR lus pendant qu'on traite le premier sont ignorés, et plus rien une fois validé
      if (occupe.current) return;
      occupe.current = true;
      let validee = false;
      setEchec(null);
      try {
        const code = classerCodeScanne(texte);
        if (code.type === "invitation") return setEchec({ erreur: "qr-invitation" });
        if (code.type === "autre") return setEchec({ erreur: "qr-illisible" });
        if (code.type === "lieu") return setEchec(await decrireCodeVitrine(code.codePublic));
        if (services.source === "indisponible") return setEchec({ erreur: "service-indisponible" });

        const lieu = await lireLieu(code.jeton.lieuId);
        if (lieu === "hors-ligne") return setEchec({ erreur: "hors-ligne" });
        if (lieu === "inconnu") return setEchec({ erreur: "qr-invalide" });
        const details: DetailsErreur = { lieu: lieu.nom, lieuId: lieu.id };
        // « Pas maintenant » : on le dit, sinon le QR toujours visé relancerait aussitôt la même question
        if (!(await expliquer(lieu.nom))) return setEchec({ erreur: "position-refusee", details });
        if (!monte.current) return;

        setEtape("position");
        const lecture = await obtenirPosition();
        if (!monte.current) return;
        if (!lecture.ok) return setEchec({ erreur: lecture.erreur, details });
        validee = await envoyer(texte, lecture.datee, lieu, details);
      } finally {
        // Validée : la célébration remplace cet écran, on garde le verrou et l'étape jusqu'au bout
        if (!validee) {
          occupe.current = false;
          if (monte.current) setEtape("repos");
        }
      }
    },
    [services.source, decrireCodeVitrine, lireLieu, expliquer, obtenirPosition, envoyer],
  );

  const effacerEchec = useCallback(() => setEchec(null), []);

  const propsFeuille = useMemo(
    () => ({
      visible: feuille.visible,
      lieuNom: feuille.lieuNom,
      onAccepter: () => repondreFeuille(true),
      onRefuser: () => repondreFeuille(false),
    }),
    [feuille, repondreFeuille],
  );

  return { preparer, traiterTexte, etape, echec, effacerEchec, propsFeuille };
}
