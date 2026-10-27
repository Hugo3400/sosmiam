// Les mails d'une limitation de compte (décision de Hugo du 15 octobre 2026, docs/decisions.md, « Modération des avis et
// limitation d'un compte ») : la limitation décidée (la règle en clair, le pourquoi de l'équipe, jusqu'à quand, ce qui
// change, comment contester), sa levée, et le résultat d'un réexamen. Le texte de la contestation n'est jamais recopié.
import { TEXTES_COURRIELS_LIMITATIONS_PAR_LANGUE } from "../../../../../packages/commun/src/contenus/courriels-limitations.ts";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { lireLangue } from "../../../../../packages/commun/src/fonctions/langue/lire-langue.ts";
import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { formaterDateCourriel } from "../../fonctions/courriels/formater-date-courriel.ts";
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { habillerCourriel } from "../../fonctions/courriels/habiller-courriel.ts";
import type { LimitationLue } from "../limitations-comptes-regles.ts";
import { mettreEnFile } from "./file-courriels.ts";
import { lireReglagesEnvoi } from "./reglages-envoi.ts";

/** Adresse écrite en dur : « Mon compte » sur le site, où l'on conteste (même page sur les trois hôtes) */
const MON_COMPTE = "https://sosmiam.fr/mon-compte";

const textes = (langue: Langue) => choisirTextes(TEXTES_COURRIELS_LIMITATIONS_PAR_LANGUE, langue);
const enClair = (motif: string, langue: Langue) => (textes(langue).motifs as Readonly<Record<string, string | undefined>>)[motif] ?? textes(langue).regleParDefaut;
const decrireFin = (fin: Date | null, langue: Langue) => (fin ? textes(langue).jusquAu(formaterDateCourriel(fin, "moment", langue)) : textes(langue).jusquANouvelOrdre);

async function lireDestinataire(compteId: number) {
  if ((await lireReglagesEnvoi()).etat !== "pret") return null;
  const compte = await baseDeDonnees.compte.findUnique({ where: { id: compteId }, select: { prenom: true, email: true, langue: true } });
  return compte ? { ...compte, langue: lireLangue(compte.langue) ?? LANGUE_PAR_DEFAUT } : null;
}

/** La limitation décidée : faux si l'envoi n'est pas réglé ou si le compte n'existe plus (la cloche part quand même). */
export async function prevenirCompteLimite(l: LimitationLue, maintenant = new Date()) {
  const compte = await lireDestinataire(l.compteId);
  if (!compte) return false;
  const { langue } = compte;
  const T = textes(langue);
  const aVenir = l.debut.getTime() > maintenant.getTime();
  await mettreEnFile("compte-limite", compte.email, {
    objet: aVenir ? T.limite.objetAVenir : T.limite.objet,
    ...habillerCourriel({
      titre: T.limite.titre(compte.prenom),
      paragraphes: [
        aVenir ? T.limite.aVenir(formaterDateCourriel(l.debut, "moment", langue), decrireFin(l.fin, langue)) : T.limite.deja(decrireFin(l.fin, langue)),
        T.limite.regle(enClair(l.motif, langue)),
        T.limite.explication(l.motivation),
        T.ceQuiChange,
        T.limite.contester,
      ],
      bouton: { texte: T.boutonMonCompte, adresse: MON_COMPTE },
      pied: T.pied,
      langue,
    }),
  });
  return true;
}

/** Fin de la limitation avant l'heure : levée par l'équipe, ou après un réexamen qui donne raison à la personne. */
export async function prevenirLimitationLevee(l: LimitationLue, apresReexamen: boolean, message: string | null) {
  const compte = await lireDestinataire(l.compteId);
  if (!compte) return false;
  const { langue } = compte;
  const T = textes(langue);
  await mettreEnFile("limitation-levee", compte.email, {
    objet: T.levee.objet,
    ...habillerCourriel({
      titre: T.levee.titre(compte.prenom),
      paragraphes: [apresReexamen ? T.levee.apresReexamen : T.levee.parEquipe, ...(message ? [T.motEquipe(message)] : []), T.levee.fin],
      pied: T.pied,
      langue,
    }),
  });
  return true;
}

/** Réexamen qui maintient la limitation : la personne le sait, avec le mot de l'équipe s'il y en a un. */
export async function prevenirLimitationMaintenue(l: LimitationLue, message: string | null) {
  const compte = await lireDestinataire(l.compteId);
  if (!compte) return false;
  const { langue } = compte;
  const T = textes(langue);
  await mettreEnFile("limitation-maintenue", compte.email, {
    objet: T.maintenue.objet,
    ...habillerCourriel({
      titre: T.maintenue.titre(compte.prenom),
      paragraphes: [
        T.maintenue.relue(decrireFin(l.fin, langue)),
        ...(message ? [T.motEquipe(message)] : []),
        T.maintenue.regle(enClair(l.motif, langue)),
        T.maintenue.possible,
      ],
      bouton: { texte: T.boutonMonCompte, adresse: MON_COMPTE },
      pied: T.pied,
      langue,
    }),
  });
  return true;
}
