import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MoyenInvitation } from "@sos-miam/commun/client-api/contrat-bande";
import type { MasqueSocial } from "@sos-miam/commun/client-api/contrat-social";
import type { ActiviteBandeApi, BandeApi, ClassementApi } from "@sos-miam/commun/types/bande";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { ActivitePote, Pote } from "@sos-miam/commun/types/potes";
import type { CibleMasque, MoiSocial, PersonneResume } from "@sos-miam/commun/types/social";
import { convertirActiviteBande } from "~/fonctions/communaute/convertir-activite-bande";
import { convertirPersonneEnPote, type DetailsPote } from "~/fonctions/communaute/convertir-personne-en-pote";
import { utiliserPoulsSocial } from "~/hooks/utiliser-pouls-social";
import { utiliserSession } from "~/hooks/utiliser-session";

/** Ce qu'un ajout à la bande a donné (lien, QR code ou pseudo), pour l'écran « Ajouter un pote » et la recherche */
export type ResultatAjoutBande =
  | { type: "ajoute" | "deja"; pote: Pote }
  | { type: "demande"; pote: Pote | null }
  | { type: "bloque"; pote: Pote }
  | { type: "introuvable"; pseudo: string }
  | { type: "invitation-invalide" }
  /** Un ancien lien (avec le bon code) d'une personne qui a changé de pseudo depuis : décidé par Hugo le 14/10/2026 */
  | { type: "lien-change" }
  /** Elle a coupé « Qu'on me trouve par mon pseudo » : on n'entre dans sa bande que par son lien (refus dit franchement) */
  | { type: "demandes-fermees"; pote: Pote | null }
  | { type: "toi" }
  | { type: "erreur"; erreur: ErreurService };

export type BandeCompte = {
  /** Faux tant que ton profil social et ta bande n'ont pas été demandés au serveur (même ratés, ils comptent) */
  pret: boolean;
  /** La dernière lecture a raté (réseau, serveur) : on garde ce qu'on avait */
  horsLigne: boolean;
  /** Ton profil social ; null tant qu'il n'existe pas (Potes pas encore ouvert) */
  moiSocial: MoiSocial | null;
  /** Le serveur demande un pseudo avant d'ouvrir ton profil social */
  pseudoRequis: boolean;
  potes: Pote[];
  bloques: Pote[];
  demandesRecues: Pote[];
  demandesEnvoyees: Pote[];
  activites: ActivitePote[];
  /** Tes points et rescousses du mois, d'après le classement du serveur */
  maPlace: { pointsDuMois: number; rescoussesDuMois: number } | null;
  trouverPote: (id: string) => Pote | null;
  estMasque: (cible: CibleMasque, id: string) => boolean;
  /** À l'ouverture de Potes, une fois par lancement : crée ton profil social s'il manque (POST /app/social/moi) */
  ouvrirProfil: () => void;
  rejoindre: (pseudo: string, code: string, moyen: MoyenInvitation) => Promise<ResultatAjoutBande>;
  demander: (id: string) => Promise<ResultatAjoutBande>;
  accepter: (id: string) => Promise<ErreurService | null>;
  /** Refuser sa demande (sans le prévenir) ou annuler la tienne */
  retirerDemande: (id: string) => Promise<ErreurService | null>;
  retirer: (id: string) => void;
  bloquer: (id: string) => void;
  debloquer: (id: string) => void;
  masquer: (cible: CibleMasque, id: string) => void;
  demasquer: (cible: CibleMasque, id: string) => void;
  /** Une personne croisée ailleurs (son profil, une recherche) : l'annuaire la connaît ensuite */
  noterPersonne: (personne: PersonneResume, details?: DetailsPote) => void;
  relire: () => void;
};

const cle = (cible: CibleMasque, id: string) => `${cible}:${id}`;

/**
 * Ta bande quand un compte est connecté : tout vient de l'API (/app/social/moi, /app/bande, /app/blocages, /app/masques),
 * relu quand le pouls dit que la bande ou les demandes ont bougé. Les gestes (retirer, bloquer, masquer) s'affichent tout de
 * suite, puis la bande est relue. Inactif (démo, visite, attente) : rien n'est lu, rien n'est gardé.
 */
