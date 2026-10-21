const JOUR_MS = 24 * 60 * 60 * 1000;

export const ENVOIS_MAX_JOURNAL_MEDIAS = 100_000;

export type BilanJournalMedias = { envoisCompte24h: number; octetsCompte24h: number; octetsServeur24h: number };

export type JournalEnvoisMedias = {
  noter(compteId: number, taille: number, quand: Date): void;
  lire(compteId: number, maintenant: Date): BilanJournalMedias;
};

type Envoi = { compteId: number; quand: number; taille: number };

export function creerJournalEnvoisMedias(envoisMax = ENVOIS_MAX_JOURNAL_MEDIAS): JournalEnvoisMedias {
  let file: Envoi[] = [];
  let debut = 0;
  let octetsServeur = 0;
  const parCompte = new Map<number, Envoi[]>();

  function retirerPlusAncien() {
    const envoi = file[debut]!;
    debut += 1;
    octetsServeur -= envoi.taille;
    const envois = parCompte.get(envoi.compteId);
    envois?.shift();
    if (envois?.length === 0) parCompte.delete(envoi.compteId);
    if (debut > 1024 && debut * 2 > file.length) {
      file = file.slice(debut);
      debut = 0;
    }
  }

  function oublierAnciens(maintenant: number) {
    while (debut < file.length && (file.length - debut > envoisMax || file[debut]!.quand < maintenant - JOUR_MS)) retirerPlusAncien();
  }

  return {
    noter(compteId, taille, quand) {
      const envoi = { compteId, quand: quand.getTime(), taille };
      file.push(envoi);
      octetsServeur += taille;
      const envois = parCompte.get(compteId);
      if (envois) envois.push(envoi);
      else parCompte.set(compteId, [envoi]);
      oublierAnciens(envoi.quand);
    },

    lire(compteId, maintenant) {
      const depuis = maintenant.getTime() - JOUR_MS;
      oublierAnciens(maintenant.getTime());
      const recents = (parCompte.get(compteId) ?? []).filter((e) => e.quand >= depuis);
      return {
        envoisCompte24h: recents.length,
        octetsCompte24h: recents.reduce((total, e) => total + e.taille, 0),
        octetsServeur24h: octetsServeur,
      };
    },
  };
}
