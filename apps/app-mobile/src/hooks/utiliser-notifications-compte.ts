import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { NotificationClocheApi } from "@sos-miam/commun/types/cloche";
import { calculerNouvellesPublications } from "~/fonctions/notifications/calculer-nouvelles-publications";
import { convertirNotificationCloche } from "~/fonctions/notifications/convertir-notification-cloche";
import { retirerNotificationsEffacees } from "~/fonctions/notifications/retirer-notifications-effacees";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import type { EtatNotifications, NotificationApp, ResultatEffacementCloche } from "~/hooks/utiliser-notifications";
import { utiliserPoulsSocial } from "~/hooks/utiliser-pouls-social";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserSession } from "~/hooks/utiliser-session";
import {
  CLOCHE_EFFACEE_VIDE,
  effacerClocheEffacee,
  enregistrerClocheEffacee,
  lireClocheEffacee,
  NOMBRE_MAX_EFFACEES,
  type ClocheEffacee,
} from "~/stockage/cloche-effacee-compte";
import { effacerClocheVue, enregistrerClocheVue, lireClocheVue } from "~/stockage/cloche-vue-compte";
import { effacerNotificationsLocales } from "~/stockage/notifications-locales";

const rienAFaire = () => {};
const PREFIXE_CLOCHE = "cloche:";
const pasPret = async (): Promise<ResultatEffacementCloche> => ({ ok: false, erreur: "connexion-requise" });
/** La plus récente de deux dates ISO (null : aucune) */
const plusRecente = (a: string | null, b: string | null) => (a === null ? b : b === null ? a : a > b ? a : b);

/**
 * La cloche quand un compte est connecté : GET /app/cloche (30 dernières, sans les personnes bloquées), relue quand la
 * signature du pouls change, plus les « a posté » des lieux et créateurs suivis, calculés sur le fil du téléphone. « Vu »
 * part au serveur (le même sur tous tes téléphones) et reste aussi sur celui-ci : sans profil social, le serveur ne le garde
 * pas. La communauté connaît ensuite les personnes qui agissent. Inactif (démo, visite, attente) : rien n'est lu.
 */