export function utiliserBandeCompte(actif: boolean): BandeCompte {
  const { sociaux } = utiliserSession();
  const { pouls, relire: relirePouls } = utiliserPoulsSocial();
  const [moiSocial, setMoiSocial] = useState<MoiSocial | null>(null);
  const [pseudoRequis, setPseudoRequis] = useState(false);
  const [bande, setBande] = useState<BandeApi | null>(null);
  const [bloquesApi, setBloquesApi] = useState<PersonneResume[]>([]);
  const [activitesApi, setActivitesApi] = useState<ActiviteBandeApi[]>([]);
  const [classement, setClassement] = useState<ClassementApi | null>(null);
  const [masques, setMasques] = useState<ReadonlySet<string>>(new Set());
  const [croisees, setCroisees] = useState<ReadonlyMap<string, { personne: PersonneResume; details?: DetailsPote }>>(new Map());
  const [pret, setPret] = useState(false);
  const [horsLigne, setHorsLigne] = useState(false);
  // Une réponse arrivée après une déconnexion (ou une reconnexion) ne touche à rien
  const generation = useRef(0);
  const profilOuvert = useRef(false);

  const tant = useCallback((g: number) => g === generation.current, []);

  const chargerBande = useCallback(async () => {
    const g = generation.current;
    const [b, bl] = await Promise.all([sociaux.bande.lireBande(), sociaux.bande.listerBloques()]);
    if (!tant(g)) return;
    if (b.ok) setBande(b.bande);
    if (bl.ok) setBloquesApi(bl.bloques);
    setHorsLigne(!b.ok);
  }, [sociaux, tant]);

  const chargerActivite = useCallback(async () => {
    const g = generation.current;
    const [a, c] = await Promise.all([sociaux.bande.lireActivite(), sociaux.bande.lireClassement()]);
    if (!tant(g)) return;
    if (a.ok) setActivitesApi(a.activites);
    if (c.ok) setClassement(c.classement);
  }, [sociaux, tant]);

  const chargerMasques = useCallback(async () => {
    const g = generation.current;
    const r = await sociaux.social.listerMasques();
    if (tant(g) && r.ok) setMasques(new Set(r.masques.map((m: MasqueSocial) => cle(m.cible, m.cibleId))));
  }, [sociaux, tant]);

  // Connexion : tout est lu une fois ; déconnexion (ou démo) : tout est oublié
  useEffect(() => {
    generation.current += 1;
    if (!actif) {
      profilOuvert.current = false;
      setMoiSocial(null);
      setPseudoRequis(false);
      setBande(null);
      setBloquesApi([]);
      setActivitesApi([]);
      setClassement(null);
      setMasques(new Set());
      setCroisees(new Map());
      setPret(false);
      setHorsLigne(false);
      return;
    }
    const g = generation.current;
    void (async () => {
      const moi = await sociaux.social.lireMoi();
      if (tant(g) && moi.ok) setMoiSocial(moi.moi);
      await chargerBande();
      if (tant(g)) setPret(true);
      void chargerMasques();
      void chargerActivite();
    })();
  }, [actif, sociaux, chargerBande, chargerMasques, chargerActivite, tant]);

  // Le pouls dit que la bande ou les demandes ont bougé : on relit
  const signature = pouls ? `${pouls.bande.signature}|${pouls.demandes.signature}` : null;
  const derniereSignature = useRef<string | null>(null);
  useEffect(() => {
    if (!actif || signature === null) return;
    if (derniereSignature.current !== null && derniereSignature.current !== signature) {
      void chargerBande();
      void chargerActivite();
    }
    derniereSignature.current = signature;
  }, [actif, signature, chargerBande, chargerActivite]);

  // L'annuaire : tout ce qu'on sait des personnes croisées, avec les points du mois du classement
  const annuaire = useMemo(() => {
    const details = new Map<string, DetailsPote>((classement?.places ?? []).map((p) => [p.personne.id, { pointsDuMois: p.pointsDuMois, rescoussesDuMois: p.rescoussesDuMois }]));
    const carte = new Map<string, Pote>();
    const noter = (personne: PersonneResume, plus?: DetailsPote) => carte.set(personne.id, convertirPersonneEnPote(personne, { ...plus, ...details.get(personne.id) }));
    croisees.forEach(({ personne, details: plus }) => noter(personne, plus));
    activitesApi.forEach((a) => noter(a.personne));
    (classement?.places ?? []).forEach((p) => noter(p.personne));
    bloquesApi.forEach((p) => noter(p));
    bande?.demandesRecues.forEach((d) => noter(d.personne));
    bande?.demandesEnvoyees.forEach((d) => noter(d.personne));
    bande?.membres.forEach((m) => noter(m.personne, croisees.get(m.personne.id)?.details));
    return carte;
  }, [bande, bloquesApi, activitesApi, classement, croisees]);

  const trouverPote = useCallback((id: string) => annuaire.get(id) ?? null, [annuaire]);
  const idsBloques = useMemo(() => new Set(bloquesApi.map((p) => p.id)), [bloquesApi]);
  const enPotes = useCallback(
    (personnes: readonly { personne: PersonneResume }[] | undefined) =>
      (personnes ?? []).filter(({ personne }) => !idsBloques.has(personne.id)).map(({ personne }) => annuaire.get(personne.id)).filter((p): p is Pote => !!p),
    [annuaire, idsBloques],
  );

  const noterPersonne = useCallback((personne: PersonneResume, details?: DetailsPote) => {
    setCroisees((avant) => new Map(avant).set(personne.id, { personne, details: { ...avant.get(personne.id)?.details, ...details } }));
  }, []);

  const ouvrirProfil = useCallback(() => {
    if (!actif || profilOuvert.current) return;
    profilOuvert.current = true;
    const g = generation.current;
    void sociaux.social.ouvrirProfil().then((r) => {
      if (!tant(g)) return;
      if (r.ok) {
        setMoiSocial(r.moi);
        setPseudoRequis(false);
        void chargerBande();
        void chargerActivite();
        return;
      }
      setPseudoRequis(r.erreur === "pseudo-requis");
      // Raté (réseau, pas de pseudo) : on réessaiera à la prochaine ouverture de Potes
      profilOuvert.current = false;
    });
  }, [actif, sociaux, tant, chargerBande, chargerActivite]);

  const apresGeste = useCallback(() => {
    void chargerBande();
    relirePouls();
  }, [chargerBande, relirePouls]);

  const rejoindre = useCallback(
    async (pseudo: string, code: string, moyen: MoyenInvitation): Promise<ResultatAjoutBande> => {
      const r = await sociaux.bande.rejoindre(pseudo, code, moyen);
      if (!r.ok) {
        if (r.erreur === "invitation-invalide") return { type: "invitation-invalide" };
        if (r.erreur === "invitation-inconnue") return { type: "lien-change" };
        if (r.erreur === "champ-invalide" && r.champ === "pseudo") return { type: "toi" };
        return { type: "erreur", erreur: r.erreur };
      }
      noterPersonne(r.personne);
      apresGeste();
      return { type: r.deja ? "deja" : "ajoute", pote: convertirPersonneEnPote(r.personne) };
    },
    [sociaux, noterPersonne, apresGeste],
  );

  const demander = useCallback(
    async (id: string): Promise<ResultatAjoutBande> => {
      const r = await sociaux.bande.demander(id);
      if (!r.ok) return r.erreur === "demandes-fermees" ? { type: "demandes-fermees", pote: annuaire.get(id) ?? null } : { type: "erreur", erreur: r.erreur };
      if (r.personne) noterPersonne(r.personne);
      apresGeste();
      const pote = r.personne ? convertirPersonneEnPote(r.personne) : (annuaire.get(id) ?? null);
      if (r.etat === "demande" || !pote) return { type: "demande", pote };
      return { type: r.etat, pote };
    },
    [sociaux, noterPersonne, apresGeste, annuaire],
  );

  const accepter = useCallback(
    async (id: string) => {
      const r = await sociaux.bande.accepter(id);
      apresGeste();
      return r.ok ? null : r.erreur;
    },
    [sociaux, apresGeste],
  );

  const retirerDemande = useCallback(
    async (id: string) => {
      // Tout de suite à l'écran, dans les deux sens
      setBande((b) => (b ? { ...b, demandesRecues: b.demandesRecues.filter((d) => d.personne.id !== id), demandesEnvoyees: b.demandesEnvoyees.filter((d) => d.personne.id !== id) } : b));
      const r = await sociaux.bande.retirerDemande(id);
      apresGeste();
      return r.ok ? null : r.erreur;
    },
    [sociaux, apresGeste],
  );

  const retirer = useCallback(
    (id: string) => {
      setBande((b) => (b ? { ...b, membres: b.membres.filter((m) => m.personne.id !== id) } : b));
      void sociaux.bande.retirer(id).then(apresGeste);
    },
    [sociaux, apresGeste],
  );

  const bloquer = useCallback(
    (id: string) => {
      const personne = annuaire.get(id);
      // Un blocage coupe tout dans les deux sens : la personne sort de la bande et des demandes tout de suite
      setBande((b) =>
        b
          ? { ...b, membres: b.membres.filter((m) => m.personne.id !== id), demandesRecues: b.demandesRecues.filter((d) => d.personne.id !== id), demandesEnvoyees: b.demandesEnvoyees.filter((d) => d.personne.id !== id) }
          : b,
      );
      if (personne) setBloquesApi((avant) => (avant.some((p) => p.id === id) ? avant : [...avant, { id, pseudo: personne.pseudo, prenom: personne.prenom, avatar: personne.avatar }]));
      void sociaux.bande.bloquer(id, true).then(apresGeste);
    },
    [sociaux, annuaire, apresGeste],
  );

  const debloquer = useCallback(
    (id: string) => {
      setBloquesApi((avant) => avant.filter((p) => p.id !== id));
      void sociaux.bande.bloquer(id, false).then(apresGeste);
    },
    [sociaux, apresGeste],
  );

  const changerMasque = useCallback(
    (cible: CibleMasque, id: string, masque: boolean) => {
      setMasques((avant) => {
        const apres = new Set(avant);
        if (masque) apres.add(cle(cible, id));
        else apres.delete(cle(cible, id));
        return apres;
      });
      // Raté : on relit ce que le serveur a vraiment gardé
      void sociaux.social.masquer(cible, id, masque).then((r) => {
        if (!r.ok) void chargerMasques();
      });
    },
    [sociaux, chargerMasques],
  );

  return useMemo((): BandeCompte => {
    const maPlace = classement?.places.find((p) => p.estMoi) ?? null;
    return {
      pret,
      horsLigne,
      moiSocial,
      pseudoRequis,
      potes: enPotes(bande?.membres),
      bloques: bloquesApi.map((p) => annuaire.get(p.id) ?? convertirPersonneEnPote(p)),
      demandesRecues: enPotes(bande?.demandesRecues),
      demandesEnvoyees: enPotes(bande?.demandesEnvoyees),
      activites: activitesApi
        .filter((a) => !idsBloques.has(a.personne.id) && !masques.has(cle("activite", a.id)))
        .map(convertirActiviteBande)
        .sort((a, b) => b.date.localeCompare(a.date)),
      maPlace: maPlace ? { pointsDuMois: maPlace.pointsDuMois, rescoussesDuMois: maPlace.rescoussesDuMois } : null,
      trouverPote,
      estMasque: (cible, id) => masques.has(cle(cible, id)),
      ouvrirProfil,
      rejoindre,
      demander,
      accepter,
      retirerDemande,
      retirer,
      bloquer,
      debloquer,
      masquer: (cible, id) => changerMasque(cible, id, true),
      demasquer: (cible, id) => changerMasque(cible, id, false),
      noterPersonne,
      relire: () => {
        void chargerBande();
        void chargerActivite();
        void chargerMasques();
      },
    };
  }, [
    pret, horsLigne, moiSocial, pseudoRequis, bande, bloquesApi, activitesApi, classement, masques, annuaire, idsBloques, enPotes, trouverPote,
    ouvrirProfil, rejoindre, demander, accepter, retirerDemande, retirer, bloquer, debloquer, changerMasque, noterPersonne, chargerBande, chargerActivite, chargerMasques,
  ]);
}
