export const serveur = (globalThis.__serveurVersions ??= { appels: 0, reponse: () => ({ ok: true, minimale: { ios: "0.0.0", android: "0.0.0" } }) });

export function lireVersionsAppServeur() {
  serveur.appels += 1;
  const reponse = serveur.reponse(serveur.appels);
  if (reponse === "rejette") return Promise.reject(new Error("hors ligne"));
  if (reponse === "jette") throw new TypeError("Network request failed");
  return Promise.resolve(reponse);
}
