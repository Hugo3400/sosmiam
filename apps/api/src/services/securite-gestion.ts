import { STATUTS_CLOS_SECURITE } from "../../../../packages/commun/src/regles/securite.ts";
import type { SignalementSecuriteGestion } from "../../../../packages/commun/src/types/securite.ts";
import { calculerEffacementSignalement } from "../fonctions/chasse-aux-bugs/calculer-effacement-signalement.ts";
import { lireChangementsSignalement } from "../fonctions/chasse-aux-bugs/lire-changements-signalement.ts";
import { lireMoisParis } from "../fonctions/chasse-aux-bugs/lire-mois-paris.ts";
import { lireNumeroImage } from "../fonctions/chasse-aux-bugs/lire-numero-image.ts";
import { lireTypeImage } from "../fonctions/chasse-aux-bugs/lire-type-image.ts";
import type { ChampSignalement } from "./chiffrement-securite.ts";
import {
  BADGE_CHASSEUR_DE_BUGS, ENTREES_TABLEAU_MAX, FORME_ID_SIGNALEMENT, SIGNALEMENTS_PAR_LISTE, STATUTS_SIGNALEMENT_SECURITE, TEXTE_ILLISIBLE,
  type ChangementsSignalementEnBase, type DependancesSecurite, type EntreeTableauHonneurGestion, type FiltresSignalementsSecurite,
  type ImageSignalementLue, type ResultatBadgeSignalement, type ResultatChangementSignalement, type SignalementAvecTableau,
} from "./securite-regles.ts";

const estClos = (statut: SignalementAvecTableau["statut"]) => STATUTS_CLOS_SECURITE.includes(statut);

