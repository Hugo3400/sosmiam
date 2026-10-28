import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LONGUEUR_MAX_MOT_RECOMMANDATION } from "@sos-miam/commun/regles/potes";
import type { LieuEnvoyeApi } from "@sos-miam/commun/types/messagerie";
import type { Pote } from "@sos-miam/commun/types/potes";
import type { CibleMasque, PersonneResume } from "@sos-miam/commun/types/social";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { convertirLieuEnvoyeApi } from "~/fonctions/communaute/convertir-lieu-envoye-api";
import type { EtatCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserPoulsSocial } from "~/hooks/utiliser-pouls-social";
import { utiliserSession } from "~/hooks/utiliser-session";

export type LieuxEnvoyesCompte = Pick<
  EtatCommunaute,
  "recommandationsRecues" | "recommandationsEnvoyees" | "envoyerLieu" | "marquerRecommandationVue" | "retirerRecommandations" | "remettreRecommandations"
>;

type Dependances = {
  monId: string;
  noterPersonne: (personne: PersonneResume) => void;
  bloques: readonly Pote[];
  estMasque: (cible: CibleMasque, id: string) => boolean;
  masquer: (cible: CibleMasque, id: string) => void;
  demasquer: (cible: CibleMasque, id: string) => void;
};

/**
 * Les lieux envoyés entre potes quand un compte est connecté (« Envoyer à un pote ») : chaque envoi est un message « lieu »
 * dans votre discussion privée (/app/lieux-envoyes). Reçus et envoyés : la première page (30), relue quand le pouls dit que
 * les messages ont bougé. Un envoi s'affiche tout de suite ; « vu » et « retirer de ta vue » aussi (ton pote n'en sait rien).
 * Inactif (visite, attente) : rien n'est lu.
 */
export function utiliserLieuxEnvoyesCompte(actif: boolean, { monId, noterPersonne, bloques, estMasque, masquer, demasquer }: Dependances): LieuxEnvoyesCompte {
  const { sociaux } = utiliserSession();
  const { pouls } = utiliserPoulsSocial();
  const [recus, setRecus] = useState<LieuEnvoyeApi[]>([]);
  const [envoyes, setEnvoyes] = useState<LieuEnvoyeApi[]>([]);
  const generation = useRef(0);
  const tant = useCallback((g: number) => g === generation.current, []);

  const charger = useCallback(async () => {
    const g = generation.current;
    const [r, e] = await Promise.all([sociaux.messagerie.listerLieuxRecus(), sociaux.messagerie.listerLieuxEnvoyes()]);
    if (!tant(g)) return;
    [...(r.ok ? r.lieux : []), ...(e.ok ? e.lieux : [])].forEach((l) => [l.de, l.a].forEach((p) => p && noterPersonne(p)));
    if (r.ok) setRecus(r.lieux);
    // Un envoi encore en route (pas encore dans la page lue) reste affiché
    if (e.ok) setEnvoyes((avant) => [...avant.filter((l) => l.id.startsWith("envoi:") && !e.lieux.some((x) => x.conversationId === l.conversationId && x.lieuId === l.lieuId)), ...e.lieux]);
  }, [sociaux, tant, noterPersonne]);

  // Connexion : tout est lu une fois ; déconnexion : tout est oublié
  useEffect(() => {
    generation.current += 1;
    if (!actif) {
      setRecus([]);
      setEnvoyes([]);
      return;
    }
    void charger();
  }, [actif, charger]);

  // Le pouls dit que les messages ont bougé (un lieu envoyé en est un) : on relit
  const signature = pouls?.messages.signature ?? null;
  const derniere = useRef<string | null>(null);
  useEffect(() => {
    if (!actif || signature === null) return;
    if (derniere.current !== null && derniere.current !== signature) void charger();
    derniere.current = signature;
  }, [actif, signature, charger]);

  return useMemo((): LieuxEnvoyesCompte => {
    const idsBloques = new Set(bloques.map((p) => p.id));
    const recommandationsRecues = recus
      .filter((l) => !estMasque("lieu-recu", l.id) && !(l.de && idsBloques.has(l.de.id)))
      .map(convertirLieuEnvoyeApi)
      .sort((a, b) => b.date.localeCompare(a.date));

    return {
      recommandationsRecues,
      recommandationsEnvoyees: envoyes.map(convertirLieuEnvoyeApi).sort((a, b) => b.date.localeCompare(a.date)),
      envoyerLieu: (lieuId, potes, mot, surRefus) => {
        const propre = mot?.trim() ?? "";
        if (propre.length > LONGUEUR_MAX_MOT_RECOMMANDATION) return "trop-long";
        if (propre && contientMotInterdit(propre)) return "mot-interdit";
        const a = [...new Set(potes)].filter((id) => !idsBloques.has(id));
        if (a.length === 0) return "ok";
        const idClient = Crypto.randomUUID();
        const date = new Date().toISOString();
        // Tout de suite dans « Envoyés » ; le serveur rend ensuite les vrais messages (même idClient : un nouvel essai ne double rien)
        const enRoute: LieuEnvoyeApi[] = a.map((id) => ({ id: `envoi:${idClient}:${id}`, conversationId: "", de: null, a: { id, pseudo: "", prenom: "", avatar: null }, lieuId, mot: propre || null, date, vu: false }));
        setEnvoyes((avant) => [...enRoute, ...avant]);
        const g = generation.current;
        void sociaux.messagerie.envoyerLieuAPotes(idClient, lieuId, a, propre || null).then((r) => {
          if (!tant(g)) return;
          setEnvoyes((avant) => [...(r.ok ? r.envoyes : []), ...avant.filter((l) => !l.id.startsWith(`envoi:${idClient}:`))]);
          if (r.ok) return;
          // Refusé (compte limité, réseau…) : l'envoi quitte « Envoyés », et l'écran qui a dit « C'est envoyé ! » se corrige
          void charger();
          surRefus?.(r.erreur);
        });
        return "ok";
      },
      marquerRecommandationVue: (id) => {
        const vue = recus.find((l) => l.id === id);
        if (!vue || vue.vu) return;
        // « Vu » vaut pour celui-ci et tous ceux d'avant (le serveur ne recule jamais)
        setRecus((avant) => avant.map((l) => (l.date <= vue.date ? { ...l, vu: true } : l)));
        void sociaux.messagerie.marquerLieuxVus(id);
      },
      // Seulement les lieux qu'on t'a envoyés : ton pote n'en sait rien (ce qu'il t'a envoyé reste dans ses envois)
      retirerRecommandations: (ids) => {
        const retirees = recommandationsRecues.filter((r) => ids.includes(r.id) && r.a === monId);
        retirees.forEach((r) => masquer("lieu-recu", r.id));
        return retirees;
      },
      remettreRecommandations: (recommandations) => recommandations.forEach((r) => demasquer("lieu-recu", r.id)),
    };
  }, [recus, envoyes, bloques, estMasque, masquer, demasquer, monId, sociaux, tant, charger]);
}
