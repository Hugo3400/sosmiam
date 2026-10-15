import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { peutOrganiserPourPublic } from "@sos-miam/commun/fonctions/sorties-miamis/peut-organiser-pour-public";
import { peutVoirSortieMiamis } from "@sos-miam/commun/fonctions/sorties-miamis/peut-voir-sortie-miamis";
import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import type { MessageSortie } from "@sos-miam/commun/types/potes";
import type { EvenementMiamis } from "@sos-miam/commun/types/qui-est-la";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import type { NouvelleSortieMiamis, ParticipantSortieMiamis, ProfilVisibiliteMiamis, SortieMiamis } from "@sos-miam/commun/types/sorties-miamis";
import { nettoyerTexteSocial } from "@sos-miam/commun/validation/nettoyer-texte-social";
import { validerNouvelleSortieMiamis } from "@sos-miam/commun/validation/valider-nouvelle-sortie-miamis";
import { verifierTexteSocial } from "@sos-miam/commun/validation/verifier-texte-social";
import { creerMessagesSortiesMiamisExemples, MOTS_ACCUEIL_ORGANISATION, MOTS_REPONSE_MIAMIS } from "~/contenus/miamis/messages-sorties-miamis-exemples";
import { MIAMIS_EXEMPLES } from "~/contenus/miamis/personnes-miamis-exemples";
import { creerSortiesMiamisExemples } from "~/contenus/miamis/sorties-miamis-exemples";
import { creerIdentifiant } from "~/fonctions/communaute/creer-identifiant";
import { accepterDemandeArrivee } from "~/fonctions/miamis/accepter-demande-arrivee";
import { faireEntrerMoi } from "~/fonctions/miamis/faire-entrer-moi";
import { fairePartirMoi } from "~/fonctions/miamis/faire-partir-moi";
import type { EtatSortiesMiamis } from "~/hooks/utiliser-miamis";
import { utiliserLieux } from "~/hooks/utiliser-lieux";

type Options = {
  moi: PersonneResume;
  profil: ProfilVisibiliteMiamis;
  ajouterAuFil: (evenement: Omit<EvenementMiamis, "id" | "date">) => void;
};

const DELAI_REPONSE_ORGANISATION_MS = 4000;
const DELAI_PREMIERE_DEMANDE_MS = 6000;
const DELAI_REPONSE_MESSAGE_MS = 3000;
const DUREE_SORTIE_MS = 4 * 3_600_000;
const REMPLACANTS: readonly PersonneResume[] = [MIAMIS_EXEMPLES.mila, MIAMIS_EXEMPLES.lou, MIAMIS_EXEMPLES.noe, MIAMIS_EXEMPLES.jo];

const participantDe = (personne: PersonneResume, nouveau: boolean): ParticipantSortieMiamis => ({ personne, habitue: false, dansTaBande: false, nouveau, present: false });

