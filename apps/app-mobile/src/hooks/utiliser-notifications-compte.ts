import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { NotificationClocheApi } from "@sos-miam/commun/types/cloche";
import { calculerNouvellesPublications } from "~/fonctions/notifications/calculer-nouvelles-publications";
import { convertirNotificationCloche } from "~/fonctions/notifications/convertir-notification-cloche";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import type { EtatNotifications, NotificationApp } from "~/hooks/utiliser-notifications";
import { utiliserPoulsSocial } from "~/hooks/utiliser-pouls-social";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserSession } from "~/hooks/utiliser-session";
import { effacerClocheVue, enregistrerClocheVue, lireClocheVue } from "~/stockage/cloche-vue-compte";
import { effacerNotificationsLocales } from "~/stockage/notifications-locales";

const rienAFaire = () => {};
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
  // Une réponse arrivée après une déconnexion ne touche à rien
  const generation = useRef(0);
  const etaitActif = useRef(false);
  const creeLe = compte?.creeLe ?? null;
  const tant = useCallback((g: number) => g === generation.current, []);

  const charger = useCallback(async () => {
    const g = generation.current;
    const r = await sociaux.cloche.lister().catch(() => null);
    if (!tant(g) || !r?.ok) return;
    r.cloche.notifications.forEach((n) => {
      if (n.acteur) noterPersonne(n.acteur);
    });
    setBrutes(r.cloche.notifications);
    setVuesServeur(r.cloche.vuesLe);
  }, [sociaux, tant, noterPersonne]);

  // Connexion : la cloche est lue une fois ; déconnexion : tout est oublié, le « vu » du téléphone aussi
  useEffect(() => {
    generation.current += 1;
    if (!actif) {
      if (etaitActif.current) void effacerClocheVue();
      etaitActif.current = false;
      setBrutes([]);
      setVuesServeur(null);
      setVuesTelephone(null);
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

  // La cloche reste sur le serveur : seuls le « vu » de ce téléphone et ce qu'il gardait d'avant (démo, visite) partent
  const effacer = useCallback(async () => {
    setVuesTelephone(null);
    await effacerClocheVue();
    await effacerNotificationsLocales();
  }, []);

  const { suivis, estMasquee } = activite;
  return useMemo((): EtatNotifications => {
    const pret = actif && lu && communautePrete && activite.chargee;
    if (!pret) return { pret: false, notifications: [], nonVues: 0, vuesLe: null, ajouter: rienAFaire, marquerToutVu, effacer };
    const idsBloques = new Set(bloques.map((p) => p.id));
    const deLaCloche = brutes
      .filter((n) => !n.acteur || !idsBloques.has(n.acteur.id))
      .map(convertirNotificationCloche)
      .filter((n): n is NotificationApp => n !== null);
    const nouveautes = calculerNouvellesPublications({ suivis, publications, lieux, estMasquee, maintenant: new Date() });
    const notifications = [...deLaCloche, ...nouveautes].sort((a, b) => b.date.localeCompare(a.date));
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
    };
  }, [actif, lu, communautePrete, activite.chargee, bloques, brutes, suivis, publications, lieux, estMasquee, vuesServeur, vuesTelephone, marquerToutVu, effacer]);
}