export function creerSecuriteGestion({ depot, stockage, chiffrement, horloge = Date.now }: DependancesSecurite) {
  const lireClair = (chiffre: string, id: string, champ: ChampSignalement): string | null => {
    if (!chiffrement) return null;
    try {
      return chiffrement.dechiffrerTexte(chiffre, id, champ);
    } catch {
      return null;
    }
  };
  const dechiffrer = (chiffre: string, id: string, champ: ChampSignalement) => lireClair(chiffre, id, champ) ?? TEXTE_ILLISIBLE;

  const presenter = (s: SignalementAvecTableau, confirmes: Set<string>): SignalementSecuriteGestion => {
    const email = lireClair(s.emailChiffre, s.id, "email");
    return {
      id: s.id,
      nom: dechiffrer(s.nomChiffre, s.id, "nom"),
      email: email ?? TEXTE_ILLISIBLE,
      cible: s.cible,
      titre: dechiffrer(s.titreChiffre, s.id, "titre"),
      description: dechiffrer(s.descriptionChiffree, s.id, "description"),
      lien: s.lienChiffre ? dechiffrer(s.lienChiffre, s.id, "lien") : null,
      nomTableauHonneur: s.nomTableauChiffre ? dechiffrer(s.nomTableauChiffre, s.id, "nomTableauHonneur") : null,
      auTableauHonneur: s.auTableauHonneur,
      images: s.images.length,
      statut: s.statut,
      gravite: s.gravite,
      compteTrouve: email !== null && confirmes.has(email),
      badgeDonne: s.badgeDonneLe !== null,
      creeLe: s.creeLe.toISOString(),
      clotureLe: s.clotureLe?.toISOString() ?? null,
      effaceLe: s.clotureLe ? calculerEffacementSignalement(s.clotureLe).toISOString() : null,
    };
  };

  const presenterTous = async (liste: SignalementAvecTableau[]) => {
    const emails = liste.flatMap((s) => {
      const email = lireClair(s.emailChiffre, s.id, "email");
      return email ? [email] : [];
    });
    const confirmes = emails.length > 0 ? await depot.listerEmailsConfirmes([...new Set(emails)]) : new Set<string>();
    return liste.map((s) => presenter(s, confirmes));
  };

  const lireSignalement = async (id: string) => (FORME_ID_SIGNALEMENT.test(id) ? depot.lireSignalement(id) : null);

  async function lireSignalementSecurite(id: string): Promise<SignalementSecuriteGestion | null> {
    const s = await lireSignalement(id);
    return s ? (await presenterTous([s]))[0]! : null;
  }

  return {
    async listerSignalementsSecurite(filtres: FiltresSignalementsSecurite = {}): Promise<SignalementSecuriteGestion[]> {
      if (filtres.statut !== undefined && !STATUTS_SIGNALEMENT_SECURITE.includes(filtres.statut)) return [];
      return presenterTous(await depot.listerSignalements({ statut: filtres.statut }, SIGNALEMENTS_PAR_LISTE));
    },

    lireSignalementSecurite,

    async changerSignalementSecurite(id: string, envoyes: unknown, quand = new Date(horloge())): Promise<ResultatChangementSignalement> {
      const lecture = lireChangementsSignalement(envoyes);
      if (!lecture.ok) return { ok: false, erreur: "champ-invalide", champ: lecture.champ };
      const { statut, gravite, auTableauHonneur } = lecture.changements;
      const s = await lireSignalement(id);
      if (!s) return { ok: false, erreur: "signalement-inconnu" };
      let nomTableau: string | null = null;
      if (auTableauHonneur === true && !s.auTableauHonneur) {
        if (!s.nomTableauChiffre) return { ok: false, erreur: "sans-nom-tableau" };
        nomTableau = lireClair(s.nomTableauChiffre, s.id, "nomTableauHonneur");
        if (nomTableau === null) return { ok: false, erreur: "chiffrement-indisponible" };
      }
      const changements: ChangementsSignalementEnBase = {};
      if (gravite !== undefined) changements.gravite = gravite;
      if (statut !== undefined) {
        changements.statut = statut;
        changements.clotureLe = estClos(statut) ? (estClos(s.statut) && s.clotureLe ? s.clotureLe : quand) : null;
      }
      if (Object.keys(changements).length > 0 && !(await depot.modifierSignalement(s.id, changements))) return { ok: false, erreur: "signalement-inconnu" };
      if (nomTableau !== null) await depot.ajouterAuTableau({ nom: nomTableau, mois: lireMoisParis(quand), signalementId: s.id }, quand);
      if (auTableauHonneur === false) await depot.retirerDuTableauParSignalement(s.id);
      const apres = await lireSignalementSecurite(s.id);
      return apres ? { ok: true, signalement: apres } : { ok: false, erreur: "signalement-inconnu" };
    },

    async lireImageSignalementSecurite(id: string, numero: unknown): Promise<ImageSignalementLue | null> {
      const rang = lireNumeroImage(numero);
      if (!chiffrement || rang === null) return null;
      const s = await lireSignalement(id);
      const fichier = s?.images[rang];
      if (!s || !fichier) return null;
      const chiffre = await stockage.lire(fichier);
      if (!chiffre) return null;
      try {
        const octets = chiffrement.dechiffrerImage(chiffre, s.id, fichier);
        const typeMime = lireTypeImage(octets);
        return typeMime ? { octets, typeMime } : null;
      } catch {
        return null;
      }
    },

    async donnerBadgeSignalementSecurite(id: string, quand = new Date(horloge())): Promise<ResultatBadgeSignalement> {
      const s = await lireSignalement(id);
      if (!s) return { ok: false, erreur: "signalement-inconnu" };
      const email = lireClair(s.emailChiffre, s.id, "email");
      if (email === null) return { ok: false, erreur: "chiffrement-indisponible" };
      return depot.donnerBadge(s.id, email, BADGE_CHASSEUR_DE_BUGS, quand);
    },

    async supprimerSignalementSecurite(id: string): Promise<boolean> {
      if (!FORME_ID_SIGNALEMENT.test(id)) return false;
      const supprime = await depot.supprimerSignalement(id);
      if (!supprime) return false;
      if (supprime.images.length > 0) await stockage.supprimer(supprime.images).catch(() => 0);
      return true;
    },

    async listerEntreesTableauHonneur(): Promise<EntreeTableauHonneurGestion[]> {
      return (await depot.listerTableauHonneur(ENTREES_TABLEAU_MAX)).map((e) => ({ id: String(e.id), nom: e.nom, mois: e.mois, signalementId: e.signalementId }));
    },

    async retirerEntreeTableauHonneur(id: string): Promise<boolean> {
      return /^[1-9]\d{0,8}$/.test(id) ? depot.retirerEntreeTableau(Number(id)) : false;
    },
  };
}
