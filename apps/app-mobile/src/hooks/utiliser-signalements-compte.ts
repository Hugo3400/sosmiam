import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { SignalementSocialEnvoye } from "@sos-miam/commun/client-api/contrat-signalements-sociaux";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { EtatCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserPoulsSocial } from "~/hooks/utiliser-pouls-social";
import { utiliserSession } from "~/hooks/utiliser-session";
import {
  effacerSignalementsSociauxAEnvoyer,
  lireSignalementsSociauxAEnvoyer,
  remplacerSignalementsSociauxAEnvoyer,
} from "~/stockage/signalements-sociaux-a-envoyer";

export type SignalementsCompte = Pick<EtatCommunaute, "signaler" | "estSignale">;

/** Des refus qui ne changeront pas en réessayant : le signalement est oublié (le contenu reste caché jusqu'au prochain lancement) */
const REFUS_DEFINITIFS: readonly ErreurService[] = ["signalement-invalide", "contenu-inconnu", "champ-invalide"];
/** Ce qui se cache pour toi une fois signalé, d'après le serveur (un profil, une sortie ou un groupe restent visibles) */
const CIBLES_CACHEES = ["commentaire", "message", "liste"] as const;

/**
 * Tes signalements de contenus sociaux quand un compte est connecté (POST /app/signalements) : le contenu disparaît tout de
 * suite de ton écran, puis le signalement part à la modération. Sans réseau, il attend sur le téléphone et repart à la
 * prochaine occasion (lancement, ou quand le pouls revient). Ce que tu as déjà signalé est relu sur le serveur
 * (GET /app/signalements/miens) pour rester caché d'un téléphone à l'autre. Inactif (démo, visite, attente) : rien.
 */
export function utiliserSignalementsCompte(actif: boolean): SignalementsCompte {
  const { sociaux, compte } = utiliserSession();
  const { pouls } = utiliserPoulsSocial();
  const [signales, setSignales] = useState<ReadonlySet<string>>(new Set());
  const [enAttente, setEnAttente] = useState<SignalementSocialEnvoye[]>([]);
  const generation = useRef(0);
  const etaitActif = useRef(false);
  const envoiEnCours = useRef(false);
  // Le compte relu (sa date de création désigne ce qu'on garde sur le téléphone) ; null : pas encore relu, rien n'est gardé
  // sur le disque, mais un signalement part quand même et attend en mémoire
  const creeLe = compte?.creeLe ?? null;
  const creeLeCourant = useRef(creeLe);
  creeLeCourant.current = creeLe;
  const enAttenteCourant = useRef(enAttente);
  enAttenteCourant.current = enAttente;

  const garder = useCallback((suivants: SignalementSocialEnvoye[]) => {
    enAttenteCourant.current = suivants;
    setEnAttente(suivants);
    if (creeLeCourant.current) void remplacerSignalementsSociauxAEnvoyer(creeLeCourant.current, suivants);
  }, []);

  /** Envoie ceux qui attendent ; garde seulement ceux qui ont raté pour une raison passagère (réseau, serveur) */
  const vider = useCallback(async () => {
    const lot = enAttenteCourant.current;
    if (envoiEnCours.current || lot.length === 0) return;
    envoiEnCours.current = true;
    const g = generation.current;
    const restants: SignalementSocialEnvoye[] = [];
    for (const s of lot) {
      const r = await sociaux.signalements.signaler(s).catch(() => ({ ok: false as const, erreur: "hors-ligne" as ErreurService }));
      if (!r.ok && !REFUS_DEFINITIFS.includes(r.erreur)) restants.push(s);
    }
    envoiEnCours.current = false;
    if (g !== generation.current) return;
    // Ceux arrivés pendant l'envoi attendent encore
    garder([...restants, ...enAttenteCourant.current.filter((s) => !lot.includes(s))]);
  }, [sociaux, garder]);

  // Connexion : ce que tu as signalé est relu sur le serveur ; déconnexion : tout est oublié (et ce qui attendait aussi)
  useEffect(() => {
    generation.current += 1;
    if (!actif) {
      if (etaitActif.current) void effacerSignalementsSociauxAEnvoyer();
      etaitActif.current = false;
      setSignales(new Set());
      enAttenteCourant.current = [];
      setEnAttente([]);
      return;
    }
    etaitActif.current = true;
    const g = generation.current;
    void Promise.all(CIBLES_CACHEES.map((cible) => sociaux.signalements.listerMiens(cible).catch(() => null))).then((lus) => {
      if (g !== generation.current) return;
      setSignales((avant) => new Set([...avant, ...lus.flatMap((r) => (r?.ok ? r.cibleIds : []))]));
    });
  }, [actif, sociaux]);

  // Le compte est relu : ce qui attendait sur le téléphone rejoint ce qui attend en mémoire, puis tout repart
  useEffect(() => {
    if (!actif || !creeLe) return;
    let encore = true;
    void lireSignalementsSociauxAEnvoyer(creeLe).then((gardes) => {
      if (!encore) return;
      const memoire = enAttenteCourant.current;
      const tous = [...gardes, ...memoire].filter((s, i, liste) => liste.findIndex((x) => x.cible === s.cible && x.cibleId === s.cibleId) === i);
      setSignales((avant) => new Set([...avant, ...tous.map((s) => s.cibleId)]));
      garder(tous);
      void vider();
    });
    return () => {
      encore = false;
    };
  }, [actif, creeLe, garder, vider]);

  // Le pouls répond : le réseau est revenu, ce qui attendait repart
  const signature = pouls ? `${pouls.messages.signature}|${pouls.cloche.signature}` : null;
  useEffect(() => {
    if (actif && signature !== null && enAttenteCourant.current.length > 0) void vider();
  }, [actif, signature, vider]);

  return useMemo((): SignalementsCompte => {
    const enAttenteIds = new Set(enAttente.map((s) => s.cibleId));
    return {
      signaler: (s) => {
        if (!actif) return;
        // Un lieu envoyé par un pote est un message pour le serveur
        const envoye: SignalementSocialEnvoye = { cible: s.cible === "recommandation" ? "message" : s.cible, cibleId: s.cibleId, raison: s.raison, precision: s.precision, explication: s.explication };
        setSignales((avant) => new Set(avant).add(s.cibleId));
        const g = generation.current;
        void sociaux.signalements
          .signaler(envoye)
          .catch(() => ({ ok: false as const, erreur: "hors-ligne" as ErreurService }))
          .then((r) => {
            if (g !== generation.current || r.ok || REFUS_DEFINITIFS.includes(r.erreur)) return;
            // Pas parti : il attend (sur le téléphone dès que le compte est relu), le contenu reste caché
            garder([...enAttenteCourant.current.filter((x) => !(x.cible === envoye.cible && x.cibleId === envoye.cibleId)), envoye]);
          });
      },
      estSignale: (cibleId) => signales.has(cibleId) || enAttenteIds.has(cibleId),
    };
  }, [actif, sociaux, signales, enAttente, garder]);
}