export function utiliserNotificationsCompte(actif: boolean): EtatNotifications {
  const { sociaux, compte } = utiliserSession();
  const { pouls } = utiliserPoulsSocial();
  const { noterPersonne, bloques, pret: communautePrete } = utiliserCommunaute();
  const activite = utiliserActivite();
  const { lieux } = utiliserLieux();
  const { publications } = utiliserPublications();
  const [brutes, setBrutes] = useState<NotificationClocheApi[]>([]);
  const [vuesServeur, setVuesServeur] = useState<string | null>(null);
  const [vuesTelephone, setVuesTelephone] = useState<string | null>(null);
  const [lu, setLu] = useState(false);
  const [effaceesLocales, setEffaceesLocales] = useState<ClocheEffacee>(CLOCHE_EFFACEE_VIDE);
  const [enCours, setEnCours] = useState<ClocheEffacee>(CLOCHE_EFFACEE_VIDE);
  const effaceesLocalesActuelles = useRef<ClocheEffacee>(CLOCHE_EFFACEE_VIDE);
  const effaceesServeur = useRef(new Set<string>());
  const derniereLecture = useRef(0);
  const lecturesPerimees = useRef(0);
  const affichees = useRef<NotificationApp[]>([]);
  // Une réponse arrivée après une déconnexion ne touche à rien
  const generation = useRef(0);
  const etaitActif = useRef(false);
  const creeLe = compte?.creeLe ?? null;
  const tant = useCallback((g: number) => g === generation.current, []);

  const charger = useCallback(async () => {
    const g = generation.current;
    const lecture = ++derniereLecture.current;
    const r = await sociaux.cloche.lister().catch(() => null);
    if (!tant(g) || !r?.ok || lecture <= lecturesPerimees.current) return;
    r.cloche.notifications.forEach((n) => {
      if (n.acteur) noterPersonne(n.acteur);
    });
    setBrutes(r.cloche.notifications.filter((n) => !effaceesServeur.current.has(n.id)));
    setVuesServeur(r.cloche.vuesLe);
  }, [sociaux, tant, noterPersonne]);

  const garderEffaceesLocales = useCallback(
    (suivantes: ClocheEffacee) => {
      effaceesLocalesActuelles.current = suivantes;
      setEffaceesLocales(suivantes);
      if (creeLe) void enregistrerClocheEffacee(creeLe, suivantes);
    },
    [creeLe],
  );

  // Connexion : la cloche est lue une fois ; déconnexion : tout est oublié, le « vu » du téléphone aussi
  useEffect(() => {
    generation.current += 1;
    if (!actif) {
      if (etaitActif.current) {
        void effacerClocheVue();
        void effacerClocheEffacee();
      }
      etaitActif.current = false;
      effaceesServeur.current.clear();
      effaceesLocalesActuelles.current = CLOCHE_EFFACEE_VIDE;
      setBrutes([]);
      setVuesServeur(null);
      setVuesTelephone(null);
      setEffaceesLocales(CLOCHE_EFFACEE_VIDE);
      setEnCours(CLOCHE_EFFACEE_VIDE);
      setLu(false);
      return;
    }
    etaitActif.current = true;
    const g = generation.current;
    void charger().finally(() => {
      if (tant(g)) setLu(true);
    });
  }, [actif, charger, tant]);

  useEffect(() => {
    if (!actif || !creeLe) return;
    const g = generation.current;
    void lireClocheVue(creeLe).then((vues) => {
      if (tant(g)) setVuesTelephone((avant) => plusRecente(avant, vues));
    });
    void lireClocheEffacee(creeLe).then((lues) => {
      if (!tant(g)) return;
      const avant = effaceesLocalesActuelles.current;
      const suivantes = { ids: [...new Set([...lues.ids, ...avant.ids])].slice(-NOMBRE_MAX_EFFACEES), jusqua: plusRecente(lues.jusqua, avant.jusqua) };
      effaceesLocalesActuelles.current = suivantes;
      setEffaceesLocales(suivantes);
    });
  }, [actif, creeLe, tant]);

  // Le pouls dit que la cloche a bougé : on relit
  const signature = pouls?.cloche.signature ?? null;
  const derniereSignature = useRef<string | null>(null);
  useEffect(() => {
    if (!actif || signature === null) return;
    if (derniereSignature.current !== null && derniereSignature.current !== signature) void charger();
    derniereSignature.current = signature;
  }, [actif, signature, charger]);

  const marquerToutVu = useCallback(() => {
    if (!actif) return;
    const g = generation.current;
    const maintenant = new Date().toISOString();
    // La pastille s'éteint tout de suite ; la date du serveur (bornée à son heure) remplace ensuite celle du téléphone
    setVuesTelephone(maintenant);
    void sociaux.cloche
      .marquerVu()
      .catch(() => null)
      .then((r) => {
        if (!tant(g)) return;
        const vues = r?.ok ? r.vuesLe : maintenant;
        if (r?.ok) setVuesServeur((avant) => plusRecente(avant, r.vuesLe));
        setVuesTelephone(vues);
        if (creeLe) void enregistrerClocheVue(creeLe, vues);
      });
  }, [actif, sociaux, tant, creeLe]);

  // La cloche reste sur le serveur : seul ce que garde ce téléphone part
  const effacer = useCallback(async () => {
    setVuesTelephone(null);
    effaceesLocalesActuelles.current = CLOCHE_EFFACEE_VIDE;
    setEffaceesLocales(CLOCHE_EFFACEE_VIDE);
    await effacerClocheVue();
    await effacerClocheEffacee();
    await effacerNotificationsLocales();
  }, []);

  const effacerNotification = useCallback(
    async (id: string): Promise<ResultatEffacementCloche> => {
      if (!id.startsWith(PREFIXE_CLOCHE)) {
        const avant = effaceesLocalesActuelles.current;
        garderEffaceesLocales({ ...avant, ids: [...avant.ids.filter((x) => x !== id), id].slice(-NOMBRE_MAX_EFFACEES) });
        return { ok: true, effacees: 1 };
      }
      const g = generation.current;
      const idServeur = id.slice(PREFIXE_CLOCHE.length);
      setEnCours((e) => ({ ...e, ids: [...e.ids, id] }));
      const r = await sociaux.cloche.effacer(idServeur).catch(() => null);
      if (!tant(g)) return { ok: false, erreur: "connexion-requise" };
      const reussi = r !== null && (r.ok || r.erreur === "notification-inconnue");
      if (reussi) {
        effaceesServeur.current.add(idServeur);
        setBrutes((b) => b.filter((n) => n.id !== idServeur));
      }
      setEnCours((e) => ({ ...e, ids: e.ids.filter((x) => x !== id) }));
      if (reussi) return { ok: true, effacees: 1 };
      return { ok: false, erreur: r && !r.ok ? r.erreur : "hors-ligne" };
    },
    [sociaux, tant, garderEffaceesLocales],
  );

  const effacerLues = useCallback(
    async (jusqua: string): Promise<ResultatEffacementCloche> => {
      const g = generation.current;
      const locales = affichees.current.filter((n) => !n.id.startsWith(PREFIXE_CLOCHE) && n.date <= jusqua).length;
      setEnCours((e) => ({ ...e, jusqua: plusRecente(e.jusqua, jusqua) }));
      const r = await sociaux.cloche.effacerLues(jusqua).catch(() => null);
      if (!tant(g)) return { ok: false, erreur: "connexion-requise" };
      if (!r?.ok) {
        setEnCours((e) => ({ ...e, jusqua: null }));
        return { ok: false, erreur: r ? r.erreur : "hors-ligne" };
      }
      const avant = effaceesLocalesActuelles.current;
      garderEffaceesLocales({ ...avant, jusqua: plusRecente(avant.jusqua, jusqua) });
      setBrutes((b) => b.filter((n) => n.date > jusqua));
      setEnCours((e) => ({ ...e, jusqua: null }));
      lecturesPerimees.current = derniereLecture.current;
      void charger();
      return { ok: true, effacees: r.effacees + locales };
    },
    [sociaux, tant, garderEffaceesLocales, charger],
  );

  const { suivis, estMasquee } = activite;
  const valeur = useMemo((): EtatNotifications => {
    const pret = actif && lu && communautePrete && activite.chargee;
    if (!pret) return { pret: false, notifications: [], nonVues: 0, vuesLe: null, ajouter: rienAFaire, marquerToutVu, effacer, effacerNotification: pasPret, effacerLues: pasPret };
    const idsBloques = new Set(bloques.map((p) => p.id));
    const deLaCloche = brutes
      .filter((n) => !n.acteur || !idsBloques.has(n.acteur.id))
      .map(convertirNotificationCloche)
      .filter((n): n is NotificationApp => n !== null);
    const nouveautes = retirerNotificationsEffacees(calculerNouvellesPublications({ suivis, publications, lieux, estMasquee, maintenant: new Date() }), effaceesLocales);
    const toutes = [...deLaCloche, ...nouveautes].sort((a, b) => b.date.localeCompare(a.date));
    const notifications = retirerNotificationsEffacees(toutes, enCours);
    // Sans profil social, le serveur rend vuesLe: null : le téléphone garde le sien
    const vuesLe = plusRecente(vuesServeur, vuesTelephone);
    return {
      pret,
      notifications,
      nonVues: notifications.filter((n) => vuesLe === null || n.date > vuesLe).length,
      vuesLe,
      ajouter: rienAFaire,
      marquerToutVu,
      effacer,
      effacerNotification,
      effacerLues,
    };
  }, [
    actif,
    lu,
    communautePrete,
    activite.chargee,
    bloques,
    brutes,
    suivis,
    publications,
    lieux,
    estMasquee,
    vuesServeur,
    vuesTelephone,
    effaceesLocales,
    enCours,
    marquerToutVu,
    effacer,
    effacerNotification,
    effacerLues,
  ]);

  useEffect(() => {
    affichees.current = valeur.notifications;
  }, [valeur.notifications]);

  return valeur;
}
