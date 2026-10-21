import { calculerLimiteConservationSecurite } from "../fonctions/chasse-aux-bugs/calculer-limite-conservation-securite.ts";
import type { ChampSignalement, ChiffrementSecurite } from "./chiffrement-securite.ts";
import {
  DELAI_ORPHELIN_IMAGE_MS, FICHIERS_PAR_PASSAGE,
  type BilanMenageSecurite, type ChiffresSignalement, type DependancesSecurite, type SignalementEnBase,
} from "./securite-regles.ts";

type IssueRechiffrement = "rechiffre" | "illisible" | "a-jour";

const CHAMPS: readonly [keyof ChiffresSignalement, ChampSignalement][] = [
  ["nomChiffre", "nom"], ["emailChiffre", "email"], ["titreChiffre", "titre"], ["descriptionChiffree", "description"],
  ["lienChiffre", "lien"], ["nomTableauChiffre", "nomTableauHonneur"],
];

export function creerMenageSecurite({ depot, stockage, chiffrement, horloge = Date.now }: DependancesSecurite) {
  async function effacerOrphelines(quand: Date): Promise<number> {
    const limite = quand.getTime() - DELAI_ORPHELIN_IMAGE_MS;
    let effacees = 0;
    let apres: string | null = null;
    for (;;) {
      const paquet = await stockage.lister(apres, FICHIERS_PAR_PASSAGE);
      if (paquet.length === 0) return effacees;
      apres = paquet[paquet.length - 1]!.fichier;
      const vieilles = paquet.filter((f) => f.modifieLe.getTime() < limite).map((f) => f.fichier);
      if (vieilles.length === 0) continue;
      const citees = await depot.listerImagesCitees(vieilles);
      effacees += await stockage.supprimer(vieilles.filter((fichier) => !citees.has(fichier)));
    }
  }

  async function rechiffrerUn(s: SignalementEnBase, ch: ChiffrementSecurite): Promise<IssueRechiffrement> {
    const chiffresImages = await Promise.all(s.images.map((fichier) => stockage.lire(fichier)));
    const imagesAnciennes = chiffresImages.some((c) => c !== null && ch.estAncienneImage(c));
    const textesAnciens = CHAMPS.some(([cle]) => {
      const valeur = s[cle];
      return typeof valeur === "string" && ch.estAncien(valeur);
    });
    if (!imagesAnciennes && !textesAnciens) return "a-jour";
    const relire = (chiffre: string | null, champ: ChampSignalement) => (chiffre === null ? null : ch.chiffrerTexte(ch.dechiffrerTexte(chiffre, s.id, champ), s.id, champ));
    let chiffres: ChiffresSignalement;
    const clairs: (Buffer | null)[] = [];
    try {
      chiffres = {
        nomChiffre: relire(s.nomChiffre, "nom")!,
        emailChiffre: relire(s.emailChiffre, "email")!,
        titreChiffre: relire(s.titreChiffre, "titre")!,
        descriptionChiffree: relire(s.descriptionChiffree, "description")!,
        lienChiffre: relire(s.lienChiffre, "lien"),
        nomTableauChiffre: relire(s.nomTableauChiffre, "nomTableauHonneur"),
        images: [...s.images],
      };
      for (const [rang, chiffre] of chiffresImages.entries()) {
        clairs.push(chiffre !== null && ch.estAncienneImage(chiffre) ? ch.dechiffrerImage(chiffre, s.id, s.images[rang]!) : null);
      }
    } catch {
      return "illisible";
    }
    const neuves: string[] = [];
    for (const [rang, clair] of clairs.entries()) {
      if (!clair) continue;
      const fichier = stockage.tirerNom();
      await stockage.ecrire(fichier, ch.chiffrerImage(clair, s.id, fichier));
      chiffres.images[rang] = fichier;
      neuves.push(fichier);
    }
    const remplace = await depot.remplacerChiffres(s.id, s.images, chiffres);
    const aJeter = remplace ? s.images.filter((f) => !chiffres.images.includes(f)) : neuves;
    if (aJeter.length > 0) await stockage.supprimer(aJeter);
    return remplace ? "rechiffre" : "a-jour";
  }

  async function rechiffrer(): Promise<{ rechiffres: number; illisibles: number }> {
    const bilan = { rechiffres: 0, illisibles: 0 };
    if (!chiffrement || !chiffrement.aDesAnciennesCles()) return bilan;
    let apres: string | null = null;
    for (;;) {
      const paquet = await depot.listerSignalementsApres(apres, FICHIERS_PAR_PASSAGE);
      if (paquet.length === 0) return bilan;
      apres = paquet[paquet.length - 1]!.id;
      for (const signalement of paquet) {
        const issue = await rechiffrerUn(signalement, chiffrement);
        if (issue === "rechiffre") bilan.rechiffres++;
        if (issue === "illisible") bilan.illisibles++;
      }
    }
  }

  return {
    async menager(quand = new Date(horloge())): Promise<BilanMenageSecurite> {
      const anciens = await depot.effacerSignalementsClosAvant(calculerLimiteConservationSecurite(quand));
      const images = await stockage.supprimer(anciens.images);
      const orphelines = await effacerOrphelines(quand);
      const { rechiffres, illisibles } = await rechiffrer();
      return { signalements: anciens.nombre, images, orphelines, rechiffres, illisibles };
    },
  };
}
