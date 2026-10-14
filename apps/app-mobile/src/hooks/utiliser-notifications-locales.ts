import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { NotificationSuivi, NouvelleNotificationSuivi } from "@sos-miam/commun/types/suivis";
import { creerNotificationsDemo, DELAI_PUBLICATION_EXEMPLE } from "~/contenus/notifications-exemples";
import { creerIdentifiant } from "~/fonctions/communaute/creer-identifiant";
import { calculerCleSuivi } from "~/fonctions/publications/calculer-cle-suivi";
import { lireCleSuivi } from "~/fonctions/suivi/lire-cle-suivi";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import type { EtatNotifications } from "~/hooks/utiliser-notifications";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import {
  effacerNotificationsLocales,
  enregistrerNotificationsLocales,
  lireNotificationsLocales,
  NOMBRE_MAX_NOTIFICATIONS,
  type NotificationsLocales,
} from "~/stockage/notifications-locales";

/** La plus récente devant, NOMBRE_MAX_NOTIFICATIONS au plus */
const avecNotification = (etat: NotificationsLocales, n: NotificationSuivi): NotificationsLocales => ({
  ...etat,
  notifications: [n, ...etat.notifications.filter((m) => m.id !== n.id)].slice(0, NOMBRE_MAX_NOTIFICATIONS),
});

/** Une clé d'activité qui peut « publier » : un lieu ou un créateur */
const estClePage = (cle: string) => {
  const type = lireCleSuivi(cle)?.type;
  return type === "lieu" || type === "createur";
};

/**
 * Les notifications de l'app gardées sur le téléphone (démo et visite ; un compte connecté passe par
 * utiliserNotificationsCompte) : « … te suit », demande acceptée (ajoutées par les suivis entre personnes), et « a posté »
 * quand tu viens de suivre un lieu ou un créateur. Rien ne part sur le téléphone : tout s'affiche derrière la cloche.
 * Filtrées à la lecture : personne inconnue ou bloquée, publication masquée ou dont le lieu a disparu. Bloquer quelqu'un
 * efface aussi ses notifications du stockage (débloquer ne les rend pas). Pas de démo sans profil (visite sans compte), ni
 * après « Tout effacer » tant que le profil reste le même.
 */
