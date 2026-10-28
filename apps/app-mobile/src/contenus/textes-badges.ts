export const TEXTES_BADGES = {
  titre: "Tes badges",
  retour: "Retour au profil",
  sousTitre: (obtenus: number, total: number) => `${obtenus} sur ${total} : encore ${total - obtenus} à débloquer, la chasse est ouverte !`,
  collectionComplete: "Collection complète : la Brigade en reste bouche bée !",
  aide: "Touche un badge pour savoir comment le gagner.",
  attenteReseau: "Tes badges arrivent dès que le réseau revient. Ils t'attendent bien au chaud !",
  sansSession: "Connecte-toi à ton compte pour retrouver tes badges.",
  compteFamille: (obtenus: number, total: number) => ({ texte: `${obtenus}/${total}`, lu: `${obtenus} sur ${total}` }),
  obtenu: "Obtenu",
  possible: "À débloquer, c'est possible dès maintenant !",
} as const;