export function utiliserSortiesMiamisDemo({ moi, profil, ajouterAuFil }: Options): EtatSortiesMiamis {
  const { trouverLieu } = utiliserLieux();
  const [sorties, setSorties] = useState<SortieMiamis[]>(() => creerSortiesMiamisExemples(new Date(), moi));
  const [messages, setMessages] = useState<Record<string, MessageSortie[]>>(() => creerMessagesSortiesMiamisExemples(new Date()));
  const dernieres = useRef(sorties);
  const minuteries = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    dernieres.current = sorties;
  }, [sorties]);

  useEffect(() => {
    const enCours = minuteries.current;
    return () => enCours.forEach(clearTimeout);
  }, []);

  const plusTard = useCallback((faire: () => void, delai: number) => {
    const minuterie = setTimeout(() => {
      minuteries.current.delete(minuterie);
      faire();
    }, delai);
    minuteries.current.add(minuterie);
  }, []);

  const modifier = useCallback((id: string, changer: (s: SortieMiamis) => SortieMiamis) => setSorties((liste) => liste.map((s) => (s.id === id ? changer(s) : s))), []);

  const ajouterMessage = useCallback((sortieId: string, auteur: string, texte: string) => {
    const message: MessageSortie = { id: creerIdentifiant("message"), auteur, texte, date: new Date().toISOString() };
    setMessages((tous) => ({ ...tous, [sortieId]: [...(tous[sortieId] ?? []), message] }));
  }, []);

  const visibles = useMemo(() => {
    const limite = Date.now() - DUREE_SORTIE_MS;
    return sorties
      .filter((s) => Date.parse(s.quand) > limite && (s.moi.place !== "aucune" || peutVoirSortieMiamis(s.public, profil)))
      .sort((a, b) => Date.parse(a.quand) - Date.parse(b.quand));
  }, [sorties, profil]);

  const trouverSortie = useCallback((id: string) => visibles.find((s) => s.id === id) ?? null, [visibles]);

  const demanderAVenir = useCallback(
    async (id: string) => {
      modifier(id, (s) => (s.moi.place === "aucune" ? { ...s, moi: { ...s.moi, place: "demande" } } : s));
      plusTard(() => {
        const sortie = dernieres.current.find((s) => s.id === id);
        if (!sortie || sortie.moi.place !== "demande") return;
        const apres = faireEntrerMoi(sortie, participantDe(moi, profil.nouveau));
        modifier(id, () => apres);
        if (apres.moi.place === "accepte") {
          ajouterMessage(id, sortie.organisateur.id, MOTS_ACCUEIL_ORGANISATION);
          ajouterAuFil({ auteur: moi, type: "sortie-rejointe", titre: sortie.titre, nombre: 1 });
        }
      }, DELAI_REPONSE_ORGANISATION_MS);
      return null;
    },
    [modifier, plusTard, moi, profil.nouveau, ajouterMessage, ajouterAuFil],
  );

  const annulerDemande = useCallback(
    async (id: string) => {
      modifier(id, (s) => (s.moi.place === "demande" ? { ...s, moi: { ...s.moi, place: "aucune" } } : s));
      return null;
    },
    [modifier],
  );

  const nePlusVenir = useCallback(
    async (id: string) => {
      modifier(id, (s) => {
        const presents = new Set(s.participants.map((p) => p.personne.id));
        const remplacant = REMPLACANTS.find((p) => !presents.has(p.id));
        return fairePartirMoi(s, moi.id, remplacant ? participantDe(remplacant, false) : null);
      });
      return null;
    },
    [modifier, moi.id],
  );

  const accepterArrivee = useCallback(
    async (sortieId: string, personneId: string) => {
      modifier(sortieId, (s) => accepterDemandeArrivee(s, personneId));
      return null;
    },
    [modifier],
  );

  const refuserArrivee = useCallback(
    async (sortieId: string, personneId: string) => {
      modifier(sortieId, (s) => ({ ...s, demandes: s.demandes.filter((d) => d.personne.id !== personneId) }));
      return null;
    },
    [modifier],
  );

  const validerPresence = useCallback(
    async (id: string) => {
      modifier(id, (s) => ({
        ...s,
        participants: s.participants.map((p) => (p.personne.id === moi.id ? { ...p, present: true } : p)),
        moi: { ...s.moi, present: true },
      }));
      return null;
    },
    [modifier, moi.id],
  );

  const annulerSortie = useCallback(async (id: string) => {
    setSorties((liste) => liste.filter((s) => s.id !== id || s.moi.place !== "organisateur"));
    return null;
  }, []);

  const creerSortie = useCallback(
    async (nouvelle: NouvelleSortieMiamis) => {
      const lue = validerNouvelleSortieMiamis(nouvelle, new Date());
      if (!lue.ok) return { erreur: lue.champ, ...(lue.raison ? { raison: lue.raison } : {}) };
      const lieu = trouverLieu(lue.sortie.lieuId);
      if (!lieu) return { erreur: "lieuId" as const };
      if (!peutOrganiserPourPublic(lue.sortie.public, profil)) return { erreur: "public" as const };
      const id = creerIdentifiant("miamis");
      const sortie: SortieMiamis = {
        ...lue.sortie,
        id,
        lieu: { id: lieu.id, nom: lieu.nom, emoji: lieu.emoji, type: lieu.type, ville: lieu.ville },
        organisateur: moi,
        sortiesTenuesOrganisateur: { tenues: 0, prevues: 0 },
        rescoussesOrganisateur: 0,
        habitues: 0,
        participants: [participantDe(moi, profil.nouveau)],
        nombreEnAttente: 0,
        listeAttente: [],
        demandes: [],
        conversationId: id,
        moi: { place: "organisateur", rangAttente: null, present: false },
      };
      setSorties((liste) => [...liste, sortie]);
      ajouterAuFil({ auteur: moi, type: "sortie-organisee", titre: sortie.titre, nombre: 1 });
      plusTard(() => {
        const demande = { personne: MIAMIS_EXEMPLES.mila, date: new Date().toISOString(), nouveau: false, sortiesTenues: { tenues: 2, prevues: 2 } };
        modifier(id, (s) => ({ ...s, demandes: [...s.demandes, demande] }));
      }, DELAI_PREMIERE_DEMANDE_MS);
      return { id };
    },
    [trouverLieu, profil, moi, ajouterAuFil, plusTard, modifier],
  );

  const messagesDe = useCallback((id: string) => messages[id] ?? [], [messages]);

  const envoyerMessage = useCallback(
    (id: string, texte: string) => {
      const sortie = dernieres.current.find((s) => s.id === id);
      if (!sortie || (sortie.moi.place !== "accepte" && sortie.moi.place !== "organisateur")) return "interdit" as const;
      const verification = verifierTexteSocial(texte, LONGUEUR_MAX_MESSAGE);
      if (verification !== "ok") return verification;
      ajouterMessage(id, moi.id, nettoyerTexteSocial(texte));
      const autre = sortie.participants.find((p) => p.personne.id !== moi.id);
      if (autre) {
        const reponse = MOTS_REPONSE_MIAMIS[Math.floor(Math.random() * MOTS_REPONSE_MIAMIS.length)];
        plusTard(() => ajouterMessage(id, autre.personne.id, reponse), DELAI_REPONSE_MESSAGE_MS);
      }
      return "ok" as const;
    },
    [ajouterMessage, moi.id, plusTard],
  );

  return useMemo(
    () => ({
      sorties: visibles,
      trouverSortie,
      creerSortie,
      demanderAVenir,
      annulerDemande,
      nePlusVenir,
      accepterArrivee,
      refuserArrivee,
      validerPresence,
      annulerSortie,
      messagesDe,
      envoyerMessage,
    }),
    [visibles, trouverSortie, creerSortie, demanderAVenir, annulerDemande, nePlusVenir, accepterArrivee, refuserArrivee, validerPresence, annulerSortie, messagesDe, envoyerMessage],
  );
}