export function utiliserNotificationsLocales(): EtatNotifications {
  const { profil } = utiliserProfil();
  const activite = utiliserActivite();
  const communaute = utiliserCommunaute();
  const [etat, setEtat] = useState<NotificationsLocales | null>(null);
  const [relu, setRelu] = useState(false);
  const minuteries = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Notifications arrivées avant que la démo de ce profil soit prête (le ménage des suivis, par exemple) : ajoutées dès qu'elle l'est
  const enAttente = useRef<NotificationSuivi[]>([]);
  // Les notifications du profil actuel (null : pas encore relues, ou d'un autre profil)
  const etatCourant = useRef<NotificationsLocales | null>(null);
  // Profil pour lequel « Tout effacer » a été demandé : rien n'est recréé pour lui
  const effacePour = useRef<string | null>(null);
  // Profil dont les suivis déjà présents ont été notés sans bruit (premier passage après la lecture)
  const suivisNotesPour = useRef<string | null>(null);

  const pourCeProfil = profil !== null && etat !== null && etat.profilCreeLe === profil.creeLe;
  const pret = relu && activite.chargee && communaute.pret && pourCeProfil;

  const { lieux: tousLesLieux } = utiliserLieux();
  const { publications: toutesLesPublications } = utiliserPublications();
  // Ce que la minuterie « a posté » revérifie au moment de se déclencher
  const courant = useRef({ suivis: activite.suivis, estMasquee: activite.estMasquee, tousLesLieux, toutesLesPublications, profilCreeLe: profil?.creeLe ?? null });
  useEffect(() => {
    courant.current = { suivis: activite.suivis, estMasquee: activite.estMasquee, tousLesLieux, toutesLesPublications, profilCreeLe: profil?.creeLe ?? null };
  });

  useEffect(() => {
    lireNotificationsLocales().then((lues) => {
      if (lues) setEtat(lues);
      setRelu(true);
    });
    const enCours = minuteries.current;
    return () => enCours.forEach(clearTimeout);
  }, []);

  // Démo de départ : rien de gardé, ou gardé pour un autre profil (jamais sans profil)
  useEffect(() => {
    if (!relu || !profil || pourCeProfil || effacePour.current === profil.creeLe) return;
    // Vidé sur place (pas remplacé) : le nettoyage du démontage garde le même tableau
    minuteries.current.splice(0).forEach(clearTimeout);
    suivisNotesPour.current = null;
    // Hors démo, aucune notification inventée : seulement celles qui arrivent vraiment
    const depart = DEMO_VISITES_ACTIVE ? creerNotificationsDemo(new Date()) : [];
    setEtat({ version: 1, profilCreeLe: profil.creeLe, notifications: depart, vuesLe: null, clesAnnoncees: [] });
  }, [relu, profil, pourCeProfil]);

  // Enregistrée à chaque changement ; les notifications en attente rejoignent la liste dès qu'elle existe pour ce profil
  useEffect(() => {
    etatCourant.current = pourCeProfil ? etat : null;
    if (!etat) return;
    if (pourCeProfil && enAttente.current.length > 0) {
      const enFile = enAttente.current;
      enAttente.current = [];
      setEtat((e) => (e ? enFile.reduce(avecNotification, e) : e));
      return;
    }
    enregistrerNotificationsLocales(etat).catch(() => {});
  }, [etat, pourCeProfil]);

  const ajouter = useCallback((nouvelle: NouvelleNotificationSuivi) => {
    const n = { ...nouvelle, id: creerIdentifiant("notification"), date: new Date().toISOString() } as NotificationSuivi;
    if (!etatCourant.current) {
      enAttente.current.push(n);
      return;
    }
    setEtat((e) => (e ? avecNotification(e, n) : e));
  }, []);

  // Démo « a posté » : chaque lieu ou créateur que tu te mets à suivre publie 6 s plus tard (une seule fois par clé).
  // Ceux déjà suivis à l'ouverture sont notés sans bruit. Hors démo, jamais : une vraie publication arrivera avec l'API.
  useEffect(() => {
    if (!DEMO_VISITES_ACTIVE || !pret || !etat) return;
    const nouvelles = activite.suivis.filter((cle) => estClePage(cle) && !etat.clesAnnoncees.includes(cle));
    const silence = suivisNotesPour.current !== etat.profilCreeLe;
    suivisNotesPour.current = etat.profilCreeLe;
    if (nouvelles.length === 0) return;
    setEtat((e) => (e ? { ...e, clesAnnoncees: [...e.clesAnnoncees, ...nouvelles.filter((c) => !e.clesAnnoncees.includes(c))] } : e));
    if (silence) return;
    const profilCreeLe = etat.profilCreeLe;
    for (const cle of nouvelles) {
      minuteries.current.push(
        setTimeout(() => {
          const { suivis, estMasquee, tousLesLieux, toutesLesPublications, profilCreeLe: profilActuel } = courant.current;
          // Plus suivi entre-temps, ou plus le même profil : rien
          if (profilActuel !== profilCreeLe || !suivis.includes(cle)) return;
          const publication = toutesLesPublications.find(
            (p) => calculerCleSuivi(p.auteur, p.lieuId) === cle && !estMasquee(p.id) && tousLesLieux.some((l) => l.id === p.lieuId),
          );
          if (publication) ajouter({ type: "nouvelle-publication", cle, publicationId: publication.id });
        }, DELAI_PUBLICATION_EXEMPLE),
      );
    }
  }, [pret, etat, activite.suivis, ajouter]);

  const marquerToutVu = useCallback(() => {
    setEtat((e) => (e ? { ...e, vuesLe: new Date().toISOString() } : e));
  }, []);

  const effacer = useCallback(async () => {
    // Vidé sur place (pas remplacé) : le nettoyage du démontage garde le même tableau
    minuteries.current.splice(0).forEach(clearTimeout);
    enAttente.current = [];
    effacePour.current = profil?.creeLe ?? null;
    setEtat(null);
    await effacerNotificationsLocales();
  }, [profil]);

  const { bloques, trouverPote } = communaute;
  const { estMasquee } = activite;

  // Bloquer efface pour de bon ses notifications (« … te suit en retour », demande acceptée) : débloquer ne les fait pas revenir,
  // pas plus que les liens (le filtre à la lecture, plus bas, reste en filet de sécurité)
  useEffect(() => {
    if (!pret || !etat || bloques.length === 0) return;
    const idsBloques = new Set(bloques.map((p) => p.id));
    const deBloque = (n: NotificationSuivi) => {
      const cible = lireCleSuivi(n.cle);
      return cible?.type === "personne" && idsBloques.has(cible.id);
    };
    if (!etat.notifications.some(deBloque)) return;
    setEtat((e) => (e ? { ...e, notifications: e.notifications.filter((n) => !deBloque(n)) } : e));
  }, [pret, etat, bloques]);

  const notifications = useMemo(() => {
    if (!pret || !etat) return [];
    const idsBloques = new Set(bloques.map((p) => p.id));
    return etat.notifications.filter((n) => {
      if (n.type === "nouvelle-publication") {
        const publication = toutesLesPublications.find((p) => p.id === n.publicationId);
        return (
          !!publication &&
          !estMasquee(publication.id) &&
          tousLesLieux.some((l) => l.id === publication.lieuId) &&
          calculerCleSuivi(publication.auteur, publication.lieuId) === n.cle
        );
      }
      // Une personne : connue et pas bloquée
      const cible = lireCleSuivi(n.cle);
      return cible?.type === "personne" && trouverPote(cible.id) !== null && !idsBloques.has(cible.id);
    });
  }, [pret, etat, bloques, trouverPote, estMasquee, tousLesLieux, toutesLesPublications]);

  const vuesLe = pret && etat ? etat.vuesLe : null;
  const valeur = useMemo<EtatNotifications>(
    () => ({
      pret,
      notifications,
      nonVues: notifications.filter((n) => vuesLe === null || n.date > vuesLe).length,
      vuesLe,
      ajouter,
      marquerToutVu,
      effacer,
    }),
    [pret, notifications, vuesLe, ajouter, marquerToutVu, effacer],
  );

  return valeur;
}
