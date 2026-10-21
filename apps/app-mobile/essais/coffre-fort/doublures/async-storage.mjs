const magasin = () => (globalThis.__magasin ??= new Map());
const noter = (operation, cle) => (globalThis.__journalMagasin ??= []).push({ operation, cle });
const attendre = async () => {
  const delai = globalThis.__delaiMagasin ?? 0;
  if (delai) await new Promise((resoudre) => setTimeout(resoudre, delai));
};
const verifierLisible = () => {
  if (globalThis.__magasinIllisible) throw new Error("Could not open the existing manifest, perhaps data protection is enabled?");
};

export default {
  async getItem(cle) {
    noter("lire", cle);
    await attendre();
    verifierLisible();
    return magasin().has(cle) ? magasin().get(cle) : null;
  },
  async setItem(cle, valeur) {
    noter("ecrire", cle);
    await attendre();
    verifierLisible();
    magasin().set(cle, valeur);
  },
  async removeItem(cle) {
    noter("effacer", cle);
    await attendre();
    verifierLisible();
    magasin().delete(cle);
  },
};
