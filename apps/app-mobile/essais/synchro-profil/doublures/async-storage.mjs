// Doublure d'AsyncStorage (@react-native-async-storage/async-storage) : un Map en mémoire, globalThis.__magasin (un essai
// le remplace pour partir d'un état gardé, ou l'espionne). globalThis.__delaiMagasin : délai de chaque écriture (ms).
const magasin = () => (globalThis.__magasin ??= new Map());
const attendre = async () => {
  const delai = globalThis.__delaiMagasin ?? 0;
  if (delai) await new Promise((r) => setTimeout(r, delai));
};

export default {
  async getItem(cle) {
    return magasin().has(cle) ? magasin().get(cle) : null;
  },
  async setItem(cle, valeur) {
    await attendre();
    magasin().set(cle, valeur);
  },
  async removeItem(cle) {
    await attendre();
    magasin().delete(cle);
  },
};
