// Robots, outils et vérifications automatiques : jamais comptés (même liste de mots que les statistiques de TabulaDB).
const ROBOT =
  /bot|crawl|spider|slurp|curl|wget|python|go-http|java\/|okhttp|axios|node-fetch|undici|headless|lighthouse|pagespeed|preview|monitor|uptime|scan|http-client|facebookexternalhit|feedfetcher|bingpreview|google-|mediapartners|ahrefs|semrush|petalbot|yandex|baidu|dataprovider|censys|zgrab/i;

/** Vrai si la signature du navigateur est celle d'un robot (ou absente, ce que font surtout les robots). */
export function estRobot(signature: string): boolean {
  return signature.trim().length < 10 || ROBOT.test(signature);
}
