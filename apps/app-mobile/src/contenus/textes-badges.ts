export const TEXTES_BADGES = {
  titre: "Tes badges",
  sousTitre: (obtenus: number, total: number) =>
    obtenus < total
      ? `${obtenus} sur ${total} : encore ${total - obtenus} à débloquer, la chasse est ouverte !`
      : "Collection complète : la Brigade en reste bouche bée !",
  aide: "Touche un badge pour savoir comment le gagner.",
  attenteReseau: "Tes badges arrivent dès que le réseau revient. Ils t'attendent bien au chaud !",
  sansSession: "Connecte-toi à ton compte pour retrouver tes badges.",
  compteFamille: (obtenus: number, total: number) => ({ texte: `${obtenus}/${total}`, lu: `${obtenus} sur ${total}` }),
  obtenu: "✅ Obtenu, bravo !",
  aObtenir: (commentObtenir: string) => `🔒 ${commentObtenir}`,
  possible: "À débloquer, c'est possible dès maintenant !",
  sousCleDemo: "Dans la démo, celui-ci reste sous clé : il se gagne pour de vrai avec un compte.",
} as const;
